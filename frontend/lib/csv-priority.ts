import type { StaffTask } from "./task-types.ts";

export type AcademicRecord = {
  id: string;
  name: string;
  attendance: number | null;
  absences: number | null;
  grades: Record<string, number | null>;
  history: { type: string; status: string; date: string }[];
};
export type ImportReport = {
  records: AcademicRecord[];
  attendanceRows: number;
  detailRows: number;
  continuationRows: number;
  warnings: string[];
};
export const priorityRules = {
  urgentAttendanceBelow: 75,
  urgentAbsencesAtLeast: 5,
  urgentAverageBelow: 60,
  reviewAttendanceBelow: 85,
  reviewAbsencesAtLeast: 3,
  reviewSubjectBelow: 65,
  followUpDays: 14,
} as const;

/** Small RFC-4180 reader: handles BOM, quoted commas, quoted newlines and escaped quotes. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}
function table(text: string, required: string[]) {
  const [header, ...rows] = parseCSV(text);
  if (!header || required.some((column) => !header.includes(column)))
    throw new Error(`Missing CSV columns: ${required.join(", ")}.`);
  return rows.map((row, index) => {
    if (row.length !== header.length)
      throw new Error(
        `CSV row ${index + 2} has ${row.length} fields, expected ${header.length}.`,
      );
    return Object.fromEntries(header.map((key, i) => [key, row[i].trim()]));
  });
}
function numeric(
  value: string,
  min: number,
  max: number,
  label: string,
): number | null {
  if (!value) return null;
  const result = Number(value);
  if (!Number.isFinite(result) || result < min || result > max)
    throw new Error(`Invalid ${label}: expected ${min}–${max}.`);
  return result;
}
export function importAcademic(
  attendanceCSV: string,
  detailCSV: string,
): ImportReport {
  const attendance = table(attendanceCSV, [
    "student_id",
    "name",
    "attendance_rate",
    "consecutive_absences",
  ]);
  const details = table(detailCSV, [
    "student_id",
    "name",
    "attendance_rate",
    "consecutive_absences",
    "grades__math",
    "grades__english",
    "grades__science",
    "past_interventions__type",
    "past_interventions__status",
    "past_interventions__date",
  ]);
  const records = new Map<string, AcademicRecord>();
  for (const row of attendance) {
    if (!row.student_id || !row.name || records.has(row.student_id))
      throw new Error(
        "Attendance IDs must be non-empty and unique, with a name.",
      );
    const absences = numeric(row.consecutive_absences, 0, 365, "absence count");
    if (absences !== null && !Number.isInteger(absences))
      throw new Error("Absence counts must be integers.");
    records.set(row.student_id, {
      id: row.student_id,
      name: row.name,
      attendance: numeric(row.attendance_rate, 0, 100, "attendance percentage"),
      absences,
      grades: {},
      history: [],
    });
  }
  let current: AcademicRecord | undefined,
    continuationRows = 0;
  const seen = new Set<string>();
  const warnings: string[] = [];
  for (const row of details) {
    if (row.student_id) {
      if (seen.has(row.student_id))
        throw new Error(`Duplicate student detail ID: ${row.student_id}.`);
      seen.add(row.student_id);
      current = records.get(row.student_id);
      if (!current) {
        if (!row.name) throw new Error("A detail student requires a name.");
        current = {
          id: row.student_id,
          name: row.name,
          attendance: null,
          absences: null,
          grades: {},
          history: [],
        };
        records.set(row.student_id, current);
        warnings.push(`${row.student_id}: not present in attendance CSV.`);
      }
      if (row.name && current.name !== row.name)
        throw new Error(`Conflicting names for ${row.student_id}.`);
      const rate = numeric(
        row.attendance_rate,
        0,
        100,
        "attendance percentage",
      );
      const absence = numeric(
        row.consecutive_absences,
        0,
        365,
        "absence count",
      );
      if (absence !== null && !Number.isInteger(absence))
        throw new Error("Absence counts must be integers.");
      if (
        current.attendance !== null &&
        rate !== null &&
        current.attendance !== rate
      )
        throw new Error(`Conflicting attendance for ${row.student_id}.`);
      if (
        current.absences !== null &&
        absence !== null &&
        current.absences !== absence
      )
        throw new Error(`Conflicting absences for ${row.student_id}.`);
      current.attendance ??= rate;
      current.absences ??= absence;
      current.grades = Object.fromEntries(
        ["math", "english", "science"].map((subject) => [
          subject,
          numeric(row[`grades__${subject}`], 0, 100, `${subject} grade`),
        ]),
      );
    } else {
      if (
        !current ||
        [
          "name",
          "attendance_rate",
          "consecutive_absences",
          "grades__math",
          "grades__english",
          "grades__science",
        ].some((key) => row[key])
      )
        throw new Error("Orphan or ambiguous intervention continuation row.");
      continuationRows++;
    }
    if (row.past_interventions__type) {
      if (
        !["Proposed", "Active", "Successful", "Failed"].includes(
          row.past_interventions__status,
        )
      )
        throw new Error("Unknown intervention status in CSV.");
      const date = row.past_interventions__date;
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
      )
        throw new Error("Intervention dates must be valid YYYY-MM-DD dates.");
      current!.history.push({
        type: row.past_interventions__type,
        status: row.past_interventions__status,
        date,
      });
    } else if (row.past_interventions__status || row.past_interventions__date)
      throw new Error(
        "An intervention status/date requires an intervention type.",
      );
  }
  for (const record of records.values())
    if (!seen.has(record.id))
      warnings.push(`${record.id}: grades/intervention history not provided.`);
  return {
    records: [...records.values()],
    attendanceRows: attendance.length,
    detailRows: details.length,
    continuationRows,
    warnings,
  };
}
const plusDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);

/** Transparent operational triage, never a clinical model or a grade decision. */
export function academicTasks(
  records: AcademicRecord[],
  asOf: string,
): StaffTask[] {
  return records.flatMap((record) => {
    const grades = Object.values(record.grades).filter(
      (value): value is number => value !== null,
    );
    const average = grades.length
      ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) /
        10
      : null;
    const lowest = grades.length ? Math.min(...grades) : null;
    const urgent =
      (record.attendance !== null &&
        record.attendance < priorityRules.urgentAttendanceBelow) ||
      (record.absences !== null &&
        record.absences >= priorityRules.urgentAbsencesAtLeast) ||
      (average !== null && average < priorityRules.urgentAverageBelow);
    const needsReview =
      urgent ||
      (record.attendance !== null &&
        record.attendance < priorityRules.reviewAttendanceBelow) ||
      (record.absences !== null &&
        record.absences >= priorityRules.reviewAbsencesAtLeast) ||
      (lowest !== null && lowest < priorityRules.reviewSubjectBelow);
    const active = record.history
      .filter((item) => item.status === "Active")
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    const proposed = record.history.find((item) => item.status === "Proposed");
    if (!needsReview && !active && !proposed) return [];
    const failed = record.history
      .filter((item) => item.status === "Failed")
      .map((item) => item.type);
    const reasons = [
      record.attendance !== null && record.attendance < 85
        ? `${record.attendance}% attendance`
        : "",
      (record.absences ?? 0) >= 3
        ? `${record.absences} consecutive absences`
        : "",
      lowest !== null && lowest < 65 ? `Lowest subject grade ${lowest}%` : "",
      active
        ? `Active ${active.type}; review date ${plusDays(active.date, 14)}`
        : "",
      proposed ? `Proposal awaiting review: ${proposed.type}` : "",
    ].filter(Boolean);
    const candidate = [
      "Faculty Mentorship",
      "Peer Tutoring",
      "Learning Plan Review",
      "Advisor Needs Review",
    ].find(
      (action) =>
        !failed.some(
          (previous) => previous.toLowerCase() === action.toLowerCase(),
        ),
    )!;
    const action = active
      ? `Review the current ${active.type} outcome before adding another intervention.`
      : proposed && !failed.includes(proposed.type)
        ? `Review the existing ${proposed.type} proposal with the student.`
        : `Discuss ${candidate} with the student and review before approval.`;
    const owner =
      (record.absences ?? 0) >= 3 ? "Batch Manager" : "Teacher / Instructor";
    return [
      {
        id: `academic-${record.id}`,
        kind: "academic",
        studentId: record.id,
        studentName: record.name,
        title: urgent
          ? "Prioritize an academic support review"
          : active
            ? "Review the active support plan"
            : "Review learning support",
        action,
        reasons,
        priority: urgent ? "P1" : needsReview || proposed ? "P2" : "P3",
        due:
          needsReview || proposed
            ? asOf
            : plusDays(active!.date, priorityRules.followUpDays),
        owner,
        assignedTo: null,
        status: "Open",
        privateRequest: false,
        evidence: {
          attendance: record.attendance,
          absences: record.absences,
          average,
          lowest,
          grades: record.grades,
        },
        history: record.history,
        excludedActions: failed,
      } satisfies StaffTask,
    ];
  });
}
