import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { identities, type Identity } from "./domain";

// Standard demo session secret with stable fallback for serverless lambda consistency
const key =
  process.env.DEMO_SESSION_SECRET ?? "development-demo-only-change-me";
const cookieName = "campuscompass_final_demo";

/** Create backend Bearer token forwardable to the Python API */
export function createBackendToken(id: string) {
  const payload = Buffer.from(
    JSON.stringify({ id, exp: Date.now() + 86_400_000 }),
  ).toString("base64url");
  const serviceKey =
    process.env.DEMO_SESSION_SECRET ?? "development-demo-only-change-me";
  return `${payload}.${createHmac("sha256", serviceKey).update(payload).digest("base64url")}`;
}

/** Create HMAC token by ID */
export function createDemoToken(id: string) {
  const payload = Buffer.from(
    JSON.stringify({ id, exp: Date.now() + 86_400_000 }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

/** Create rich session token embedding identity attributes */
export function createSessionToken(identityOrId: Identity | string) {
  if (typeof identityOrId === "string") {
    const found = identities.find((i) => i.id === identityOrId);
    if (found) {
      return createTokenForIdentity(found);
    }
    return createDemoToken(identityOrId);
  }
  return createTokenForIdentity(identityOrId);
}

function createTokenForIdentity(identity: Identity) {
  const payload = Buffer.from(
    JSON.stringify({
      id: identity.id,
      name: identity.name,
      role: identity.role,
      title: identity.title,
      studentId: identity.studentId,
      email: identity.email,
      exp: Date.now() + 86_400_000, // 24h
    }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

/** Retrieve and verify the active authenticated identity from session cookie */
export async function getIdentity(): Promise<Identity | null> {
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return null;
  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature) return null;
    const expected = createHmac("sha256", key).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;

    // 1. If payload contains rich identity attributes, reconstruct identity
    if (parsed.role && parsed.name) {
      return {
        id: parsed.id,
        name: parsed.name,
        role: parsed.role,
        title: parsed.title ?? (
          parsed.role === "student"
            ? "Student / private demo"
            : parsed.role === "teacher"
              ? "Teacher / Instructor"
              : parsed.role === "mentor"
                ? "Mentor"
                : "Batch Manager"
        ),
        studentId: parsed.studentId ?? parsed.student_id,
        email: parsed.email,
      };
    }

    // 2. Direct match by ID in known identities
    const found = identities.find((i) => i.id === parsed.id);
    if (found) return found;

    // 3. Fallback map from backend UUIDs
    if (parsed.id === "00000000-0000-0000-0000-000000000010" || parsed.id === "teacher") {
      return identities.find((i) => i.id === "anika") ?? null;
    }
    if (parsed.id === "00000000-0000-0000-0000-000000000020" || parsed.id === "mentor") {
      return identities.find((i) => i.id === "riya") ?? null;
    }
    if (parsed.id === "00000000-0000-0000-0000-000000000001" || parsed.id === "student") {
      return identities.find((i) => i.id === "studentdemo") ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

export const sessionCookie = cookieName;
