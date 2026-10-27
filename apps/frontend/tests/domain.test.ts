import { studentsFor } from "../lib/data.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { identities, canPropose, nextRecommendation } from "../lib/domain.ts";
test("mentor serialization excludes other caseloads and all staff-only evidence", () => {
  const rows = studentsFor(identities[2]);
  assert.equal(rows.length, 3);
  for (const row of rows) {
    assert.equal(row.mentorId, "riya");
    for (const field of ["risk", "trend", "attendance", "grades", "missing"])
      assert.equal(field in row, false);
    assert.ok(row.history.every((h) => h.source === "mentor"));
    assert.equal(row.newAlert, false);
  }
  assert.ok(!JSON.stringify(rows).includes("Assignment reminder email"));
});
test("staff roles receive ranked evidence and mentor updates", () => {
  for (const identity of identities.slice(0, 2)) {
    const rows = studentsFor(identity);
    assert.equal(rows.length, 4);
    assert.equal(rows[0].risk, 86);
    assert.ok(rows[0].history.some((h) => h.source === "mentor"));
    assert.equal(rows[0].attendance?.[3], 62);
  }
});
test("failed actions cannot be proposed for the same issue", () => {
  const s = studentsFor(identities[0])[0];
  assert.equal(
    canPropose(s, "  ASSIGNMENT REMINDER EMAIL  ", "missed assignments"),
    false,
  );
  assert.equal(
    canPropose(s, "Guided tutoring session", "missed assignments"),
    true,
  );
  assert.equal(canPropose(s, "", "missed assignments"), false);
  assert.notEqual(
    nextRecommendation(s, "teacher"),
    "Assignment reminder email",
  );
});

test("failed mentoring support changes the next approach for its issue", () => {
  const student = studentsFor(identities[2])[0];
  student.history = student.history.map((h) => ({ ...h, status: "Failed" }));
  assert.equal(student.issue, "engagement");
  assert.notEqual(
    nextRecommendation(student, "mentor"),
    student.recommendation,
  );
  assert.equal(
    canPropose(student, student.history[0].title, student.issue),
    false,
  );
});
