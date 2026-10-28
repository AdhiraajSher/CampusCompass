import { authorize, apiError, jsonPrivate } from "@/lib/request-access";
import { portalStore } from "@/lib/portal-store";
export async function POST(request: Request) {
  const identity = await authorize(request, ["student"]);
  if (identity instanceof Response) return identity;
  try {
    return jsonPrivate(
      portalStore.requestSupport(identity, await request.json()),
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request) {
  const identity = await authorize(request, ["student"]);
  if (identity instanceof Response) return identity;
  try {
    const input = await request.json();
    return jsonPrivate(portalStore.cancelRequest(identity, String(input.id)));
  } catch (error) {
    return apiError(error);
  }
}
