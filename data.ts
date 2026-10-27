import type { Student, Identity } from "./domain.ts";
const fixtures: Student[] = [
  {
    id: "ST-001",
    name: "Aarav Shah",
    initials: "AS",
    cohort: "Computer Science · A",
    mentorId: "riya",
    mentorName: "Riya Sen",
    note: "Finding it hard to balance travel and coursework. An afternoon check-in would work better than a morning session.",
    risk: 86,
    trend: [48, 58, 73, 86],
    attendance: [85, 78, 70, 62],
    grades: [70, 64, 55, 48],
    missing: 3,
    issue: "missed assignments",
    newAlert: true,
    due: true,
    history: [
      {
        id: "i1",
        title: "Assignment reminder email",
        issue: "missed assignments",
        status: "Failed",
        source: "staff",
        date: "12 Oct",
        owner: "Anika Rao",
        reviewDays: 14,
      },
      {
        id: "i2",
        title: "Weekly mentor check-in",
        issue: "engagement",
        status: "Active",
        source: "mentor",
        date: "13 Oct",
        owner: "Riya Sen",
        reviewDays: 14,
      },
    ],
    recommendation: "Arrange a guided catch-up session with a peer tutor.",
    rationale:
      "Three missing assignments and declining attendance suggest a need for practical support. A reminder email failed for this issue, so the proposal changes the approach.",
  },
  {
    id: "ST-002",
    name: "Meera Iyer",
    initials: "MI",
    cohort: "Computer Science · A",
    mentorId: "riya",
    mentorName: "Riya Sen",
    note: "Requested help structuring exam preparation. A weekly planning session helped her complete the previous study goal.",
    risk: 74,
    trend: [55, 60, 69, 74],
    attendance: [89, 81, 76, 71],
    grades: [73, 68, 60, 58],
    missing: 2,
    issue: "exam preparation",
    newAlert: true,
    due: false,
    history: [
      {
        id: "i3",
        title: "Weekly study planning",
        issue: "exam preparation",
        status: "Successful",
        source: "mentor",
        date: "20 Oct",
        owner: "Riya Sen",
        reviewDays: 7,
      },
    ],
    recommendation:
      "Offer a focused revision session with practice-question review.",
    rationale:
      "Assessment results have fallen over four weeks. Build on the successful planning session with more targeted academic support.",
  },
  {
    id: "ST-003",
    name: "Kabir Patel",
    initials: "KP",
    cohort: "Computer Science · B",
    mentorId: "dev",
    mentorName: "Dev Kumar",
    note: "An accountability check-in is underway. Outcome feedback is now due.",
    risk: 61,
    trend: [72, 69, 66, 61],
    attendance: [68, 73, 76, 79],
    grades: [54, 58, 61, 64],
    missing: 1,
    issue: "engagement",
    newAlert: false,
    due: true,
    history: [
      {
        id: "i4",
        title: "Weekly accountability session",
        issue: "engagement",
        status: "Active",
        source: "mentor",
        date: "13 Oct",
        owner: "Dev Kumar",
        reviewDays: 14,
      },
    ],
    recommendation:
      "Review the accountability session outcome before adding support.",
    rationale:
      "Attendance and grades are improving. Record the existing intervention outcome before deciding what should happen next.",
  },
  {
    id: "ST-004",
    name: "Zoya Khan",
    initials: "ZK",
    cohort: "Computer Science · A",
    mentorId: "riya",
    mentorName: "Riya Sen",
    note: "Completed the agreed study goal and would like to continue the same weekly routine.",
    risk: 38,
    trend: [64, 53, 44, 38],
    attendance: [72, 81, 86, 91],
    grades: [58, 64, 70, 76],
    missing: 0,
    issue: "study routine",
    newAlert: false,
    due: false,
    history: [
      {
        id: "i5",
        title: "Weekly study routine",
        issue: "study routine",
        status: "Successful",
        source: "mentor",
        date: "23 Oct",
        owner: "Riya Sen",
        reviewDays: 7,
      },
    ],
    recommendation:
      "Maintain the study routine and check in again in two weeks.",
    rationale:
      "The previous support worked and current indicators are improving. Continue light-touch monitoring.",
  },
];
/** Scope on the server, before serialization. Hidden staff fields never reach mentor clients. */
export function studentsFor(identity: Identity): Student[] {
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
