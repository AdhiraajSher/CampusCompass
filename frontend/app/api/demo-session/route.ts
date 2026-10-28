import { NextResponse, type NextRequest } from "next/server";
import { identities, workspaceFor } from "@/lib/domain";
import { createSessionToken, sessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin") || request.nextUrl.origin;
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    originUrl = new URL(request.nextUrl.origin);
  }

  const form = await request.formData();
  if (form.get("action") === "signout") {
    const response = NextResponse.redirect(new URL("/demo", originUrl), 303);
    response.cookies.set(sessionCookie, "", { maxAge: 0, path: "/", httpOnly: true });
    return response;
  }

  const identityId = form.get("identity");
  const identity = identities.find((i) => i.id === identityId);
  if (!identity)
    return new NextResponse("Unknown demo account", { status: 400 });

  const response = NextResponse.redirect(new URL(workspaceFor(identity), originUrl), 303);
  const token = createSessionToken(identity);

  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: originUrl.protocol === "https:" || process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 86400,
  });
  return response;
}
