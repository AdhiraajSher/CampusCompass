"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Moon,
  Utensils,
  Footprints,
  HeartHandshake,
  Users,
  Leaf,
  ShieldCheck,
  LockKeyhole,
  Plus,
  Check,
  ChevronRight,
  Download,
  BookOpen,
  EyeOff,
} from "lucide-react";
import { Scramble } from "./effects";
import {
  calculateCC,
  factors,
  supportIdeas,
  type CheckIn,
  type Rating,
  type SummaryPoint,
  type WellbeingProfile,
} from "@/lib/cc-score";
import type { Identity } from "@/lib/domain";
import research from "@/public/data/open-context.json";

const icons = [Moon, Utensils, Footprints, HeartHandshake, Users, Leaf];
const ratingLabels = [
  "Strongly disagree",
  "Disagree",
  "Mixed",
  "Agree",
  "Strongly agree",
];
const demands = [
  "Commute",
  "Course workload",
  "Paid work",
  "Caring duties",
  "Food access",
  "Digital access",
  "Other",
];
const todayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

function Trend({ points }: { points: SummaryPoint[] }) {
  const x = (index: number) =>
    18 + index * (324 / Math.max(points.length - 1, 1));
  return (
    <div className="cc-trend">
      <svg
        viewBox="0 0 360 125"
        role="img"
        aria-label={`CC Score history: ${points.map((point) => `${point.date}: ${point.score ?? "insufficient data"}`).join("; ")}`}
      >
        {[0, 50, 100].map((value) => (
          <g key={value}>
            <line
              x1="15"
              x2="347"
              y1={108 - value * 0.88}
              y2={108 - value * 0.88}
              stroke="#b9cbbf"
              strokeDasharray="3 5"
            />
            <text x="0" y={111 - value * 0.88} fontSize="7" fill="#5d7565">
              {value}
            </text>
          </g>
        ))}
        {points.map((point, index) => (
          <g key={`${point.date}-${index}`}>
            {point.score !== null && (
              <>
                {index > 0 && points[index - 1].score !== null && (
                  <line
                    x1={x(index - 1)}
                    x2={x(index)}
                    y1={108 - points[index - 1].score! * 0.88}
                    y2={108 - point.score * 0.88}
                    stroke="#08872b"
                    strokeWidth="2"
                  />
                )}
                <circle
                  cx={x(index)}
                  cy={108 - point.score * 0.88}
                  r="4"
                  fill="#08872b"
                  stroke="#f4f8ef"
                  strokeWidth="2"
                />
              </>
            )}
            <text
              x={x(index)}
              y="123"
              textAnchor="middle"
              fontSize="8"
              fill="#5d7565"
            >
              {dateLabel(point.date)}
            </text>
          </g>
        ))}
      </svg>
      <span className="mono">Fictional check-ins · gaps remain unscored</span>
    </div>
  );
}

export function WellbeingDashboard({
  identity,
  initialProfiles,
  initialSelected,
}: {
  identity: Identity;
  initialProfiles: WellbeingProfile[];
  initialSelected?: string;
}) {
  const mentor = identity.role === "mentor";
  const [profiles, setProfiles] = useState(initialProfiles);
  const [selected, setSelected] = useState(
    initialProfiles.some((item) => item.id === initialSelected)
      ? initialSelected!
      : initialProfiles[0].id,
  );
  const [tab, setTab] = useState<"overview" | "checkin" | "sources">(
    "overview",
  );
  const [draft, setDraft] = useState<CheckIn | null>(null);
  const [notice, setNotice] = useState("");
  const [plan, setPlan] = useState("");
  const [approved, setApproved] = useState(false);
  const profile = profiles.find((item) => item.id === selected)!;
  const result = profile.summary;
  const raw = profile.checkIn;
  const score = result?.score ?? null;
  const ideas = raw ? supportIdeas(raw) : [];
  const shared = profiles.filter(
    (item) => item.access !== "withheld" && item.summary?.score != null,
  ).length;

  function choose(next: WellbeingProfile) {
    setSelected(next.id);
    setTab("overview");
    setDraft(null);
    setNotice("");
    setPlan("");
    setApproved(false);
  }
  function startCheckIn() {
    if (!mentor || !raw) return;
    setDraft({
      ...structuredClone(raw),
      id: "draft",
      date: todayDate(),
      consent: false,
      shareSummary: false,
    });
    setTab("checkin");
    setNotice("");
  }
  function saveCheckIn() {
    if (!mentor || !draft?.consent) {
      setNotice(
        "Confirm voluntary consent before recording this demo check-in.",
      );
      return;
    }
    const saved = { ...draft, id: crypto.randomUUID() };
    const summary = calculateCC(saved);
    setProfiles((items) =>
      items.map((item) =>
        item.id === selected
          ? {
              ...item,
              checkIn: saved,
              summary,
              date: saved.date,
              moodHistory: [
                ...(item.moodHistory ?? []).filter(
                  (point) => point.date !== saved.date,
                ),
                { date: saved.date, rating: saved.values.mood },
              ].sort((a, b) => a.date.localeCompare(b.date)),
              history: [
                ...item.history.filter((point) => point.date !== saved.date),
                {
                  date: saved.date,
                  score: summary.score,
                  answered: summary.answered,
                },
              ].sort((a, b) => a.date.localeCompare(b.date)),
            }
          : item,
      ),
    );
    setTab("overview");
    setDraft(null);
    setNotice(
      "Demo check-in recorded for this session. It resets on reload; no data was transmitted.",
    );
  }
  function withdraw() {
    setProfiles((items) =>
      items.map((item) =>
        item.id === selected
          ? {
              ...item,
              summary: null,
              date: null,
              history: [],
              moodHistory: [],
              checkIn: {
                ...item.checkIn!,
                consent: false,
                shareSummary: false,
                contextTags: [],
                measurements: {
                  sleepHours: null,
                  activeMinutes: null,
                  mealDays: null,
                },
                values: {
                  sleep: null,
                  diet: null,
                  activity: null,
                  mood: null,
                  peers: null,
                  context: null,
                },
              },
            }
          : item,
      ),
    );
    setDraft(null);
    setPlan("");
    setNotice(
      "Consent withdrawn and wellbeing entries cleared for this browser session. The fictional seed returns on reload.",
    );
  }

  return (
    <main id="main" className="shell cc-page">
      <div className="dashboard-eyebrow mono">
        <span>
          <i className="live-dot" /> campuscompass / care & context lab
        </span>
        <span>Separate prototype · fictional check-ins</span>
      </div>
      <div className="cc-heading">
        <div>
          <span className="mono cc-kicker">
            A little more context. A little more care.
          </span>
          <h1>
            Behind every grade,
            <br />
            <span className="green">
              <Scramble>there’s a person.</Scramble>
            </span>
          </h1>
          <p>
            Sleep, food, movement, mood, belonging, and life outside class.
            <br />
            Bring the conversation together with the <strong>CC Score.</strong>
          </p>
        </div>
        <div className="cc-orbit-art" aria-hidden="true">
          <span>CC</span>
          <i />
          <i />
          <i />
          <b>✳</b>
          <small>care + context</small>
        </div>
      </div>
      <div className="cc-purpose">
        <ShieldCheck size={19} />
        <p>
          <strong>Context for care.</strong> Higher CC Scores mean greater
          self-reported balance. This experimental score never changes academic
          risk, grades, or student eligibility.
        </p>
        <Link href="/workspace">
          Academic workspace <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="dashboard-stats cc-stats">
        <div className="stat-box">
          <span className="mono">
            Context areas
            <Leaf size={15} />
          </span>
          <strong>
            06<span>✳</span>
          </strong>
          <small>Equal weight · transparent rubric</small>
        </div>
        <div className="stat-box">
          <span className="mono">
            {mentor ? "Assigned students" : "Student records"}
            <Users size={15} />
          </span>
          <strong>
            {profiles.length.toString().padStart(2, "0")}
            <span>↗</span>
          </strong>
          <small>
            {mentor
              ? "Your mentoring caseload"
              : "Consent-aware staff summaries"}
          </small>
        </div>
        <div className="stat-box">
          <span className="mono">
            Scorable records
            <EyeOff size={15} />
          </span>
          <strong>
            {shared.toString().padStart(2, "0")}
            <span>↗</span>
          </strong>
          <small>Others remain private or incomplete</small>
        </div>
        <div className="stat-box">
          <span className="mono">
            Academic changes
            <ShieldCheck size={15} />
          </span>
          <strong>
            00<span>↗</span>
          </strong>
          <small>CC Score is a separate support signal</small>
        </div>
      </div>
      <div className="cc-workspace-grid">
        <aside className="glass-panel cc-roster">
          <div className="panel-heading">
            <div>
              <span className="mono">
                01 / {mentor ? "your caseload" : "shared context"}
              </span>
              <h2>
                <Scramble>People first.</Scramble>
              </h2>
            </div>
            <HeartHandshake size={22} />
          </div>
          <p className="muted cc-roster-intro">
            {mentor
              ? "Private check-ins for your assigned students."
              : "Only consented summaries are shared with academic staff."}
          </p>
          {profiles.map((item) => (
            <button
              key={item.id}
              className={`student-row ${item.id === selected ? "selected" : ""}`}
              aria-pressed={item.id === selected}
              onClick={() => choose(item)}
            >
              <span className={`student-avatar avatar-${item.initials}`}>
                {item.initials}
              </span>
              <span className="student-name">
                <strong>{item.name}</strong>
                <small>
                  {item.access === "withheld"
                    ? "Summary not shared"
                    : `${item.summary?.answered ?? 0}/6 areas reported`}
                </small>
              </span>
              <span className="cc-roster-score">
                {item.access === "withheld" ? (
                  <LockKeyhole size={16} />
                ) : (
                  (item.summary?.score ?? "—")
                )}
              </span>
              <ChevronRight size={15} />
            </button>
          ))}
          <div className="cc-roster-note">
            <LockKeyhole size={19} />
            <p>
              {mentor
                ? "Your own caseload only. Teacher and manager evidence is not provided here."
                : "Private answers and external-pressure details are never included in this staff view."}
            </p>
          </div>
          <div className="cc-small-abstract" aria-hidden="true">
            <span>
              understand.
              <br />
              <b>then support.</b>
            </span>
            <i>✳</i>
          </div>
        </aside>
        <section id="cc-record" className="glass-panel cc-detail">
          <div className="panel-heading">
            <div>
              <span className="mono">
                02 / {profile.id} · {mentor ? "mentor detail" : "staff summary"}
              </span>
              <h2>{profile.name}</h2>
            </div>
            <span className="student-avatar large">{profile.initials}</span>
          </div>
          <div className="cc-profile-meta">
            <span>Mentor: {profile.mentorName}</span>
            <span>
              <LockKeyhole size={11} />
              {profile.access === "details"
                ? "Private mentoring"
                : profile.access === "summary"
                  ? "Consented summary"
                  : "Not shared"}
            </span>
          </div>
          <div className="cc-tab-nav" aria-label="Wellbeing sections">
            <button
              className={tab === "overview" ? "active" : ""}
              aria-pressed={tab === "overview"}
              onClick={() => setTab("overview")}
            >
              CC overview
            </button>
            {mentor && (
              <button
                className={tab === "checkin" ? "active" : ""}
                aria-pressed={tab === "checkin"}
                onClick={startCheckIn}
              >
                Record check-in
              </button>
            )}
            <button
              className={tab === "sources" ? "active" : ""}
              aria-pressed={tab === "sources"}
              onClick={() => setTab("sources")}
            >
              Method & open data
            </button>
          </div>
          <div className="cc-detail-body">
            {tab === "overview" && (
              <>
                {profile.access === "withheld" ? (
                  <div className="cc-private-state">
                    <LockKeyhole size={34} />
                    <h3>This story stays private.</h3>
                    <p>
                      The student has not shared a CC summary with academic
                      staff. There is no score to interpret here. Continue with
                      the existing academic support process.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="cc-score-overview">
                      <div
                        className="cc-score-ring"
                        style={{
                          background: `conic-gradient(#08872b ${(score ?? 0) * 3.6}deg, #dce6dc 0deg)`,
                        }}
                      >
                        <div>
                          <span className="mono">CC Score</span>
                          <strong>{score ?? "—"}</strong>
                          <small>
                            {score === null ? "Not scored" : "out of 100"}
                          </small>
                        </div>
                      </div>
                      <div className="cc-score-explainer">
                        <span className="mono">
                          Care & Context / rubric v0.1
                        </span>
                        <h3>
                          {score === null
                            ? "A conversation before a number."
                            : "A snapshot, not a label."}
                        </h3>
                        <p>
                          {score === null
                            ? result?.reason === "missing"
                              ? "At least four of six areas are needed. Skipped answers never count as zero."
                              : "A score needs voluntary consent and enough recent information."
                            : "Higher means more reported balance across the areas the student chose to answer."}
                        </p>
                        <span className="cc-coverage">
                          {result?.answered ?? 0}/6 reported ·{" "}
                          {result?.coverage ?? 0}% coverage
                        </span>
                      </div>
                    </div>
                    {profile.date && (
                      <div className="cc-asof mono">
                        Last fictional check-in / {dateLabel(profile.date)} · no
                        clinical interpretation
                      </div>
                    )}
                    {profile.history.length > 0 && (
                      <Trend points={profile.history} />
                    )}
                    {mentor && raw?.consent ? (
                      <>
                        <div className="cc-mood-history">
                          <div>
                            <HeartHandshake size={17} />
                            <span className="mono">
                              Emotional wellbeing / private check-ins
                            </span>
                          </div>
                          <div>
                            {profile.moodHistory?.map((point) => (
                              <article key={point.date}>
                                <span>
                                  {point.rating ?? "—"}
                                  <small>/5</small>
                                </span>
                                <strong>
                                  {point.rating === null
                                    ? "Skipped"
                                    : ratingLabels[point.rating - 1]}
                                </strong>
                                <small>{dateLabel(point.date)}</small>
                              </article>
                            ))}
                          </div>
                        </div>
                        {raw.measurements && (
                          <div className="cc-measurements">
                            <div>
                              <span>Sleep duration</span>
                              <strong>
                                {raw.measurements.sleepHours ?? "—"}
                                <small> h/night</small>
                              </strong>
                            </div>
                            <div>
                              <span>Movement / activity</span>
                              <strong>
                                {raw.measurements.activeMinutes ?? "—"}
                                <small> min/day</small>
                              </strong>
                            </div>
                            <div>
                              <span>Regular meals</span>
                              <strong>
                                {raw.measurements.mealDays ?? "—"}
                                <small> days/week</small>
                              </strong>
                            </div>
                            <p>
                              Optional self-reported context. These measurements
                              do not change the CC Score.
                            </p>
                          </div>
                        )}
                        <div className="cc-factor-heading">
                          <h3>Six parts of the picture.</h3>
                          <span className="mono">
                            Private / 1–5 self-report
                          </span>
                        </div>
                        <div className="cc-factor-grid">
                          {factors.map((factor, index) => {
                            const Icon = icons[index];
                            const value = raw.values[factor.key];
                            return (
                              <article key={factor.key}>
                                <Icon size={20} strokeWidth={1.4} />
                                <strong>{factor.label}</strong>
                                <span>
                                  {value === null
                                    ? "Skipped"
                                    : `${value}/5 · ${ratingLabels[value - 1]}`}
                                </span>
                                <div className="cc-factor-track">
                                  <i
                                    style={{
                                      width:
                                        value === null
                                          ? "0%"
                                          : `${(value - 1) * 25}%`,
                                    }}
                                  />
                                </div>
                              </article>
                            );
                          })}
                        </div>
                        {raw.contextTags.length > 0 && (
                          <div className="cc-context-tags">
                            <span className="mono">
                              Optional context · not scored
                            </span>
                            <div>
                              {raw.contextTags.map((tag) => (
                                <span key={tag}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="cc-support-box">
                          <span className="mono">
                            Conversation starters / human review
                          </span>
                          <h3>Start with what would help.</h3>
                          {ideas.length ? (
                            <ul>
                              {ideas.map((idea) => (
                                <li key={idea}>{idea}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>
                              Ask which kind of support would be useful. A high
                              score does not rule out a need for help.
                            </p>
                          )}
                          <button
                            className="small-button"
                            onClick={() => {
                              setPlan(
                                "Would you like a private check-in to discuss which support would be most helpful this week?",
                              );
                              setApproved(false);
                            }}
                          >
                            Prepare a support invitation{" "}
                            <ArrowUpRight size={14} />
                          </button>
                          {plan && (
                            <div className="cc-plan">
                              <label htmlFor="cc-invitation" className="mono">
                                Review draft
                              </label>
                              <textarea
                                id="cc-invitation"
                                value={plan}
                                onChange={(event) => {
                                  setPlan(event.target.value);
                                  setApproved(false);
                                }}
                              />
                              <button
                                className="small-button"
                                disabled={!plan.trim() || approved}
                                onClick={() => setApproved(true)}
                              >
                                <Check size={14} />
                                {approved
                                  ? "Approved in demo"
                                  : "Approve demo invitation"}
                              </button>
                              <small>
                                Draft only. No student notification is sent.
                              </small>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      !mentor && (
                        <div className="cc-summary-privacy">
                          <ShieldCheck size={20} />
                          <div>
                            <h3>Enough context to coordinate.</h3>
                            <p>
                              This view shares the CC Score and its coverage
                              only. Mood answers, food access, peer details, and
                              outside pressures stay with the assigned mentor.
                            </p>
                            <Link href="/workspace" className="text-link">
                              Return to academic support{" "}
                              <ArrowUpRight size={16} />
                            </Link>
                          </div>
                        </div>
                      )
                    )}
                    {mentor && (
                      <div className="cc-record-actions">
                        <button
                          className="rainbow-button"
                          onClick={startCheckIn}
                        >
                          <Plus size={16} />
                          <Scramble>Record a voluntary check-in</Scramble>
                          <ArrowUpRight size={16} />
                        </button>
                        {raw?.consent && (
                          <button className="quiet-button" onClick={withdraw}>
                            Withdraw consent & clear session data
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {tab === "checkin" && mentor && draft && (
              <form
                className="cc-checkin-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveCheckIn();
                }}
              >
                <span className="mono">
                  Voluntary mentor-assisted check-in / fictional demo
                </span>
                <h3>Let the student set the pace.</h3>
                <p className="muted">
                  Record answers the student chooses to share. Every area can be
                  skipped. Prefilled demo values must be reviewed together.
                </p>
                <label className="cc-date-label">
                  Check-in date
                  <input
                    type="date"
                    required
                    max={todayDate()}
                    value={draft.date}
                    onChange={(event) =>
                      setDraft({ ...draft, date: event.target.value })
                    }
                  />
                </label>
                <fieldset className="cc-measurement-form">
                  <legend>Optional daily-life measurements</legend>
                  <p>
                    Descriptive context only; none of these values change the
                    score. Leave blank to skip.
                  </p>
                  <div>
                    {(
                      [
                        {
                          key: "sleepHours",
                          label: "Sleep hours per night",
                          max: 24,
                          step: 0.5,
                        },
                        {
                          key: "activeMinutes",
                          label: "Comfortable activity minutes/day",
                          max: 1440,
                          step: 1,
                        },
                        {
                          key: "mealDays",
                          label: "Days with regular meals/week",
                          max: 7,
                          step: 1,
                        },
                      ] as const
                    ).map((item) => (
                      <label key={item.key}>
                        {item.label}
                        <input
                          type="number"
                          min={0}
                          max={item.max}
                          step={item.step}
                          value={draft.measurements?.[item.key] ?? ""}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              measurements: {
                                sleepHours:
                                  draft.measurements?.sleepHours ?? null,
                                activeMinutes:
                                  draft.measurements?.activeMinutes ?? null,
                                mealDays: draft.measurements?.mealDays ?? null,
                                [item.key]:
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
                {factors.map((factor, index) => {
                  const Icon = icons[index];
                  return (
                    <fieldset key={factor.key}>
                      <legend>
                        <Icon size={17} />
                        {factor.label}
                      </legend>
                      <p>{factor.question}</p>
                      <div className="cc-ratings">
                        {([1, 2, 3, 4, 5] as Rating[]).map((value) => (
                          <button
                            type="button"
                            key={value}
                            className={
                              draft.values[factor.key] === value ? "active" : ""
                            }
                            aria-pressed={draft.values[factor.key] === value}
                            aria-label={`${factor.label}: ${value}, ${ratingLabels[value - 1]}`}
                            onClick={() =>
                              setDraft({
                                ...draft,
                                values: {
                                  ...draft.values,
                                  [factor.key]: value,
                                },
                              })
                            }
                          >
                            {value}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={
                            draft.values[factor.key] === null
                              ? "active skip"
                              : "skip"
                          }
                          aria-pressed={draft.values[factor.key] === null}
                          onClick={() =>
                            setDraft({
                              ...draft,
                              values: { ...draft.values, [factor.key]: null },
                            })
                          }
                        >
                          Skip
                        </button>
                      </div>
                      <small>
                        1 · Strongly disagree <span>5 · Strongly agree</span>
                      </small>
                    </fieldset>
                  );
                })}
                <fieldset className="cc-demands">
                  <legend>Optional outside pressures</legend>
                  <p>Context to discuss, never additional score penalties.</p>
                  <div>
                    {demands.map((tag) => (
                      <label key={tag}>
                        <input
                          type="checkbox"
                          checked={draft.contextTags.includes(tag)}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              contextTags: event.target.checked
                                ? [...draft.contextTags, tag]
                                : draft.contextTags.filter(
                                    (value) => value !== tag,
                                  ),
                            })
                          }
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="cc-consent">
                  <input
                    type="checkbox"
                    checked={draft.consent}
                    onChange={(event) =>
                      setDraft({ ...draft, consent: event.target.checked })
                    }
                  />
                  <span>
                    The student voluntarily agrees to record this demo check-in.
                  </span>
                </label>
                <label className="cc-consent">
                  <input
                    type="checkbox"
                    checked={draft.shareSummary}
                    onChange={(event) =>
                      setDraft({ ...draft, shareSummary: event.target.checked })
                    }
                  />
                  <span>
                    The student agrees to share the score and coverage with
                    teachers and the batch manager. Raw answers stay private.
                  </span>
                </label>
                <div className="cc-live-result">
                  <span>Preview CC Score</span>
                  <strong>
                    {calculateCC(draft).score ?? "—"}
                    <small>/100</small>
                  </strong>
                  <span>{calculateCC(draft).answered}/6 answered</span>
                </div>
                <button
                  className="rainbow-button"
                  type="submit"
                  disabled={!draft.consent}
                >
                  <Scramble>Save demo check-in</Scramble>
                  <Check size={17} />
                </button>
                <p className="cc-form-footnote">
                  Session memory only · no real health records · no automatic
                  messages
                </p>
              </form>
            )}
            {tab === "sources" && <MethodAndSources />}
            {notice && (
              <div className="feedback-notice cc-feedback" role="status">
                <Check size={17} />
                {notice}
              </div>
            )}
          </div>
        </section>
      </div>
      <section className="glass-panel cc-method-strip">
        <div>
          <span className="mono">Transparent by design / CC Score v0.1</span>
          <h2>
            Understand the number.
            <br />
            Then listen to the person.
          </h2>
          <p>
            Six positive self-report statements, scored equally. Answers remain
            optional, and the student controls summary sharing.
          </p>
        </div>
        <div className="cc-formula">
          <span className="mono">For each answered area</span>
          <strong>(rating − 1) × 25</strong>
          <span className="mono">CC Score = mean of answered areas</span>
          <p>
            Minimum 4/6 areas + consent. Missing answers are excluded. Weights
            and coverage threshold are prototype choices, not CDC-validated
            rules.
          </p>
          <button
            className="text-link"
            onClick={() => {
              setTab("sources");
              document
                .getElementById("cc-record")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Read the method & sources <ArrowUpRight size={17} />
          </button>
        </div>
      </section>
      <p className="demo-footnote mono">
        New isolated prototype / the original CampusCompass source and port 5174
        remain unchanged
      </p>
    </main>
  );
}

function MethodAndSources() {
  return (
    <div id="cc-method-anchor" className="cc-research">
      <span className="mono">Prototype method / open research context</span>
      <h3>
        The sources inform the questions.
        <br />
        They do not score the student.
      </h3>
      <p>
        These published, aggregate figures describe U.S. high-school survey
        respondents. They are not campus estimates, personal tracking, clinical
        cutoffs, or a trained model. Individual check-ins here are fictional.
      </p>
      <div className="cc-source-metrics">
        {research.metrics.map((metric) => (
          <article key={metric.id}>
            <span className="mono">
              {metric.id} / {metric.year}
            </span>
            <strong>
              {metric.value}
              <small>{metric.unit}</small>
            </strong>
            <p>{metric.label}.</p>
            <a href={metric.url} target="_blank" rel="noreferrer">
              {metric.source} <ArrowUpRight size={13} />
            </a>
            <span className="cc-source-location">{metric.location}</span>
          </article>
        ))}
      </div>
      <a className="text-link" href="/data/open-context.json" download>
        <span>
          <Download size={15} /> Download the sourced data snapshot
        </span>
        <ArrowUpRight size={17} />
      </a>
      <details open>
        <summary>
          <BookOpen size={17} /> How the CC Score is calculated
        </summary>
        <ol>
          <li>Each positive statement is rated 1–5 or skipped.</li>
          <li>Map each answered rating to 0, 25, 50, 75, or 100.</li>
          <li>
            Calculate the equally weighted mean of answered areas and round
            once.
          </li>
          <li>
            Show a score only with consent and at least four answered areas.
            Always show coverage.
          </li>
          <li>
            Use the number to begin a conversation. Never use it for grades,
            eligibility, diagnosis, disciplinary action, or automated
            escalation.
          </li>
        </ol>
        <p>
          Example: ratings 3, 4, 3, 3, 4, 2 become 50, 75, 50, 50, 75, 25. Their
          average rounds to <strong>54/100</strong>.
        </p>
      </details>
      <details>
        <summary>
          <ShieldCheck size={17} /> Missing data, consent, and limitations
        </summary>
        <p>
          Declining a check-in is not a negative result. Skipped answers are not
          zero. Coverage reflects completeness, not statistical confidence.
          Different sets of answered questions should not be treated as directly
          comparable.
        </p>
        <p>
          Teachers and managers receive only summaries whose sharing is enabled.
          Assigned mentors receive check-in details. New edits are local to this
          browser session and reset on refresh; production persistence, consent
          auditing, validation across age groups and cultures, and institutional
          access controls still need implementation.
        </p>
        <p>
          The CC Score rubric is an unvalidated hackathon prototype. It has not
          been trained on YRBS data, and it does not assess mental illness. Open
          data is used as background only; newer survey releases may exist.
        </p>
      </details>
      <a
        className="text-link"
        href="https://www.cdc.gov/yrbs/data/index.html"
        target="_blank"
        rel="noreferrer"
      >
        Explore the public CDC datasets and documentation{" "}
        <ArrowUpRight size={17} />
      </a>
    </div>
  );
}
