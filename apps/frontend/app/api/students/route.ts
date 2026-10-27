import { NextResponse } from "next/server";
import { createBackendToken, getIdentity } from "@/lib/session";
export async function GET() {
  const identity = await getIdentity();
  if (!identity)
    return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  if (identity.role === "student")
    return NextResponse.json(
      { detail: "Staff access required" },
      { status: 403 },
    );
  try {
    const origin = process.env.API_BASE_URL ?? "http://127.0.0.1:8001";
    const response = await fetch(`${origin}/students`, {
      headers: { Authorization: `Bearer ${createBackendToken(identity.id)}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok)
      return NextResponse.json(
        { detail: "Student service unavailable" },
        { status: 502 },
      );
    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { detail: "Student service unavailable" },
      { status: 502 },
    );
  }
}
