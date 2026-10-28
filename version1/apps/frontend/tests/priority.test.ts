import { test } from "node:test";
import assert from "node:assert/strict";
import {
  importAcademic,
  academicTasks,
  parseCSV,
} from "../lib/csv-priority.ts";
import { PortalStore, validateStudentCheckIn } from "../lib/portal-store.ts";
import { identities } from "../lib/domain.ts";
import type { StaffTask } from "../lib/task-types.ts";

const attendance =
  'student_id,name,attendance_rate,consecutive_absences\r\nA,"Demo, One",70,5\r\nB,Demo Two,95,0\r\n';
const details =
  '\uFEFF"student_id","name","attendance_rate","consecutive_absences","grades__math","grades__english","grades__science","past_interventions__type","past_interventions__status","past_interventions__date"\r\n"A","Demo, One","70","5","55","60","58","Faculty Mentorship","Failed","2026-09-01"\r\n"","","","","","","","Warning Email","Failed","2026-09-20"\r\n"B","Demo Two","95","0","85","90","92","Peer Tutoring","Active","2026-10-20"\r\n';
const student = identities[3],
  teacher = identities[0],
  manager = identities[1],
  mentor = identities[2];
const checkIn = () =>
  validateStudentCheckIn({
    consent: true,
    shareSummary: false,
    values: {
      sleep: 1,
      diet: 2,
      activity: 3,
      mood: 1,
      peers: 2,
      context: null,
    },
  });
const academic = () =>
  academicTasks(importAcademic(attendance, details).records, "2026-10-28");

test("CSV join preserves continuation history, quoted commas and BOM", () => {
  const report = importAcademic(attendance, details);
  assert.equal(report.records.length, 2);
  assert.equal(report.continuationRows, 1);
  assert.equal(report.records[0].name, "Demo, One");
  assert.equal(report.records[0].history.length, 2);
  assert.deepEqual(parseCSV('a,b\n"one\ntwo","say ""hi"""'), [
    ["a", "b"],
    ["one\ntwo", 'say "hi"'],
  ]);
});
test("source conflicts and orphan continuation rows fail instead of producing a healthy queue", () => {
  assert.throws(
    () => importAcademic(attendance.replace(",70,5", ",71,5"), details),
    /Conflicting attendance/,
  );
  assert.throws(
    () =>
      importAcademic(
        attendance,
        details.replace(
          '"A","Demo, One","70","5","55","60","58","Faculty Mentorship","Failed","2026-09-01"',
          '"","","","","","","","Faculty Mentorship","Failed","2026-09-01"',
        ),
      ),
    /Orphan/,
  );
});
test("academic tasks preserve failed actions and schedule existing active plans", () => {
  const tasks = academic();
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].priority, "P1");
  assert.ok(!tasks[0].action.includes("Faculty Mentorship"));
  assert.deepEqual(tasks[0].excludedActions, [
    "Faculty Mentorship",
    "Warning Email",
  ]);
  assert.equal(tasks[1].priority, "P3");
  assert.equal(tasks[1].due, "2026-11-03");
});
test("privacy alone creates no task and private scores never reach staff", () => {
  const store = new PortalStore();
  store.saveCheckIn(student, checkIn());
  assert.equal(store.tasks(teacher, []).length, 0);
  store.requestSupport(student, {
    privateRequest: true,
    urgency: "soon",
    category: "Private conversation",
  });
  const task = store.tasks(teacher, [])[0];
  assert.equal(task.priority, "P1");
  assert.equal(task.privateRequest, true);
  for (const field of [
    "checkIn",
    "values",
    "result",
    "ccSummary",
    "score",
    "mood",
  ])
    assert.equal(field in task, false);
  assert.equal(
    task.reasons.some((reason) => reason.includes("Student asked")),
    true,
  );
});
test("same-priority private requests go first without outranking higher-priority academic cases", () => {
  const store = new PortalStore();
  store.requestSupport(student, {
    privateRequest: true,
    urgency: "routine",
    category: "Private conversation",
  });
  const p2 = { ...academic()[0], id: "p2", priority: "P2" } as StaffTask;
  const tasks = store.tasks(teacher, [...academic(), p2]);
  assert.equal(tasks[0].kind, "academic");
  assert.equal(tasks[1].privateRequest, true);
  assert.equal(tasks[2].id, "p2");
});
test("explicit summary consent shares only score and coverage for general requests", () => {
  const store = new PortalStore();
  const saved = checkIn();
  saved.shareSummary = true;
  store.saveCheckIn(student, saved);
  store.requestSupport(student, {
    privateRequest: false,
    urgency: "routine",
    category: "Study planning",
  });
  const shared = store.tasks(manager, [])[0];
  assert.ok(shared.ccSummary);
  assert.deepEqual(Object.keys(shared.ccSummary!).sort(), [
    "coverage",
    "score",
  ]);
  store.deleteCheckIn(student);
  assert.equal(store.tasks(manager, [])[0].ccSummary, undefined);
  assert.equal(store.tasks(manager, []).length, 1); // Help stays available after consent withdrawal.
});
test("student identity binding and staff authorization prevent cross-role and cross-student reads", () => {
  const store = new PortalStore();
  store.saveCheckIn(student, checkIn());
  assert.throws(() => store.studentView(teacher));
  assert.throws(() => store.tasks(student, []));
  assert.throws(() => store.tasks(mentor, []));
  const other = { ...student, id: "other", studentId: "DEMO-002" };
  assert.equal(store.studentView(other).checkIn, null);
  store.requestSupport(student, {
    privateRequest: true,
    urgency: "soon",
    category: "Private conversation",
  });
  assert.throws(() =>
    store.cancelRequest(other, store.studentView(student).requests[0].id),
  );
});
test("staff assignment/status synchronizes to the student's own request view", () => {
  const store = new PortalStore();
  store.requestSupport(student, {
    privateRequest: true,
    urgency: "soon",
    category: "Private conversation",
  });
  const id = store.tasks(teacher, [])[0].id;
  store.updateTask(
    teacher,
    id,
    { assignToMe: true, status: "In progress" },
    [],
  );
  const request = store.studentView(student).requests[0];
  assert.equal(request.status, "In progress");
  assert.equal(request.assignedTo, teacher.name);
  assert.throws(() =>
    store.updateTask(teacher, id, { owner: "Batch Manager" }, []),
  );
  store.cancelRequest(student, request.id);
  assert.equal(store.tasks(teacher, []).length, 0);
});
test("quiz validation rejects strings, invalid values and missing consent", () => {
  assert.throws(() => validateStudentCheckIn({ consent: false }));
  assert.throws(() =>
    validateStudentCheckIn({
      consent: true,
      shareSummary: false,
      values: { ...checkIn().values, mood: "5" },
    }),
  );
  assert.throws(() =>
    validateStudentCheckIn({
      consent: true,
      shareSummary: false,
      values: { ...checkIn().values, sleep: 6 },
    }),
  );
});
