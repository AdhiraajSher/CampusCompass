import type { Student, Identity } from "./domain.ts";
import seed from "../../../shared/fixtures/students.json" with { type: "json" };
const fixtures = seed as Student[];
/** Scope on the server, before serialization. Hidden staff fields never reach mentor clients. */
export function studentsFor(identity: Identity): Student[] {
  if (identity.role === "student") return [];
  const rows = structuredClone(fixtures);
  if (identity.role !== "mentor")
    return rows.sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0));
  return rows
    .filter((s) => s.mentorId === identity.id)
    .map((s) => ({
      id: s.id,
      name: s.name,
      initials: s.initials,
      cohort: "Assigned mentoring student",
      mentorId: s.mentorId,
      mentorName: s.mentorName,
      note: s.note,
      issue:
        s.history.find((h) => h.source === "mentor" && h.status === "Active")
          ?.issue ??
        s.history.find((h) => h.source === "mentor")?.issue ??
        "mentoring support",
      newAlert: false,
      due: s.due,
      history: s.history.filter((h) => h.source === "mentor"),
      recommendation:
        "Agree on one manageable study goal at the next mentor check-in.",
      rationale:
        "Discuss the student’s preferred support format and review the outcome of previous mentoring sessions.",
    }));
}
