import { NextResponse } from "next/server";
import { createDemoToken, getIdentity } from "@/lib/session";

const BACKEND_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  const identity = await getIdentity();
  if (!identity) {
    return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/checkin/status`, {
      headers: {
        Authorization: `Bearer ${createDemoToken(identity.id)}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: "pending", question: `Hey ${identity.name.split(" ")[0]}, how are you feeling with classes today?` },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({
      status: "pending",
      question: `Hey ${identity.name.split(" ")[0]}, how are you holding up with your classes and energy today?`,
    });
  }
}
