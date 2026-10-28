import { NextResponse, type NextRequest } from "next/server";
import { workspaceFor, type Role, type Identity } from "@/lib/domain";
import { createSessionToken, sessionCookie } from "@/lib/session";

const BACKEND_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000";

// Fallback seed accounts for offline resilience
const SEED_USERS: Record<
  string,
  {
    id: string;
    name: string;
    email: string;
    role: Role;
    studentId?: string;
    title: string;
    passwordPlain: string;
  }
> = {
  "aarav@student.edu": {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Aarav Shah",
    email: "aarav@student.edu",
    role: "student",
    studentId: "00000000-0000-0000-0000-000000000001",
    title: "Student · Daily Check-in & Self-Tracking",
    passwordPlain: "password123",
  },
  "student@school.edu": {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Aarav Shah (Student Demo)",
    email: "student@school.edu",
    role: "student",
    studentId: "00000000-0000-0000-0000-000000000001",
    title: "Student · Daily Check-in & Self-Tracking",
    passwordPlain: "password123",
  },
  "anika@school.edu": {
    id: "00000000-0000-0000-0000-000000000010",
    name: "Anika Rao",
    email: "anika@school.edu",
    role: "teacher",
    title: "Teacher (Subject-Level) · Class Roster & Behavior",
    passwordPlain: "password123",
  },
  "teacher@school.edu": {
    id: "00000000-0000-0000-0000-000000000010",
    name: "Anika Rao (Teacher Demo)",
    email: "teacher@school.edu",
    role: "teacher",
    title: "Teacher (Subject-Level) · Class Roster & Behavior",
    passwordPlain: "password123",
  },
  "riya@school.edu": {
    id: "00000000-0000-0000-0000-000000000020",
    name: "Riya Sen",
    email: "riya@school.edu",
    role: "mentor",
    title: "Mentor / Advisor (Holistic-Level) · Big-Picture Guide",
    passwordPlain: "password123",
  },
  "mentor@school.edu": {
    id: "00000000-0000-0000-0000-000000000020",
    name: "Riya Sen (Mentor Demo)",
    email: "mentor@school.edu",
    role: "mentor",
    title: "Mentor / Advisor (Holistic-Level) · Big-Picture Guide",
    passwordPlain: "password123",
  },
};

export async function POST(request: NextRequest) {
  try {
    let email = "";
    let password = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      email = body.email?.trim()?.toLowerCase() || "";
      password = body.password || "";
    } else {
      const form = await request.formData();
      email = String(form.get("email") || "").trim().toLowerCase();
      password = String(form.get("password") || "");
    }

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Email and password are required." },
        { status: 400 }
      );
    }

    // 1. Attempt authentication against FastAPI backend
    let authenticatedUser: Identity | null = null;
    let token = "";

    try {
      const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(3500),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        token = data.token;
        const u = data.user;
        authenticatedUser = {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role as Role,
          studentId: u.student_id,
          title:
            u.role === "student"
              ? "Student · Daily Check-in & Self-Tracking"
              : u.role === "teacher"
                ? "Teacher (Subject-Level) · Class Roster & Behavior"
                : "Mentor / Advisor (Holistic-Level) · Big-Picture Guide",
        };
      } else if (backendRes.status === 401) {
        return NextResponse.json(
          { detail: "Invalid email or password." },
          { status: 401 }
        );
      }
    } catch {
      // Backend request timed out or unavailable — check fallback
    }

    // 2. Resilient Fallback to Seed Database if backend was unreachable
    if (!authenticatedUser) {
      const seed = SEED_USERS[email];
      if (seed && (password === seed.passwordPlain || password === "password123")) {
        authenticatedUser = {
          id: seed.id,
          name: seed.name,
          email: seed.email,
          role: seed.role,
          studentId: seed.studentId,
          title: seed.title,
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { detail: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create session token if not already from backend
    if (!token) {
      token = createSessionToken(authenticatedUser);
    }

    const redirectUrl = workspaceFor(authenticatedUser);
    const response = NextResponse.json({
      status: "success",
      user: authenticatedUser,
      redirect: redirectUrl,
    });

    const isSecure =
      process.env.NODE_ENV === "production" ||
      request.headers.get("x-forwarded-proto") === "https";

    response.cookies.set(sessionCookie, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
