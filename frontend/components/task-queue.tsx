"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ListChecks,
  LockKeyhole,
  RefreshCw,
  Search,
  Check,
  UserRound,
  CalendarClock,
  FileSpreadsheet,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import type { Identity } from "@/lib/domain";
import { sortTasks, type StaffTask, type TaskStatus } from "@/lib/task-types";
import { Scramble } from "./effects";
type Metadata = {
  students: number;
  attendanceRows: number;
  detailRows: number;
  continuationRows: number;
  warnings: string[];
  asOf: string;
  sources: string[];
  period: string;
};
export function TaskQueue({ identity }: { identity: Identity }) {
  const [tasks, setTasks] = useState<StaffTask[]>([]),
    [metadata, setMetadata] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0),
    [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("all"),
    [query, setQuery] = useState(""),
    [openOnly, setOpenOnly] = useState(true),
    [selected, setSelected] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tasks", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error ?? "Could not load tasks.");
        if (!controller.signal.aborted) {
          setTasks(payload.tasks);
          setMetadata(payload.metadata);
          setError("");
          setLoading(false);
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            reason instanceof Error ? reason.message : "Could not load tasks.",
          );
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [retry]);
  const active = tasks.filter((task) => task.status !== "Done");
  const privateTasks = active.filter((task) => task.privateRequest);
  const visible = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!openOnly || task.status !== "Done") &&
          (kind === "all" ||
            (kind === "private" && task.privateRequest) ||
            (kind === "academic" && task.kind === "academic")) &&
          `${task.studentName} ${task.studentId} ${task.title}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [tasks, openOnly, kind, query],
  );
  const current = visible.find((task) => task.id === selected) ?? visible[0];
  async function update(patch: {
    status?: TaskStatus;
    assignToMe?: boolean;
    owner?: StaffTask["owner"];
  }) {
    if (!current) return;
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: current.id, ...patch }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setTasks((items) =>
        sortTasks(
          items.map((task) => (task.id === payload.id ? payload : task)),
        ),
      );
      setNotice(
        "Task updated. No student message or intervention was automatically executed.",
      );
    } catch (reason) {
      setNotice(
        reason instanceof Error ? reason.message : "Could not update task.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="shell task-page">
      <div className="dashboard-eyebrow mono">
        <span>
          <i className="live-dot" /> staff.task_queue()
        </span>
        <span>{identity.title} / local CSV + student requests</span>
      </div>
      <div className="task-heading">
        <div>
          <span className="mono">Coordinate the next step.</span>
          <h1>
            Know what’s next.
            <br />
            <span className="green">
              <Scramble>Make support happen.</Scramble>
            </span>
          </h1>
          <p>
            A priority list for instructors and batch managers, with a dedicated
            lane for students requesting private support.
          </p>
        </div>
        <div className="task-heading-actions">
          <Link href="/workspace" className="small-button">
            Academic dashboard <ArrowUpRight size={15} />
          </Link>
          <button
            className="quiet-button"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setRetry((value) => value + 1);
            }}
          >
            <RefreshCw size={15} /> Refresh queue
          </button>
        </div>
      </div>
      {loading ? (
        <div className="task-loading" role="status">
          Loading and validating CSV records…
        </div>
      ) : error ? (
        <div className="task-error" role="alert">
          <h2>The source data needs attention.</h2>
          <p>{error}</p>
          <p>
            Check the two CSV files in the private import folder. Missing or
            conflicting values are not replaced with healthy zeros.
          </p>
        </div>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="stat-box">
              <span className="mono">
                Imported students
                <FileSpreadsheet size={15} />
              </span>
              <strong>
                {metadata?.students}
                <span>↗</span>
              </strong>
              <small>Joined by student_id</small>
            </div>
            <div className="stat-box">
              <span className="mono">
                Open tasks
                <ListChecks size={15} />
              </span>
              <strong>
                {active.length}
                <span>✳</span>
              </strong>
              <small>One academic task per flagged student</small>
            </div>
            <div className="stat-box">
              <span className="mono">
                Priority 1<CalendarClock size={15} />
              </span>
              <strong>
                {active.filter((task) => task.priority === "P1").length}
                <span>↗</span>
              </strong>
              <small>Review first · human action required</small>
            </div>
            <div className="stat-box">
              <span className="mono">
                Private requests
                <LockKeyhole size={15} />
              </span>
              <strong>
                {privateTasks.length}
                <span>↗</span>
              </strong>
              <small>Answers and scores withheld</small>
            </div>
          </div>
          <section className="task-private-lane glass-panel">
            <LockKeyhole size={25} />
            <div>
              <span className="mono">Private support lane</span>
              <h2>
                {privateTasks.length
                  ? `${privateTasks.length} student${privateTasks.length === 1 ? "" : "s"} asking for a private conversation`
                  : "Space for students who prefer privacy."}
              </h2>
              <p>
                Requests are prioritized by student-chosen contact timing. At
                the same priority, private requests appear first. Privacy alone
                never increases academic risk.
              </p>
              {privateTasks.length > 0 && (
                <div className="task-private-names">
                  {privateTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setKind("private");
                        setSelected(task.id);
                      }}
                    >
                      <strong>{task.studentName}</strong>
                      <span>
                        {task.priority} ·{" "}
                        {task.urgency === "soon" ? "Contact soon" : "Routine"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="small-button" onClick={() => setKind("private")}>
              View private requests <ChevronRight size={15} />
            </button>
          </section>
          <div className="task-workspace">
            <section className="glass-panel task-list">
              <div className="panel-heading">
                <div>
                  <span className="mono">01 / ordered for review</span>
                  <h2>Staff priorities.</h2>
                </div>
                <span className="count-label">{visible.length}</span>
              </div>
              <div className="search-box">
                <Search size={16} />
                <input
                  aria-label="Search tasks or students"
                  placeholder="Search student, ID or task…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="task-filter-row">
                {[
                  { id: "all", label: "All tasks" },
                  { id: "private", label: "Private support" },
                  { id: "academic", label: "CSV follow-ups" },
                ].map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={kind === item.id}
                    className={kind === item.id ? "selected" : ""}
                    onClick={() => setKind(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="task-open-toggle">
                <input
                  type="checkbox"
                  checked={openOnly}
                  onChange={(event) => setOpenOnly(event.target.checked)}
                />{" "}
                Hide completed tasks
              </label>
              {visible.length ? (
                visible.map((task) => (
                  <button
                    className={`task-row ${current?.id === task.id ? "selected" : ""}`}
                    key={task.id}
                    onClick={() => setSelected(task.id)}
                    aria-pressed={current?.id === task.id}
                  >
                    <span
                      className={`task-priority ${task.priority.toLowerCase()}`}
                    >
                      {task.priority}
                    </span>
                    <span>
                      <strong>
                        {task.studentName}
                        {task.privateRequest && <LockKeyhole size={12} />}
                      </strong>
                      <small>{task.title}</small>
                      <em>
                        {task.studentId} · {task.status} · {task.owner}
                      </em>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  No matching tasks. Private requests appear only after a
                  student asks for help.
                </div>
              )}
            </section>
            <section className="glass-panel task-detail">
              {current ? (
                <>
                  <div className="panel-heading">
                    <div>
                      <span className="mono">02 / {current.studentId}</span>
                      <h2>{current.studentName}</h2>
                    </div>
                    <span
                      className={`task-priority ${current.priority.toLowerCase()}`}
                    >
                      {current.priority}
                    </span>
                  </div>
                  <div className="task-detail-body">
                    <span className="badge">{current.status}</span>
                    <h3>{current.title}</h3>
                    {current.privateRequest && (
                      <div className="task-private-note">
                        <ShieldCheck size={19} />
                        <p>
                          Private request. Quiz answers, mood details, CC Score
                          and the underlying reason are not provided. Arrange
                          contact without requiring disclosure.
                        </p>
                      </div>
                    )}
                    <div className="task-action-box">
                      <span className="mono">Next action / staff review</span>
                      <p>{current.action}</p>
                    </div>
                    <h4>Why this is listed</h4>
                    <ul className="task-reasons">
                      {current.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                    {current.evidence && (
                      <div className="task-evidence">
                        <div>
                          <span>Attendance</span>
                          <strong>
                            {current.evidence.attendance === null
                              ? "Not provided"
                              : `${current.evidence.attendance}%`}
                          </strong>
                        </div>
                        <div>
                          <span>Consecutive absences</span>
                          <strong>
                            {current.evidence.absences ?? "Not provided"}
                          </strong>
                        </div>
                        <div>
                          <span>Grade average</span>
                          <strong>
                            {current.evidence.average === null
                              ? "Not provided"
                              : `${current.evidence.average}%`}
                          </strong>
                        </div>
                        <p>
                          {Object.entries(current.evidence.grades)
                            .map(
                              ([subject, value]) =>
                                `${subject}: ${value ?? "not provided"}`,
                            )
                            .join(" · ")}
                        </p>
                      </div>
                    )}
                    {current.ccSummary && (
                      <div className="task-shared-score">
                        <span className="mono">
                          Student explicitly shared this summary
                        </span>
                        <strong>CC Score {current.ccSummary.score}/100</strong>
                        <p>
                          {current.ccSummary.coverage}% coverage. This score is
                          not used to rank the queue.
                        </p>
                      </div>
                    )}
                    {current.history && current.history.length > 0 && (
                      <div className="task-history">
                        <h4>Imported intervention history</h4>
                        {current.history.map((item, index) => (
                          <article key={`${item.type}-${index}`}>
                            <span
                              className={`badge status-${item.status.toLowerCase()}`}
                            >
                              {item.status}
                            </span>
                            <strong>{item.type}</strong>
                            <small>{item.date}</small>
                          </article>
                        ))}
                        {current.excludedActions?.length ? (
                          <p>
                            Do not repeat without a fresh review:{" "}
                            {current.excludedActions.join(", ")}. The CSV has no
                            issue codes, so these actions are conservatively
                            excluded for this student.
                          </p>
                        ) : null}
                      </div>
                    )}
                    <div className="task-assignment">
                      <div>
                        <UserRound size={15} />
                        <span>{current.assignedTo ?? "Unassigned"}</span>
                        <button
                          className="small-button"
                          disabled={busy || current.status === "Done"}
                          onClick={() => update({ assignToMe: true })}
                        >
                          Assign to me
                        </button>
                      </div>
                      <label>
                        Owner role
                        {identity.role === "manager" ? (
                          <select
                            value={current.owner}
                            disabled={busy}
                            onChange={(event) =>
                              update({
                                owner: event.target.value as StaffTask["owner"],
                              })
                            }
                          >
                            <option>Teacher / Instructor</option>
                            <option>Batch Manager</option>
                          </select>
                        ) : (
                          <span>{current.owner}</span>
                        )}
                      </label>
                      <label>
                        Task status
                        <select
                          value={current.status}
                          disabled={busy}
                          onChange={(event) =>
                            update({ status: event.target.value as TaskStatus })
                          }
                        >
                          <option>Open</option>
                          <option>In progress</option>
                          <option>Done</option>
                        </select>
                      </label>
                      <p>
                        Review date: {current.due}. Task state records
                        coordination only; no messages are sent.
                      </p>
                    </div>
                    {notice && (
                      <div
                        className="feedback-notice task-notice"
                        role="status"
                      >
                        <Check size={16} />
                        {notice}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  Choose a task to review its evidence and owner.
                </div>
              )}
            </section>
          </div>
          <section className="glass-panel task-method">
            <div>
              <span className="mono">Source reconciliation</span>
              <h2>Two CSVs. One student record.</h2>
              <p>
                {metadata?.attendanceRows} attendance rows,{" "}
                {metadata?.detailRows} detail rows, and{" "}
                {metadata?.continuationRows} continuation rows reconcile to{" "}
                {metadata?.students} student IDs. Blank-ID intervention rows
                attach to the preceding student.
              </p>
              <p>
                Sources: {metadata?.sources.join(" + ")}. {metadata?.period}
              </p>
              <p>
                Privacy preferences are absent from these CSVs. No privacy or
                mood labels are inferred for imported students.
              </p>
              {metadata?.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
            <details>
              <summary>Priority rules and limitations</summary>
              <p>
                P1: attendance below 75%, at least five consecutive absences, or
                mean grade below 60%. P2: attendance below 85%, at least three
                absences, any subject below 65%, or a proposal awaiting review.
                P3: an active intervention needing a scheduled follow-up.
              </p>
              <p>
                Follow-up dates use the source action date plus 14 days. Student
                contact requests are P1 when the student chooses “soon,”
                otherwise P2. Within the same priority, private requests come
                first, then review date and student ID. These are prototype
                coordination rules, not ML predictions.
              </p>
              <p>
                CC Scores, private quiz answers and declining a quiz do not
                affect this ordering. Missing grades remain missing. Nothing is
                automatically executed. Queue snapshot: {metadata?.asOf}.
              </p>
            </details>
          </section>
        </>
      )}
    </main>
  );
}
