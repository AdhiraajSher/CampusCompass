import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { academicTasks, importAcademic } from "./csv-priority.ts";

export function importSnapshot() {
  const folder = join(process.cwd(), "data", "imports");
  const attendancePath = join(folder, "attendance.csv");
  const studentsPath = join(folder, "students.csv");
  const hasAttendance = existsSync(attendancePath);
  const hasStudents = existsSync(studentsPath);
  if (hasAttendance !== hasStudents)
    throw new Error(
      "Both local import files are required: attendance.csv and students.csv.",
    );
  const local = hasAttendance && hasStudents;
  const samples = join(process.cwd(), "..", "..", "shared", "fixtures");
  const report = importAcademic(
    readFileSync(
      local ? attendancePath : join(samples, "attendance.sample.csv"),
      "utf8",
    ),
    readFileSync(
      local ? studentsPath : join(samples, "students.sample.csv"),
      "utf8",
    ),
  );
  const asOf = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  return {
    tasks: academicTasks(report.records, asOf),
    metadata: {
      students: report.records.length,
      attendanceRows: report.attendanceRows,
      detailRows: report.detailRows,
      continuationRows: report.continuationRows,
      warnings: report.warnings,
      asOf,
      sources: local
        ? ["Student Attendance Data.csv", "student (1).csv"]
        : ["Synthetic attendance sample", "Synthetic student-detail sample"],
      period: "Attendance and grade reporting periods were not supplied.",
    },
  };
}
