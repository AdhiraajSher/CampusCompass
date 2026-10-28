export type TaskStatus = "Open" | "In progress" | "Done";
export type Priority = "P1" | "P2" | "P3";
export type StaffTask = {
  id: string;
  kind: "academic" | "support-request";
  studentId: string;
  studentName: string;
  title: string;
  action: string;
  reasons: string[];
  priority: Priority;
  due: string;
  owner: "Teacher / Instructor" | "Batch Manager";
  assignedTo: string | null;
  status: TaskStatus;
  privateRequest: boolean;
  urgency?: "soon" | "routine";
  requestedAt?: string;
  evidence?: {
    attendance: number | null;
    absences: number | null;
    average: number | null;
    lowest: number | null;
    grades: Record<string, number | null>;
  };
  history?: { type: string; status: string; date: string }[];
  excludedActions?: string[];
  ccSummary?: { score: number; coverage: number };
};
export function sortTasks(tasks: StaffTask[]) {
  return [...tasks].sort(
    (a, b) =>
      a.priority.localeCompare(b.priority) ||
      Number(b.privateRequest) - Number(a.privateRequest) ||
      a.due.localeCompare(b.due) ||
      a.studentId.localeCompare(b.studentId),
  );
}
