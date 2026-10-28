"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Search,
  ChevronRight,
  Check,
  X,
  SlidersHorizontal,
  Bell,
  Activity,
  ArrowDownRight,
  CalendarClock,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  BookOpen,
  CircleCheck,
  Plus,
  Send,
} from "lucide-react";
import { Scramble } from "./effects";
import {
  canPropose,
  nextRecommendation,
  type Identity,
  type Student,
  type Intervention,
  type Status,
} from "@/lib/domain";
type Notification = {
  id: string;
  student: string;
  text: string;
  owner: string;
  days: number;
  confirmed: boolean;
};
function Sparkline({
  values,
  color = "#08872b",
}: {
  values: number[];
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 210 44"
      className="sparkline"
      role="img"
      aria-label={`Four-week trend: ${values.join(", ")}`}
    >
      <path
        d={`M ${values.map((v, i) => `${i * 70},${43 - v * 0.4}`).join(" L ")}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      <circle cx="210" cy={43 - values[3] * 0.4} r="3" fill={color} />
    </svg>
  );
}
function Badge({ status }: { status: Status }) {
  return (
    <span className={`badge status-${status.toLowerCase()}`}>
      <i />
      {status}
    </span>
  );
}
export function Dashboard({
  identity,
  initialStudents,
}: {
  identity: Identity;
  initialStudents: Student[];
}) {
  const isMentor = identity.role === "mentor",
    isManager = identity.role === "manager";
  const [students, setStudents] = useState(initialStudents);
  const [selected, setSelected] = useState(initialStudents[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"overview" | "history" | "mentor">("overview");
  const [draft, setDraft] = useState(initialStudents[0].recommendation);
  const [note, setNote] = useState(initialStudents[0].note);
  const [days, setDays] = useState(14);
  const [owner, setOwner] = useState(identity.name);
  const [notice, setNotice] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [creating, setCreating] = useState(false);
  const student = students.find((s) => s.id === selected)!;
  const visible = useMemo(
    () =>
      students.filter(
        (s) =>
          (s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.id.toLowerCase().includes(query.toLowerCase())) &&
          (filter === "all" ||
            (filter === "new" && s.newAlert) ||
            (filter === "due" && s.due) ||
            (filter === "high" && (s.risk ?? 0) >= 70)),
      ),
    [students, query, filter],
  );
  const active = students
    .flatMap((s) => s.history)
    .filter((h) => h.status === "Active").length;
  const successful = students
    .flatMap((s) => s.history)
    .filter((h) => h.status === "Successful").length;
  const failed = students
    .flatMap((s) => s.history)
    .filter((h) => h.status === "Failed").length;
  const efficacy =
    successful + failed
      ? Math.round((successful / (successful + failed)) * 100)
      : 0;
  function choose(s: Student) {
    setSelected(s.id);
    setDraft(s.recommendation);
    setNote(s.note);
    setNotice("");
    setCreating(false);
  }
  function updateStudent(change: (s: Student) => Student) {
    setStudents((prev) => prev.map((s) => (s.id === selected ? change(s) : s)));
  }
  function propose() {
    if (!canPropose(student, draft, student.issue)) {
      setNotice(
        "Choose a different action. This intervention already failed for the same issue.",
      );
      return;
    }
    const proposal: Intervention = {
      id: crypto.randomUUID(),
      title: draft.trim(),
      issue: student.issue,
      status: "Proposed",
      source: isMentor ? "mentor" : "staff",
      date: "Today",
      owner,
      reviewDays: days,
    };
    updateStudent((s) => ({ ...s, history: [...s.history, proposal] }));
    setCreating(false);
    setTab("history");
    setNotice(
      "Proposal saved. Review and approve it in the intervention history.",
    );
  }
  function transition(id: string, status: Status) {
    const intervention = student.history.find((h) => h.id === id);
    if (!intervention) return;
    if (
      status === "Active" &&
      !canPropose(student, intervention.title, intervention.issue)
    ) {
      setNotice(
        "Approval blocked: this action failed for the same issue. Propose a different approach.",
      );
      return;
    }
    updateStudent((s) => {
      const updated = {
        ...s,
        due: status === "Successful" || status === "Failed" ? false : s.due,
        history: s.history.map((h) => (h.id === id ? { ...h, status } : h)),
      };
      if (status === "Failed")
        updated.recommendation = nextRecommendation(updated, identity.role);
      return updated;
    });
    if (status === "Active") {
      setNotifications((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          student: student.name,
          text: intervention.title,
          owner: intervention.owner,
          days: intervention.reviewDays,
          confirmed: false,
        },
      ]);
      setNotice(
        "Support plan is active. Review and confirm the student notification draft below.",
      );
    } else if (status === "Failed") {
      const next = {
        ...student,
        history: student.history.map((h) =>
          h.id === id ? { ...h, status } : h,
        ),
      };
      setDraft(nextRecommendation(next, identity.role));
      setNotice(
        "Failure recorded. The next example changes approach; the failed action stays in history.",
      );
    } else
      setNotice(
        status === "Rejected"
          ? "Proposal rejected. No notification created."
          : "Outcome recorded. The next review can use this evidence.",
      );
  }
  return (
    <main id="main" className="dashboard shell">
      <div className="dashboard-eyebrow mono">
        <span>
          <i className="live-dot" />{" "}
          {isMentor ? "mentor.workspace()" : "educator.workspace()"}
        </span>
        <span>Demo data / not connected to LMS or AI</span>
      </div>
      <div className="dashboard-heading">
        <div>
          <h1>
            {isMentor ? (
              <>
                Make support
                <br />
                <span className="green">
                  <Scramble>personal.</Scramble>
                </span>
              </>
            ) : (
              <>
                Every signal.
                <br />
                <span className="green">
                  <Scramble>A chance to help.</Scramble>
                </span>
              </>
            )}
          </h1>
          <p>
            {isMentor
              ? "Your assigned students. Your conversations. A clearer next step."
              : `Welcome, ${identity.name.split(" ")[0]}. ${isManager ? "Coordinate your batch’s support and keep the loop moving." : "See who needs you, understand why, and choose what comes next."}`}
          </p>
        </div>
        <div className="session-card glass-panel">
          <ShieldCheck size={21} />
          <div>
            <span className="mono">Assigned access</span>
            <strong>{identity.title}</strong>
            <small>
              {isMentor
                ? "Mentoring records only"
                : "Academic evidence + mentor updates"}
            </small>
          </div>
          <span className="session-mark">↗</span>
        </div>
      </div>
      <div className="dashboard-stats">
        {[
          {
            label: isMentor ? "Assigned students" : "Students in demo",
            value: students.length,
            icon: BookOpen,
            foot: isMentor
              ? "Only your caseload"
              : "Across two example batches",
          },
          {
            label: isMentor ? "Active support" : "Need attention",
            value: isMentor
              ? active
              : students.filter((s) => (s.risk ?? 0) >= 70).length,
            icon: Activity,
            foot: isMentor
              ? "Plans currently underway"
              : "Risk score 70 and above",
          },
          {
            label: "Follow-ups due",
            value: students.filter((s) => s.due).length,
            icon: CalendarClock,
            foot: "Review intervention outcomes",
          },
          {
            label: "Recorded efficacy",
            value: `${efficacy}%`,
            icon: CircleCheck,
            foot: "Successful / completed outcomes",
          },
        ].map(({ label, value, icon: Icon, foot }, i) => (
          <div className="stat-box" key={label}>
            <span className="mono">
              {label}
              <Icon size={15} />
            </span>
            <strong>
              {String(value).padStart(2, "0")}
              <span>{i === 0 ? "↗" : i === 1 ? "✳" : i === 2 ? "↗" : "↗"}</span>
            </strong>
            <small>{foot}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="glass-panel queue-panel" id="queue">
          <div className="panel-heading">
            <div>
              <span className="mono">
                01 / {isMentor ? "assigned caseload" : "student signals"}
              </span>
              <h2>
                <Scramble>
                  {isMentor ? "Your students" : "Priority queue"}
                </Scramble>
              </h2>
            </div>
            <span className="count-label">
              {visible.length.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search students"
              placeholder="Search student or ID…"
            />
            <span className="mono">/</span>
          </div>
          <div className="filter-row">
            <SlidersHorizontal size={14} />
            {[
              { id: "all", label: "All students" },
              ...(!isMentor ? [{ id: "new", label: "New alerts" }] : []),
              { id: "due", label: "Follow-ups" },
            ].map((f) => (
              <button
                key={f.id}
                aria-pressed={filter === f.id}
                className={filter === f.id ? "selected" : ""}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="queue-table-label mono">
            <span>Student / {isMentor ? "mentoring" : "batch"}</span>
            <span>{isMentor ? "Status" : "Risk / 100"}</span>
          </div>
          <div className="student-list">
            {visible.map((s) => (
              <button
                key={s.id}
                className={`student-row ${selected === s.id ? "selected" : ""}`}
                onClick={() => choose(s)}
                aria-pressed={selected === s.id}
              >
                <span className={`student-avatar avatar-${s.initials}`}>
                  {s.initials}
                </span>
                <span className="student-name">
                  <strong>
                    {s.name}
                    {s.newAlert && (
                      <i className="new-alert" aria-label="New alert" />
                    )}
                  </strong>
                  <small>
                    {s.id} /{" "}
                    {isMentor
                      ? s.due
                        ? "Follow-up due"
                        : "Mentoring"
                      : s.cohort}
                  </small>
                </span>
                {!isMentor ? (
                  <span
                    className={`risk-number ${(s.risk ?? 0) >= 70 ? "high" : ""}`}
                  >
                    {s.risk}
                    <small>
                      {(s.trend?.[3] ?? 0) > (s.trend?.[2] ?? 0) ? "↗" : "↘"}
                    </small>
                  </span>
                ) : (
                  <span className={`mini-status ${s.due ? "due" : ""}`}>
                    {s.due ? "Review" : "Open"}
                  </span>
                )}
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          {!visible.length && (
            <p className="empty-state">No students match this search.</p>
          )}
          <div className="queue-footer mono">
            <i className="live-dot" />
            {isMentor
              ? "Only assigned mentoring data is supplied."
              : "Sorted by risk score · illustrative values"}
          </div>
          <div className="queue-abstract" aria-hidden="true">
            <div />
            <div />
            <div />
            <span>
              small steps.
              <br />
              <b>lasting impact.</b>
            </span>
            <span className="abstract-star">✳</span>
          </div>
        </section>
        <section
          className="glass-panel detail-panel"
          id="case"
          aria-label="Selected student"
        >
          <div className="panel-heading">
            <div>
              <span className="mono">
                02 / {isMentor ? "mentoring record" : "student detail"} ·{" "}
                {student.id}
              </span>
              <h2>{student.name}</h2>
            </div>
            <span className="student-avatar large">{student.initials}</span>
          </div>
          <div className="detail-meta">
            <span>{isMentor ? "Assigned mentor: you" : student.cohort}</span>
            <span className={student.due ? "due-label" : ""}>
              {student.due ? "◷ Follow-up due" : "● Monitoring"}
            </span>
          </div>
          <Link
            href={`/wellbeing?student=${student.id}`}
            className="cc-academic-link"
          >
            CC Score / care & context <ArrowUpRight size={15} />
          </Link>
          <div
            className="detail-tabs"
            role="tablist"
            aria-label="Student record tabs"
          >
            {[
              {
                id: "overview" as const,
                label: isMentor ? "Mentoring overview" : "Evidence",
              },
              { id: "history" as const, label: "Interventions" },
              {
                id: "mentor" as const,
                label: isMentor ? "Your notes" : "Mentor updates",
              },
            ].map((t) => (
              <button
                role="tab"
                id={`tab-${t.id}`}
                aria-controls="record-content"
                aria-selected={tab === t.id}
                tabIndex={tab === t.id ? 0 : -1}
                onKeyDown={(event) => {
                  const tabs = ["overview", "history", "mentor"] as const;
                  const current = tabs.indexOf(t.id);
                  const next =
                    event.key === "ArrowRight"
                      ? (current + 1) % 3
                      : event.key === "ArrowLeft"
                        ? (current + 2) % 3
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? 2
                            : -1;
                  if (next >= 0) {
                    event.preventDefault();
                    setTab(tabs[next]);
                    document.getElementById(`tab-${tabs[next]}`)?.focus();
                  }
                }}
                key={t.id}
                onClick={() => setTab(t.id)}
              >
                <Scramble>{t.label}</Scramble>
              </button>
            ))}
          </div>
          <div
            id="record-content"
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            className="tab-content"
            key={`${selected}-${tab}`}
          >
            {tab === "overview" && (
              <>
                {!isMentor ? (
                  <>
                    <div className="risk-overview">
                      <div>
                        <span className="mono">Current risk score</span>
                        <strong>
                          {student.risk}
                          <small>/100</small>
                        </strong>
                        <span className="risk-context">
                          {(student.risk ?? 0) >= 70
                            ? "High priority"
                            : "Monitoring"}{" "}
                          · example score
                        </span>
                      </div>
                      <div className="trend-block">
                        <Sparkline values={student.trend!} />
                        <span className="mono">4 weeks / risk trend</span>
                      </div>
                    </div>
                    <div className="evidence-grid">
                      <div>
                        <span className="mono">Attendance</span>
                        <strong>
                          {student.attendance?.[3]}
                          <small>%</small>
                        </strong>
                        <Sparkline values={student.attendance!} />
                      </div>
                      <div>
                        <span className="mono">Assessment</span>
                        <strong>
                          {student.grades?.[3]}
                          <small>%</small>
                        </strong>
                        <Sparkline values={student.grades!} />
                      </div>
                      <div>
                        <span className="mono">Missing work</span>
                        <strong>
                          {student.missing}
                          <small> tasks</small>
                        </strong>
                        <span className="muted">Current assignment count</span>
                      </div>
                    </div>
                    <p className="evidence-caption mono">
                      Four-week series · values are fictional, not calculated by
                      ML
                    </p>
                  </>
                ) : (
                  <div className="mentor-summary">
                    <MessageSquareText size={27} />
                    <h3>A conversation can change the direction.</h3>
                    <p>{student.note}</p>
                    <span className="mono">
                      Latest mentoring update / {student.mentorName}
                    </span>
                  </div>
                )}
                <div className="recommendation">
                  <div className="recommendation-label mono">
                    <Sparkles size={15} />
                    {isMentor
                      ? "Suggested mentoring step"
                      : "Adaptive recommendation"}
                    <span>Demo</span>
                  </div>
                  <h3>{student.recommendation}</h3>
                  <p>{student.rationale}</p>
                  {student.history.some((h) => h.status === "Failed") && (
                    <div className="adaptive-note">
                      <RepeatIcon />
                      Prior failed actions are retained as evidence.
                    </div>
                  )}
                  <button
                    className="rainbow-button"
                    onClick={() => {
                      setCreating(!creating);
                      setDraft(student.recommendation);
                    }}
                  >
                    <Scramble>Review support plan</Scramble>
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              </>
            )}
            {tab === "history" && (
              <>
                <div className="history-header">
                  <p className="muted">
                    Track the action. Review the outcome. Adapt the next step.
                  </p>
                  <button
                    className="icon-button"
                    aria-label="Create intervention proposal"
                    onClick={() => setCreating(!creating)}
                  >
                    <Plus size={19} />
                  </button>
                </div>
                {student.history.map((h) => (
                  <article className="intervention" key={h.id}>
                    <div className="intervention-top">
                      <Badge status={h.status} />
                      <span className="mono">{h.date}</span>
                    </div>
                    <h3>{h.title}</h3>
                    <p>
                      {h.owner} ·{" "}
                      {h.source === "mentor" ? "Mentoring" : "Academic support"}{" "}
                      · Review after {h.reviewDays} days
                    </p>
                    <div className="intervention-actions">
                      {h.status === "Proposed" && (
                        <>
                          <button
                            className="small-button"
                            onClick={() => transition(h.id, "Active")}
                          >
                            <Check size={14} /> Approve plan
                          </button>
                          <button
                            className="quiet-button"
                            onClick={() => transition(h.id, "Rejected")}
                          >
                            <X size={14} /> Reject
                          </button>
                          <button
                            className="quiet-button"
                            onClick={() => {
                              setDraft(h.title);
                              setCreating(true);
                              transition(h.id, "Rejected");
                            }}
                          >
                            Edit as new proposal
                          </button>
                        </>
                      )}
                      {h.status === "Active" && (
                        <>
                          <button
                            className="small-button"
                            onClick={() => transition(h.id, "Successful")}
                          >
                            <Check size={14} /> Successful
                          </button>
                          <button
                            className="quiet-button"
                            onClick={() => transition(h.id, "Failed")}
                          >
                            <X size={14} /> Failed · adapt next step
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </>
            )}
            {tab === "mentor" && (
              <div className="mentor-notes">
                <div className="mentor-note-title">
                  <span className="student-avatar">
                    {student.mentorName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <strong>{student.mentorName}</strong>
                    <small>Assigned mentor</small>
                  </div>
                  <MessageSquareText size={20} />
                </div>
                {isMentor ? (
                  <>
                    <label htmlFor="mentor-note" className="mono">
                      Your mentoring note
                    </label>
                    <textarea
                      id="mentor-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={1200}
                    />
                    <button
                      className="small-button"
                      onClick={() => {
                        updateStudent((s) => ({ ...s, note: note.trim() }));
                        setNotice(
                          "Mentor note saved for this preview session. Staff can review mentor updates.",
                        );
                      }}
                    >
                      <Check size={14} /> Save update
                    </button>
                  </>
                ) : (
                  <>
                    <blockquote>{student.note}</blockquote>
                    <p className="muted">
                      Mentor updates are available to teachers and batch
                      managers. Mentors cannot access academic staff records.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          {creating && (
            <form
              className="proposal-editor"
              onSubmit={(e) => {
                e.preventDefault();
                propose();
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <h3>Review the next step</h3>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setCreating(false)}
                  aria-label="Close plan editor"
                >
                  <X size={18} />
                </button>
              </div>
              <label htmlFor="plan" className="mono">
                Support plan / edit before approval
              </label>
              <textarea
                id="plan"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={500}
                required
              />
              <div className="form-row">
                <label>
                  Review after
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    <option value={14}>14 days</option>
                    <option value={7}>7 days</option>
                  </select>
                </label>
                {isManager ? (
                  <label>
                    Assigned owner
                    <select
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                    >
                      <option>{identity.name}</option>
                      <option>Anika Rao</option>
                      <option>{student.mentorName}</option>
                    </select>
                  </label>
                ) : (
                  <label>
                    Assigned owner
                    <input value={identity.name} readOnly />
                  </label>
                )}
              </div>
              <button type="submit" className="rainbow-button">
                Save proposal <ArrowUpRight size={17} />
              </button>
              <p className="muted">
                Saving creates a Proposed plan. Approval activates it and
                prepares a notification draft.
              </p>
            </form>
          )}
          {notice && (
            <div className="feedback-notice" role="status">
              <Check size={17} />
              <span>{notice}</span>
              <button
                className="icon-button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </section>
      </div>
      <section className="glass-panel notification-panel" id="notifications">
        <div className="panel-heading">
          <div>
            <span className="mono">03 / student next steps</span>
            <h2>
              <Scramble>Human-approved. Clearly communicated.</Scramble>
            </h2>
          </div>
          <Bell size={23} />
        </div>
        <p className="muted">
          Students receive instructions, not a dashboard. Review and confirm
          each notification. This preview never sends emails or messages.
        </p>
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <Send size={25} strokeWidth={1.2} />
            <div>
              <strong>Good support starts with a thoughtful next step.</strong>
              <p>
                Approve a proposed intervention to create a student notification
                draft.
              </p>
            </div>
            <span className="mono">awaiting action /</span>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((n) => (
              <article key={n.id}>
                <div className="flex items-center justify-between gap-4">
                  <strong>{n.student}</strong>
                  <span className="badge">
                    {n.confirmed ? "Simulated notification" : "Draft"}
                  </span>
                </div>
                <p>Your next step: {n.text}</p>
                <small>
                  {n.owner} · Follow-up after {n.days} days
                </small>
                {!n.confirmed && (
                  <button
                    className="small-button"
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.map((row) =>
                          row.id === n.id ? { ...row, confirmed: true } : row,
                        ),
                      )
                    }
                  >
                    <Send size={14} /> Confirm notification · simulate
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="demo-footnote mono">
        Session-only prototype · changes reset on reload · notifications,
        recommendations, and reminders are simulated
      </p>
    </main>
  );
}
function RepeatIcon() {
  return <ArrowDownRight size={16} />;
}
