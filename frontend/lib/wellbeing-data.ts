import type { Identity } from "./domain";
import {
  calculateCC,
  type CheckIn,
  type Rating,
  type WellbeingProfile,
} from "./cc-score";
type Seed = {
  id: string;
  name: string;
  initials: string;
  mentorId: string;
  mentorName: string;
  entries: CheckIn[];
};
const entry = (
  id: string,
  date: string,
  values: (Rating | null)[],
  shareSummary = true,
): CheckIn => ({
  id,
  date,
  consent: true,
  shareSummary,
  values: {
    sleep: values[0],
    diet: values[1],
    activity: values[2],
    mood: values[3],
    peers: values[4],
    context: values[5],
  },
  contextTags: ["Commute", "Course workload"],
  measurements: { sleepHours: 6.5, activeMinutes: 25, mealDays: 5 },
});
// Fictional demo check-ins; these are NOT records from a public health dataset.
const profiles: Seed[] = [
  {
    id: "ST-001",
    name: "Aarav Shah",
    initials: "AS",
    mentorId: "riya",
    mentorName: "Riya Sen",
    entries: [
      entry("a1", "2026-10-21", [2, 3, 2, 2, 3, 2]),
      entry("a2", "2026-10-24", [3, 3, 2, 3, 3, 2]),
      entry("a3", "2026-10-27", [3, 4, 3, 3, 4, 2]),
    ],
  },
  {
    id: "ST-002",
    name: "Meera Iyer",
    initials: "MI",
    mentorId: "riya",
    mentorName: "Riya Sen",
    entries: [
      entry("m1", "2026-10-22", [3, 3, 3, 3, 4, 3], false),
      entry("m2", "2026-10-27", [4, 4, 3, 4, 4, 3], false),
    ],
  },
  {
    id: "ST-003",
    name: "Kabir Patel",
    initials: "KP",
    mentorId: "dev",
    mentorName: "Dev Kumar",
    entries: [
      entry("k1", "2026-10-22", [3, 3, 3, 3, 3, 3]),
      entry("k2", "2026-10-27", [4, 4, 3, 4, 4, 4]),
    ],
  },
  {
    id: "ST-004",
    name: "Zoya Khan",
    initials: "ZK",
    mentorId: "riya",
    mentorName: "Riya Sen",
    entries: [entry("z1", "2026-10-27", [4, null, null, 4, 5, null])],
  },
];
/** Scope before serialization: staff see consented summaries; mentors see only their caseload. */
export function wellbeingFor(identity: Identity): WellbeingProfile[] {
  if (identity.role === "student") return [];
  return profiles
    .filter(
      (profile) =>
        identity.role !== "mentor" || profile.mentorId === identity.id,
    )
    .map((profile) => {
      const latest = profile.entries.at(-1)!;
      const details = identity.role === "mentor";
      const allowed = latest.consent && (details || latest.shareSummary);
      return {
        id: profile.id,
        name: profile.name,
        initials: profile.initials,
        mentorName: profile.mentorName,
        access: details ? "details" : allowed ? "summary" : "withheld",
        summary: allowed ? calculateCC(latest) : null,
        date: allowed ? latest.date : null,
        history: allowed
          ? profile.entries
              .filter(
                (record) => record.consent && (details || record.shareSummary),
              )
              .map((record) => ({
                date: record.date,
                score: calculateCC(record).score,
                answered: calculateCC(record).answered,
              }))
          : [],
        ...(details
          ? {
              checkIn: structuredClone(latest),
              moodHistory: profile.entries
                .filter((record) => record.consent)
                .map((record) => ({
                  date: record.date,
                  rating: record.values.mood,
                })),
            }
          : {}),
      };
    });
}
