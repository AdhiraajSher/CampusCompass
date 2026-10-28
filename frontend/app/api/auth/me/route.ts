import { NextResponse } from "next/server";
import { getIdentity } from "@/lib/session";

export async function GET() {
  const identity = await getIdentity();
  if (!identity) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ user: identity });
}
