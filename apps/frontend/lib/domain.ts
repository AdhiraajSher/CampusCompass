export type Role = "teacher" | "manager" | "mentor" | "student";
export type Status =
  "Proposed" | "Active" | "Successful" | "Failed" | "Rejected";
export type Intervention = {
  id: string;
  title: string;
  issue: string;
  status: Status;
  source: "staff" | "mentor";
  date: string;
  owner: string;
  reviewDays: number;
};
export type Student = {
  id: string;
  name: string;
  initials: string;
  cohort: string;
  mentorId: string;
  mentorName: string;
  note: string;
  risk?: number;
  trend?: number[];
  attendance?: number[];
  grades?: number[];
  missing?: number;
  issue: string;
  newAlert: boolean;
  due: boolean;
  history: Intervention[];
  recommendation: string;
  rationale: string;
};
export type Identity = {
  id: string;
  name: string;
  role: Role;
  title: string;
  studentId?: string;
};
export const identities: Identity[] = [
  {
    id: "anika",
    name: "Anika Rao",
    role: "teacher",
    title: "Teacher / Instructor",
  },
  { id: "sam", name: "Sam Thomas", role: "manager", title: "Batch Manager" },
  { id: "riya", name: "Riya Sen", role: "mentor", title: "Mentor" },
  {
    id: "studentdemo",
    name: "Demo student",
    role: "student",
    title: "Student / private demo",
    studentId: "DEMO-001",
  },
];
export function workspaceFor(identity: Identity) {
  return identity.role === "student"
    ? "/student"
    : identity.role === "mentor"
      ? "/wellbeing"
      : "/tasks";
}
export function canPropose(
  student: Student,
  title: string,
  issue: string,
): boolean {
  const normalized = title.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    !student.history.some(
      (h) =>
        h.status === "Failed" &&
        h.issue === issue &&
        h.title.trim().toLowerCase() === normalized,
    )
  );
}
export function nextRecommendation(student: Student, role: Role): string {
  if (
    student.history.some(
      (h) => h.status === "Failed" && h.issue === student.issue,
    )
  )
    return role === "mentor"
      ? "Offer a different check-in format and agree on a smaller goal."
      : "Arrange an educator-led needs review and agree on a different support format.";
  return student.recommendation;
}
