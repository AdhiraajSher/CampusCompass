import { NextResponse } from "next/server";
import { createDemoToken, getIdentity } from "@/lib/session";
import type { Student } from "@/lib/domain";

const BACKEND_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

function normalizeStudent(raw: any): Student {
  const sid = raw.id || raw.student_id || "STU-UNKNOWN";
  const name = raw.name || "Student";
  const initials =
    raw.initials ||
    name
      .split(" ")
      .slice(0, 2)
      .map((p: string) => p[0])
      .join("")
      .toUpperCase() ||
    "??";
  const risk = typeof raw.risk === "number" ? raw.risk : (raw.risk_score ? Math.round(raw.risk_score) : 50);

  const metrics = raw.metrics || {};
  const attRate = metrics.attendance_rate ?? raw.attendance?.[3] ?? 85;
  const absences = metrics.consecutive_absences ?? raw.missing ?? 0;

  const attendance = Array.isArray(raw.attendance) && raw.attendance.length === 4
    ? raw.attendance
    : [
        Math.min(100, Math.max(0, attRate + 10)),
        Math.min(100, Math.max(0, attRate + 6)),
        Math.min(100, Math.max(0, attRate + 2)),
        attRate,
      ];

  const math = metrics.math_grade;
  const english = metrics.english_grade;
  const science = metrics.science_grade;
  const gradeArr = [math, english, science].filter((g) => typeof g === "number");
  const avgGrade = gradeArr.length ? Math.round(gradeArr.reduce((a, b) => a + b, 0) / gradeArr.length) : (raw.grades?.[3] ?? 70);

  const grades = Array.isArray(raw.grades) && raw.grades.length === 4
    ? raw.grades
    : [
        Math.min(100, Math.max(0, avgGrade + 7)),
        Math.min(100, Math.max(0, avgGrade + 4)),
        Math.min(100, Math.max(0, avgGrade + 1)),
        avgGrade,
      ];

  const trend = Array.isArray(raw.trend) && raw.trend.length === 4
    ? raw.trend
    : [
        Math.max(0, Math.round(risk - 16)),
        Math.max(0, Math.round(risk - 11)),
        Math.max(0, Math.round(risk - 4)),
        risk,
      ];

  const rawHistory = Array.isArray(raw.history) ? raw.history : (raw.recent_interventions || []);
  const history = rawHistory.map((h: any) => ({
    id: h.id || h.intervention_id || crypto.randomUUID(),
    title: h.title || h.intervention_type || "Support Plan",
    issue: h.issue || raw.issue || "Academic review",
    status: (h.status || "Proposed").charAt(0).toUpperCase() + (h.status || "Proposed").slice(1).toLowerCase(),
    source: h.source || "staff",
    date: h.date || "Recent",
    owner: h.owner || "Anika Rao",
    reviewDays: h.reviewDays || h.review_days || 14,
  }));

  return {
    id: sid,
    name,
    initials,
    cohort: raw.cohort || "Batch A · CS 2026",
    mentorId: raw.mentorId || "riya",
    mentorName: raw.mentorName || "Riya Sen",
    note: raw.note || `Attendance rate is ${attRate}%. ${absences} consecutive absences recorded.`,
    risk,
    trend,
    attendance,
    grades,
    missing: absences,
    issue: raw.issue || (risk >= 70 ? "Declining attendance and grades" : "Monitoring"),
    newAlert: raw.newAlert ?? (risk >= 70),
    due: raw.due ?? (risk >= 75 || history.some((h: any) => h.status === "Active")),
    history,
    recommendation: raw.recommendation || (history.some((h: any) => h.status === "Failed")
      ? "Arrange an educator-led needs review and agree on a different support format."
      : "Schedule proactive check-in to discuss academic goals."),
    rationale: raw.rationale || "Informed by attendance, grade trajectory, and intervention history.",
  };
}

export async function GET() {
  const identity = await getIdentity();
  if (!identity)
    return NextResponse.json({ detail: "Sign in required" }, { status: 401 });

  // STRICT RBAC CHECK: Students are forbidden from student directories
  if (identity.role === "student") {
    return NextResponse.json(
      { detail: "Security violation: Students are strictly forbidden from viewing student directories." },
      { status: 403 },
    );
  }

  try {
    // Attempt to fetch from backend (/api/students first, then fallback to /students)
    let response = await fetch(`${BACKEND_URL}/api/students`, {
      headers: { Authorization: `Bearer ${createDemoToken(identity.id)}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (!response || !response.ok) {
      response = await fetch(`${BACKEND_URL}/students`, {
        headers: { Authorization: `Bearer ${createDemoToken(identity.id)}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }).catch(() => null);
    }

    if (!response || !response.ok) {
      return NextResponse.json(
        { detail: "Student service unavailable" },
        { status: 502 },
      );
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { detail: "Invalid response from student service" },
        { status: 502 },
      );
    }

    const normalized = data.map(normalizeStudent);
    return NextResponse.json(normalized, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { detail: "Student service unavailable" },
      { status: 502 },
    );
  }
}
