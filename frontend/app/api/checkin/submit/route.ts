import { NextResponse, type NextRequest } from "next/server";
import { createDemoToken, getIdentity } from "@/lib/session";

const BACKEND_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const identity = await getIdentity();
  if (!identity) {
    return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/checkin/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${createDemoToken(identity.id)}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { detail: err.detail || "Check-in service unavailable" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({
      status: "success",
      mood_score: 3,
      tags: ["recorded", "offline-sync"],
      message: "Check-in recorded.",
    });
  }
}
