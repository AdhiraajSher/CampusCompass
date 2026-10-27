"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  Check,
  ChevronRight,
  ShieldCheck,
  LockKeyhole,
  HeartHandshake,
  Send,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Scramble } from "./effects";
import {
  calculateCC,
  factors,
  type CheckIn,
  type Rating,
} from "@/lib/cc-score";
import type { Identity } from "@/lib/domain";
import type { StudentView } from "@/lib/portal-store";
import research from "@/public/data/open-context.json";

const labels = [
  "Strongly disagree",
  "Disagree",
  "Mixed",
  "Agree",
  "Strongly agree",
];
const blank = (): CheckIn => ({
  id: "draft",
  date: "",
  consent: false,
  shareSummary: false,
  values: {
    sleep: null,
    diet: null,
    activity: null,
    mood: null,
    peers: null,
    context: null,
  },
  contextTags: [],
});
export function StudentPortal({
  identity,
  initialView,
}: {
  identity: Identity;
  initialView: StudentView;
}) {
  const [view, setView] = useState(initialView);
  const [draft, setDraft] = useState<CheckIn>(
    initialView.checkIn ? { ...initialView.checkIn, consent: false } : blank(),
  );
  const [step, setStep] = useState(0),
    [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [privateRequest, setPrivateRequest] = useState(true);
  const [urgency, setUrgency] = useState<"soon" | "routine">("routine");
  const [category, setCategory] = useState("Learning support");
  const result = calculateCC({ ...draft, consent: true });
  const factor = factors[step];
  async function action(url: string, method: string, body?: unknown) {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Please try again.");
      setView(payload as StudentView);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (
      await action("/api/student/check-in", "POST", {
        values: draft.values,
        consent: draft.consent,
        shareSummary: draft.shareSummary,
      })
    )
      setNotice(
        draft.shareSummary
          ? "Saved. Staff can see only your score and coverage when you make a general support request. Your answers stay private."
          : "Saved privately. Staff cannot see your quiz answers or CC Score.",
      );
  }
  async function requestHelp() {
    if (
      await action("/api/student/support", "POST", {
        privateRequest,
        urgency,
        category: privateRequest ? "Private conversation" : category,
      })
    )
      setNotice(
        privateRequest
          ? "Your private request is in the staff queue. Only your account name, contact timing and request status are shown. No answers or score were shared."
          : "Your request is in the staff queue. You can track its status below.",
      );
  }
  return (
    <main id="main" className="student-shell shell">
      <div className="student-eyebrow mono">
        <span>
          <i className="live-dot" /> student.workspace()
        </span>
        <span>{identity.studentId} / local demo</span>
      </div>
      <section className="student-hero">
        <div>
          <span className="mono">A moment for you.</span>
          <h1>
            Your day.
            <br />
            Your pace.
            <br />
            <span className="green">
              <Scramble>Your compass.</Scramble>
            </span>
          </h1>
          <p>
            A short check-in about life around learning.
            <br />
            You decide what to answer and what to share.
          </p>
          <a className="student-jump" href="#quiz">
            Start your check-in <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="student-art" aria-hidden="true">
          <div />
          <div />
          <div />
          <span>✳</span>
          <small>care starts here /</small>
        </div>
      </section>
      <div className="student-privacy-banner">
        <ShieldCheck size={21} />
        <div>
          <strong>Private by default. Support whenever you need it.</strong>
          <p>
            You can ask for help without taking the quiz. A private support
            request gets a dedicated staff lane without revealing your answers
            or score.
          </p>
        </div>
        <LockKeyhole size={20} />
      </div>
      <div className="student-content-grid">
        <section className="student-glass student-quiz" id="quiz">
          <div className="student-card-heading">
            <div>
              <span className="mono">01 / check in with yourself</span>
              <h2>
                {review
                  ? "Your check-in, your choice."
                  : "How has your week felt?"}
              </h2>
            </div>
            <span className="student-step mono">
              {review ? "Review" : `${String(step + 1).padStart(2, "0")} / 06`}
            </span>
          </div>
          <div
            className="student-progress"
            aria-label={`${result.answered} of 6 areas answered`}
          >
            <i style={{ width: `${((review ? 6 : step + 1) / 6) * 100}%` }} />
          </div>
          {!review ? (
            <div className="student-question" key={factor.key}>
              <span className="mono">{factor.label}</span>
              <h3>{factor.question}</h3>
              <p>Thinking about the past week. Every answer is optional.</p>
              <div className="student-rating-grid">
                {([1, 2, 3, 4, 5] as Rating[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      draft.values[factor.key] === value ? "selected" : ""
                    }
                    aria-pressed={draft.values[factor.key] === value}
                    aria-label={`${factor.label}: ${value}, ${labels[value - 1]}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        values: { ...draft.values, [factor.key]: value },
                      })
                    }
                  >
                    <strong>{value}</strong>
                    <span>{labels[value - 1]}</span>
                    {draft.values[factor.key] === value && <Check size={13} />}
                  </button>
                ))}
              </div>
              <div className="student-question-controls">
                <button
                  className="student-text-button"
                  onClick={() => {
                    setDraft({
                      ...draft,
                      values: { ...draft.values, [factor.key]: null },
                    });
                    if (step < 5) setStep(step + 1);
                    else setReview(true);
                  }}
                >
                  Skip this question
                </button>
                <div>
                  <button
                    className="student-icon-button"
                    aria-label="Previous question"
                    disabled={step === 0}
                    onClick={() => setStep(step - 1)}
                  >
                    <ArrowLeft size={17} />
                  </button>
                  <button
                    className="student-solid-button"
                    onClick={() =>
                      step < 5 ? setStep(step + 1) : setReview(true)
                    }
                  >
                    {step === 5 ? "Review my check-in" : "Next question"}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="student-review">
              <div className="student-score-row">
                <div className="student-score-number">
                  <span className="mono">CC Score / preview</span>
                  <strong>
                    {result.score ?? "—"}
                    <small>/100</small>
                  </strong>
                  <span>
                    {result.answered}/6 reported · {result.coverage}% coverage
                  </span>
                </div>
                <div>
                  <Sparkles size={22} />
                  <h3>
                    {result.score === null
                      ? "A few more pieces would help."
                      : "A little context for your week."}
                  </h3>
                  <p>
                    {result.score === null
                      ? "Four answered areas are needed for a score. Skipped answers do not count as zero."
                      : "Higher means more self-reported balance. The number starts a conversation; it does not measure your ability or change your grades."}
                  </p>
                </div>
              </div>
              <div className="student-answer-summary">
                {factors.map((item) => (
                  <div key={item.key}>
                    <span>{item.label}</span>
                    <strong>
                      {draft.values[item.key] === null
                        ? "Skipped"
                        : `${draft.values[item.key]}/5`}
                    </strong>
                  </div>
                ))}
              </div>
              <div className="student-sharing">
                <label>
                  <input
                    type="checkbox"
                    checked={draft.shareSummary}
                    onChange={(event) =>
                      setDraft({ ...draft, shareSummary: event.target.checked })
                    }
                  />
                  <span>
                    <strong>Share only my score and coverage with staff</strong>
                    <small>
                      Optional. Raw answers always stay private. Private support
                      requests still hide your score.
                    </small>
                  </span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.consent}
                    onChange={(event) =>
                      setDraft({ ...draft, consent: event.target.checked })
                    }
                  />
                  <span>
                    <strong>I choose to save this check-in</strong>
                    <small>
                      Stored in this local demo server until it restarts. This
                      account is for fictional demo answers.
                    </small>
                  </span>
                </label>
              </div>
              <div className="student-review-actions">
                <button
                  className="student-text-button"
                  onClick={() => {
                    setReview(false);
                    setStep(0);
                  }}
                >
                  Review my answers
                </button>
                <button
                  className="student-solid-button"
                  disabled={!draft.consent || busy}
                  onClick={save}
                >
                  {busy
                    ? "Saving…"
                    : draft.shareSummary
                      ? "Save with summary sharing"
                      : "Save privately"}
                  <Check size={16} />
                </button>
              </div>
            </div>
          )}
          <div className="student-quiz-footnote">
            <LockKeyhole size={13} />
            {view.result
              ? `Last saved: ${view.result.score ?? "not enough data"}${view.result.score === null ? "" : "/100"} · ${view.checkIn?.shareSummary ? "Summary sharing enabled" : "Private"}`
              : "Your preview stays on this device until you choose to save."}
          </div>
        </section>
        <aside className="student-glass student-care-card">
          <HeartHandshake size={31} strokeWidth={1.2} />
          <span className="mono">Care & Context / CC Score</span>
          <h2>
            Six areas.
            <br />
            One whole person.
          </h2>
          <p>
            Sleep, food, movement, emotional wellbeing, peer connection and
            outside pressures.
          </p>
          <div className="student-formula">
            <span className="mono">Prototype rubric</span>
            <strong>(rating − 1) × 25</strong>
            <p>
              Equal-weight average of answered areas. At least four of six are
              needed. This is an experimental wellbeing reflection, not a
              medical assessment.
            </p>
          </div>
          <a href="#student-sources" className="student-text-button">
            See the open research <ArrowUpRight size={15} />
          </a>
        </aside>
      </div>
      {notice && (
        <div className="student-feedback" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      <section className="student-glass student-support" id="support">
        <div className="student-card-heading">
          <div>
            <span className="mono">02 / support on your terms</span>
            <h2>You can ask. You don’t have to explain.</h2>
          </div>
          <HeartHandshake size={25} />
        </div>
        <p className="student-section-copy">
          Your registered account name and chosen contact timing reach the
          instructor/batch manager so they can arrange support. You can keep
          your quiz and the reason for asking private.
        </p>
        <div className="student-support-grid">
          <div>
            <fieldset>
              <legend>How would you like to ask?</legend>
              <label
                className={
                  privateRequest ? "student-choice selected" : "student-choice"
                }
              >
                <input
                  type="radio"
                  name="request-privacy"
                  checked={privateRequest}
                  onChange={() => setPrivateRequest(true)}
                />
                <span>
                  <strong>Private conversation</strong>
                  <small>
                    Hide the reason, quiz answers and CC Score. Listed in the
                    private support lane.
                  </small>
                </span>
                <LockKeyhole size={17} />
              </label>
              <label
                className={
                  !privateRequest ? "student-choice selected" : "student-choice"
                }
              >
                <input
                  type="radio"
                  name="request-privacy"
                  checked={!privateRequest}
                  onChange={() => setPrivateRequest(false)}
                />
                <span>
                  <strong>General support</strong>
                  <small>Share a topic. Answers remain private.</small>
                </span>
              </label>
            </fieldset>
            {!privateRequest && (
              <label className="student-field">
                Support topic
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option>Learning support</option>
                  <option>Attendance</option>
                  <option>Study planning</option>
                </select>
              </label>
            )}
          </div>
          <div>
            <fieldset>
              <legend>When would you like contact?</legend>
              <label
                className={
                  urgency === "soon"
                    ? "student-choice selected"
                    : "student-choice"
                }
              >
                <input
                  type="radio"
                  name="urgency"
                  checked={urgency === "soon"}
                  onChange={() => setUrgency("soon")}
                />
                <span>
                  <strong>Contact me soon</strong>
                  <small>Ask for attention at the next staff review.</small>
                </span>
              </label>
              <label
                className={
                  urgency === "routine"
                    ? "student-choice selected"
                    : "student-choice"
                }
              >
                <input
                  type="radio"
                  name="urgency"
                  checked={urgency === "routine"}
                  onChange={() => setUrgency("routine")}
                />
                <span>
                  <strong>A routine check-in is fine</strong>
                  <small>Schedule a regular support conversation.</small>
                </span>
              </label>
            </fieldset>
            <button
              className="student-solid-button student-request-button"
              disabled={busy}
              onClick={requestHelp}
            >
              Request support
              <Send size={16} />
            </button>
          </div>
        </div>
      </section>
      <section id="requests" className="student-glass student-requests">
        <div className="student-card-heading">
          <div>
            <span className="mono">03 / your requests</span>
            <h2>A next step you can see.</h2>
          </div>
          <button
            className="student-icon-button"
            aria-label="Refresh request status"
            disabled={busy}
            onClick={() => action("/api/student/check-in", "GET")}
          >
            <RefreshCw size={17} />
          </button>
        </div>
        {view.requests.length ? (
          view.requests.map((request) => (
            <article key={request.id}>
              <div>
                <span className="mono">
                  {request.privateRequest
                    ? "Private request"
                    : request.category}
                </span>
                <h3>{request.status}</h3>
                <p>
                  {request.urgency === "soon"
                    ? "You asked for contact soon."
                    : "You asked for a routine check-in."}{" "}
                  {request.assignedTo
                    ? `Assigned to ${request.assignedTo}.`
                    : "Staff assignment pending."}
                </p>
              </div>
              {["Open", "In progress"].includes(request.status) && (
                <button
                  className="student-text-button"
                  disabled={busy}
                  onClick={() =>
                    action("/api/student/support", "DELETE", { id: request.id })
                  }
                >
                  Cancel request
                </button>
              )}
            </article>
          ))
        ) : (
          <p className="student-empty">
            No requests yet. You can ask for support even if you skip the quiz.
          </p>
        )}
      </section>
      <section className="student-glass student-sources" id="student-sources">
        <span className="mono">Open research / transparent choices</span>
        <h2>
          Research informs the questions.
          <br />
          Your answers stay yours.
        </h2>
        <p>
          The six topics draw on public research, including CDC YRBS reports on
          sleep, food, activity, wellbeing and connectedness. The equal weights
          and minimum-four rule are our prototype choices, not a model trained
          on those surveys or a clinically validated score. U.S. high-school
          findings are not estimates of this campus.
        </p>
        <div>
          {research.metrics.map((metric) => (
            <a
              key={metric.id}
              href={metric.url}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                {metric.id} / {metric.year}
              </span>
              <ArrowUpRight size={15} />
            </a>
          ))}
        </div>
        <a
          href="/data/open-context.json"
          download
          className="student-text-button"
        >
          Download the cited public figures <ArrowUpRight size={15} />
        </a>
      </section>
      <div className="student-data-controls">
        <p>
          Withdraw saving consent and erase your saved quiz and score. Existing
          help requests stay active until you cancel them separately.
        </p>
        <button
          className="student-text-button"
          disabled={busy || !view.checkIn}
          onClick={async () => {
            if (await action("/api/student/check-in", "DELETE")) {
              setDraft(blank());
              setReview(false);
              setStep(0);
              setNotice(
                "Your saved quiz and CC Score were deleted from this demo server.",
              );
            }
          }}
        >
          Erase my saved check-in
        </button>
      </div>
    </main>
  );
}
