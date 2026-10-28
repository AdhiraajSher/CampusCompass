import { NextResponse, type NextRequest } from "next/server";
import { identities, workspaceFor } from "@/lib/domain";
import { createDemoToken, sessionCookie } from "@/lib/session";
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  let originUrl: URL;
  try {
    if (!origin) throw new Error("Missing origin");
    originUrl = new URL(origin);
    if (
      originUrl.host !== request.headers.get("host") ||
      !["http:", "https:"].includes(originUrl.protocol)
    )
      throw new Error("Invalid origin");
  } catch {
    return new NextResponse("Invalid origin", { status: 403 });
  }
  const form = await request.formData();
  if (form.get("action") === "signout") {
    const response = NextResponse.redirect(new URL("/demo", originUrl), 303);
    response.cookies.set(sessionCookie, "", { maxAge: 0, path: "/" });
    return response;
  }
  const identity = identities.find((i) => i.id === form.get("identity"));
  if (!identity)
    return new NextResponse("Unknown demo account", { status: 400 });
  const response = NextResponse.redirect(
    new URL(workspaceFor(identity), originUrl),
    303,
  );
  response.cookies.set(sessionCookie, createDemoToken(identity.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: originUrl.protocol === "https:",
    path: "/",
    maxAge: 3600,
  });
  return response;
}
