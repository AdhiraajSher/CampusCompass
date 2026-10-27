import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { identities, type Identity } from "./domain";
// Demo-only signed session. Replace this adapter with the institution's OIDC provider.
const serverGlobal = globalThis as typeof globalThis & {
  __campusDemoKey?: string;
};
const key =
  process.env.DEMO_SESSION_SECRET ??
  (serverGlobal.__campusDemoKey ??= randomBytes(32).toString("hex"));
const cookieName = "campuscompass_demo";
export function createDemoToken(id: string) {
  const payload = Buffer.from(
    JSON.stringify({ id, exp: Date.now() + 3_600_000 }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}
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
    return identities.find((i) => i.id === parsed.id) ?? null;
  } catch {
    return null;
  }
}
export const sessionCookie = cookieName;
