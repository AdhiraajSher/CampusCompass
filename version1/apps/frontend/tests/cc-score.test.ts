import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateCC,
  supportIdeas,
  type CheckIn,
  type Rating,
} from "../lib/cc-score.ts";
import { wellbeingFor } from "../lib/wellbeing-data.ts";
import { identities } from "../lib/domain.ts";

const sample = (rating: Rating = 3): CheckIn => ({
  id: "test",
  date: "2026-10-28",
  consent: true,
  shareSummary: true,
  contextTags: [],
  values: {
    sleep: rating,
    diet: rating,
    activity: rating,
    mood: rating,
    peers: rating,
    context: rating,
  },
});

test("CC endpoints and equal weighting are explicit and bounded", () => {
  assert.equal(calculateCC(sample(1)).score, 0);
  assert.equal(calculateCC(sample(3)).score, 50);
  assert.equal(calculateCC(sample(5)).score, 100);
  const input = sample();
  input.values = {
    sleep: 3,
    diet: 4,
    activity: 3,
    mood: 3,
    peers: 4,
    context: 2,
  };
  assert.equal(calculateCC(input).score, 54);
});
test("missing data is excluded instead of penalized; below four areas no score is created", () => {
  const input = sample(5);
  input.values.sleep = null;
  input.values.diet = null;
  assert.equal(calculateCC(input).score, 100);
  assert.equal(calculateCC(input).answered, 4);
  input.values.activity = null;
  assert.equal(calculateCC(input).score, null);
  assert.equal(calculateCC(input).reason, "missing");
});
test("consent is required for scoring and suggestions", () => {
  const input = sample(1);
  input.consent = false;
  assert.equal(calculateCC(input).score, null);
  assert.deepEqual(supportIdeas(input), []);
});
test("invalid scores are rejected and outside-pressure tags never add penalties", () => {
  const input = sample();
  input.contextTags = ["Food access", "Paid work"];
  assert.equal(calculateCC(input).score, 50);
  input.values.sleep = 99 as Rating;
  assert.throws(() => calculateCC(input), RangeError);
});
test("staff receive summaries only and unshared records carry no wellbeing data", () => {
  for (const identity of identities.slice(0, 2)) {
    const rows = wellbeingFor(identity);
    assert.ok(rows.every((row) => !("checkIn" in row)));
    assert.ok(rows.every((row) => !("moodHistory" in row)));
    const withheld = rows.find((row) => row.id === "ST-002")!;
    assert.equal(withheld.access, "withheld");
    assert.equal(withheld.summary, null);
    assert.deepEqual(withheld.history, []);
    assert.equal(withheld.date, null);
    assert.ok(!JSON.stringify(rows).includes("contextTags"));
  }
});
test("mentors receive only their assigned records with details", () => {
  const rows = wellbeingFor(identities[2]);
  assert.equal(rows.length, 3);
  assert.ok(!rows.some((row) => row.id === "ST-003"));
  assert.ok(rows.every((row) => row.access === "details" && row.checkIn));
  assert.equal(rows.find((row) => row.id === "ST-004")?.summary?.score, null);
});
