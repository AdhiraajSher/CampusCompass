import { authorize, apiError, jsonPrivate } from "@/lib/request-access";
import { portalStore, validateStudentCheckIn } from "@/lib/portal-store";
export async function GET(request: Request) {
  const identity = await authorize(request, ["student"]);
  if (identity instanceof Response) return identity;
  return jsonPrivate(portalStore.studentView(identity));
}
export async function POST(request: Request) {
  const identity = await authorize(request, ["student"]);
  if (identity instanceof Response) return identity;
  try {
    return jsonPrivate(
      portalStore.saveCheckIn(
        identity,
        validateStudentCheckIn(await request.json()),
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function DELETE(request: Request) {
  const identity = await authorize(request, ["student"]);
  if (identity instanceof Response) return identity;
  return jsonPrivate(portalStore.deleteCheckIn(identity));
}
