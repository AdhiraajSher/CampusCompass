import { NextResponse, type NextRequest } from "next/server";
import { sessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") || request.nextUrl.origin;
  const redirectUrl = new URL("/demo", origin);

  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin") || request.nextUrl.origin;
  const redirectUrl = new URL("/demo", origin);

  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
