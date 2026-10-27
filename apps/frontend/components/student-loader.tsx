"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Dashboard } from "./dashboard";
import { loadStudents } from "@/lib/api";
import type { Identity, Student } from "@/lib/domain";

export function StudentLoader({ identity }: { identity: Identity }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadStudents(controller.signal)
      .then((rows) => {
        if (controller.signal.aborted) return;
        setStudents(rows);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setMessage(
          error instanceof Error ? error.message : "Could not load students.",
        );
        setStatus("error");
      });
    return () => controller.abort();
  }, [attempt]);
  if (status === "loading")
    return (
      <main id="main" className="shell section-pad" aria-busy="true">
        <h1>Connecting the signals…</h1>
        <p role="status" className="muted">
          Loading students from the backend.
        </p>
      </main>
    );
  if (status === "error")
    return (
      <main id="main" className="shell section-pad">
        <h1>Let’s reconnect.</h1>
        <p role="alert" className="muted">
          {message}
        </p>
        <div className="action-row">
          <button
            className="small-button"
            onClick={() => {
              setStatus("loading");
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </button>
          <Link href="/demo" className="text-link">
            Check your session ↗
          </Link>
        </div>
      </main>
    );
  if (!students.length)
    return (
      <main id="main" className="shell section-pad">
        <h1>No assigned students yet.</h1>
        <p className="muted">
          Your workspace is ready. Students will appear once records are
          assigned.
        </p>
      </main>
    );
  return (
    <Dashboard key={attempt} identity={identity} initialStudents={students} />
  );
}
