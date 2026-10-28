import { NextResponse, type NextRequest } from "next/server";
import { createDemoToken, getIdentity } from "@/lib/session";

const BACKEND_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  const identity = await getIdentity();
  if (!identity)
    return NextResponse.json({ detail: "Sign in required" }, { status: 401 });

  // STRICT RBAC CHECK: Students are not permitted to evaluate interventions
  if (identity.role === "student") {
    return NextResponse.json(
      { detail: "Security violation: Students are not authorized to evaluate interventions." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/interventions/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${createDemoToken(identity.id)}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => ({
        detail: "Evaluation service unavailable",
      }));
      return NextResponse.json(detail, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { detail: "Evaluation service unavailable" },
      { status: 502 },
    );
  }
}
