import type { Student } from "./domain";

/** Browser calls the same-origin Next route; service credentials stay server-side. */
export async function loadStudents(signal?: AbortSignal): Promise<Student[]> {
  const response = await fetch("/api/students", { signal, cache: "no-store" });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Your demo session has expired. Sign in again."
        : "The student service is unavailable. Check that the backend is running.",
    );
  return response.json() as Promise<Student[]>;
}

/** Ask the backend AI engine for a new recommendation after a failed intervention. */
export async function evaluateIntervention(
  studentId: string,
  failedType: string,
  currentMetrics: Record<string, unknown> = {},
): Promise<{ new_recommended_action: string; reason: string }> {
  const response = await fetch("/api/interventions/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      failed_intervention_type: failedType,
      current_metrics: currentMetrics,
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(body.detail ?? "Evaluation failed");
  }
  return response.json();
}

/** Record a new intervention proposal through the backend. */
export async function createIntervention(payload: {
  student_id: string;
  title: string;
  issue: string;
  source: string;
  owner: string;
  review_days: number;
}): Promise<{ intervention_id: string; status: string }> {
  const response = await fetch("/api/interventions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(body.detail ?? "Failed to create intervention");
  }
  return response.json();
}
