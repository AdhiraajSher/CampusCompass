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
