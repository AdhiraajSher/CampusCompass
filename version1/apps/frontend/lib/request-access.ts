import { NextResponse } from "next/server";
import { getIdentity } from "./session";
import { AccessError } from "./portal-store";
import type { Role } from "./domain";

export async function authorize(request: Request, roles: Role[]) {
  const identity = await getIdentity();
  if (!identity)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!roles.includes(identity.role))
    return NextResponse.json(
      { error: "This workspace is not available to your role." },
      { status: 403 },
    );
  if (request.method !== "GET") {
    try {
      const origin = request.headers.get("origin");
      if (!origin || new URL(origin).host !== request.headers.get("host"))
        throw new Error();
    } catch {
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    }
  }
  return identity;
}
export function jsonPrivate(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function apiError(error: unknown) {
  return jsonPrivate(
    { error: error instanceof Error ? error.message : "Request failed." },
    error instanceof AccessError ? 403 : 400,
  );
}
