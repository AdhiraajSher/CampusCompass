import { authorize, apiError, jsonPrivate } from "@/lib/request-access";
import { portalStore } from "@/lib/portal-store";
import { importSnapshot } from "@/lib/imports";
export async function GET(request: Request) {
  const identity = await authorize(request, ["teacher", "manager"]);
  if (identity instanceof Response) return identity;
  try {
    const snapshot = importSnapshot();
    return jsonPrivate({
      tasks: portalStore.tasks(identity, snapshot.tasks),
      metadata: snapshot.metadata,
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(request: Request) {
  const identity = await authorize(request, ["teacher", "manager"]);
  if (identity instanceof Response) return identity;
  try {
    const input = await request.json();
    return jsonPrivate(
      portalStore.updateTask(
        identity,
        String(input.id),
        input,
        importSnapshot().tasks,
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
