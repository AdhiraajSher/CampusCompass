export const factors = [
  {
    key: "sleep",
    label: "Sleep & rhythm",
    question: "My sleep has felt restful and regular.",
    short: "Rest and routine",
    idea: "Ask whether timetable or travel adjustments would help make rest more manageable.",
  },
  {
    key: "diet",
    label: "Food & routine",
    question: "I have access to regular meals that work for me.",
    short: "Food access and regularity",
    idea: "Offer a private conversation about meal access and campus support options.",
  },
  {
    key: "activity",
    label: "Movement & energy",
    question:
      "I have had chances for movement or activity that feels comfortable for me.",
    short: "Accessible movement",
    idea: "Ask what accessible activities or breaks the student would find helpful.",
  },
  {
    key: "mood",
    label: "Emotional wellbeing",
    question: "I have felt emotionally supported and able to manage my day.",
    short: "Self-reported mood",
    idea: "Offer a private, optional mentor or qualified counselor conversation.",
  },
  {
    key: "peers",
    label: "Peer connection",
    question: "I feel that I belong and have someone I can turn to.",
    short: "Belonging and support",
    idea: "Ask whether a buddy, small study group, or another support person would feel useful.",
  },
  {
    key: "context",
    label: "Everyday pressures",
    question: "My responsibilities outside class have felt manageable.",
    short: "External demands",
    idea: "Discuss practical adjustments for travel, workload, caring duties, or other pressures the student chooses to share.",
  },
] as const;
export type Factor = (typeof factors)[number]["key"];
export type Rating = 1 | 2 | 3 | 4 | 5;
export type CheckIn = {
  id: string;
  date: string;
  consent: boolean;
  shareSummary: boolean;
  values: Record<Factor, Rating | null>;
  contextTags: string[];
  measurements?: {
    sleepHours: number | null;
    activeMinutes: number | null;
    mealDays: number | null;
  };
};
export type CCResult = {
  score: number | null;
  answered: number;
  total: 6;
  coverage: number;
  reason: "ready" | "consent" | "missing";
};
export type SummaryPoint = {
  date: string;
  score: number | null;
  answered: number;
};
export type WellbeingProfile = {
  id: string;
  name: string;
  initials: string;
  mentorName: string;
  access: "details" | "summary" | "withheld";
  summary: CCResult | null;
  date: string | null;
  history: SummaryPoint[];
  checkIn?: CheckIn;
  moodHistory?: { date: string; rating: Rating | null }[];
};

/** Prototype rubric v0.1: equal weights, no clinical validation or academic evaluation. */
export function calculateCC(checkIn: CheckIn): CCResult {
  const values = factors
    .map(({ key }) => checkIn.values[key])
    .filter((value) => value !== null);
  if (
    values.some((value) => !Number.isInteger(value) || value! < 1 || value! > 5)
  )
    throw new RangeError("Ratings must be whole numbers from 1 to 5, or null.");
  const answered = values.length;
  const base = {
    answered,
    total: 6 as const,
    coverage: Math.round((answered / 6) * 100),
  };
  if (!checkIn.consent) return { ...base, score: null, reason: "consent" };
  if (answered < 4) return { ...base, score: null, reason: "missing" };
  return {
    ...base,
    score: Math.round(
      values.reduce<number>((sum, value) => sum + (value! - 1) * 25, 0) /
        answered,
    ),
    reason: "ready",
  };
}
export function supportIdeas(checkIn: CheckIn): string[] {
  if (!checkIn.consent) return [];
  return factors
    .filter(
      ({ key }) => checkIn.values[key] !== null && checkIn.values[key]! <= 2,
    )
    .map(({ idea }) => idea);
}
