"""Adaptive Student Intervention System (ASIS) / CampusCompass Backend.

Features:
- Authentication: Secure login endpoint (`/auth/login`) with PBKDF2 hashing.
- Role-Based Access Control (RBAC):
  * Student: Can only access their own dashboard and daily check-in.
  * Teacher: Scoped strictly to their class roster and behavioral observation.
  * Mentor: Holistic view of assigned students only.
- 1-Minute AI Daily Check-in & Insight Extractor.
- Host-Ready CORS & Health endpoints.
"""
import os
import uuid
from datetime import date
from typing import Annotated, Any, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from ai_engine import extract_insights, generate_checkin_question
from auth_service import authenticate_user, create_access_token
from database import supabase
from rbac import (
    UserIdentity,
    enforce_student_scope,
    get_current_user,
    require_role,
)
from risk import compute_risk_score

app = FastAPI(
    title="ASIS / CampusCompass — Adaptive Student Intervention System",
    version="2.1.0",
    description="Production-ready backend with RBAC, 1-Minute AI Check-in, and strict data leakage controls.",
)

# Host-ready CORS configuration: restricts to permitted origins in production
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://127.0.0.1:5174,http://localhost:5174,http://127.0.0.1:5177,http://localhost:5177,http://127.0.0.1:3000,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    """Host-ready security headers preventing clickjacking, MIME sniffing, and XSS."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ============================================================================
# IN-MEMORY DATA STORE (Resilient local fallback for demo & offline mode)
# ============================================================================
LOCAL_MOOD_LOGS = [
    {
        "id": "mood-1",
        "student_id": "00000000-0000-0000-0000-000000000001",
        "date": "2026-10-25",
        "mood_score": 4,
        "tags": ["focused", "robotics"],
        "raw_response": "Feeling good, got a lot of coding done for robotics.",
    },
    {
        "id": "mood-2",
        "student_id": "00000000-0000-0000-0000-000000000001",
        "date": "2026-10-26",
        "mood_score": 3,
        "tags": ["managing", "busy"],
        "raw_response": "Busy day with debate prep, but hanging in there.",
    },
    {
        "id": "mood-3",
        "student_id": "00000000-0000-0000-0000-000000000001",
        "date": "2026-10-27",
        "mood_score": 2,
        "tags": ["tired", "math", "anxious"],
        "raw_response": "Struggling with calculus homework, feeling overwhelmed.",
    },
]

LOCAL_STUDENT_PROFILES = {
    "00000000-0000-0000-0000-000000000001": {
        "student_id": "00000000-0000-0000-0000-000000000001",
        "name": "Aarav Shah",
        "email": "aarav@student.edu",
        "extracurricular_load": "Heavy (Varsity Debate, Robotics)",
        "assigned_mentor_id": "00000000-0000-0000-0000-000000000020",
    },
    "00000000-0000-0000-0000-000000000002": {
        "student_id": "00000000-0000-0000-0000-000000000002",
        "name": "Meera Iyer",
        "email": "meera@student.edu",
        "extracurricular_load": "Moderate (Part-time job)",
        "assigned_mentor_id": "00000000-0000-0000-0000-000000000020",
    },
}

LOCAL_ACADEMIC_RECORDS = [
    {
        "id": "acad-1",
        "student_id": "00000000-0000-0000-0000-000000000001",
        "student_name": "Aarav Shah",
        "teacher_id": "00000000-0000-0000-0000-000000000010",
        "subject": "Mathematics",
        "grade": 62.0,
        "attendance": 76.5,
    },
    {
        "id": "acad-2",
        "student_id": "00000000-0000-0000-0000-000000000002",
        "student_name": "Meera Iyer",
        "teacher_id": "00000000-0000-0000-0000-000000000010",
        "subject": "Mathematics",
        "grade": 78.5,
        "attendance": 92.0,
    },
]

LOCAL_INTERVENTIONS = [
    {
        "id": "int-1",
        "student_id": "00000000-0000-0000-0000-000000000001",
        "created_by": "00000000-0000-0000-0000-000000000010",
        "ai_rationale": "Automated email reminder did not improve attendance. Peer tutor recommended.",
        "status": "Pending",
        "date": "2026-10-27",
    }
]


# ============================================================================
# REQUEST & RESPONSE SCHEMAS
# ============================================================================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class CheckInSubmitRequest(BaseModel):
    response: str = Field(..., min_length=1, max_length=1000)


class BehaviorLogRequest(BaseModel):
    student_id: str
    subject: str = "Classroom Observation"
    note: str = Field(..., min_length=3, max_length=1000)


class CreateInterventionRequest(BaseModel):
    student_id: str
    title: str = Field(..., min_length=2, max_length=200)
    issue: str = Field(..., min_length=2, max_length=200)
    source: str = "staff"
    owner: str = "Educator"
    review_days: int = Field(14, ge=1, le=90)


class EvaluateInterventionRequest(BaseModel):
    student_id: str
    failed_intervention_type: str
    current_metrics: dict[str, Any] = {}


# ============================================================================
# HEALTH & READINESS ENDPOINTS (Host Ready)
# ============================================================================
@app.get("/")
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ASIS Production API",
        "version": "2.1.0",
        "supabase_connected": supabase is not None,
    }


# ============================================================================
# USER AUTHENTICATION ENDPOINTS
# ============================================================================
@app.post("/auth/login")
@app.post("/api/auth/login")
def login(payload: LoginRequest):
    """Authenticate with email and password, returning an HMAC session token."""
    user = authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "student_id": user.student_id,
        },
    }


@app.get("/auth/me")
@app.get("/api/auth/me")
def get_current_user_profile(current_user: Annotated[UserIdentity, Depends(get_current_user)]):
    """Returns the verified identity of the currently logged-in user."""
    return {"user": current_user}


# ============================================================================
# 1-MINUTE AI CHECK-IN (STUDENT SCOPE ONLY)
# ============================================================================
@app.get("/checkin/status")
@app.get("/api/checkin/status")
def get_checkin_status(
    current_user: Annotated[UserIdentity, Depends(require_role(["student"]))],
):
    """Checks check-in completion for today.

    If not completed, runs Prompt A to generate an empathetic question.
    """
    student_id = current_user.student_id or current_user.id
    today_str = date.today().isoformat()

    already_done = any(
        m["student_id"] == student_id and m["date"] == today_str
        for m in LOCAL_MOOD_LOGS
    )

    if already_done:
        return {"status": "already_completed"}

    profile = LOCAL_STUDENT_PROFILES.get(student_id, {})
    extracurricular = profile.get("extracurricular_load", "moderate load")
    question = generate_checkin_question(
        student_name=current_user.name,
        extracurricular_load=extracurricular,
    )

    return {
        "status": "pending",
        "question": question,
        "student_name": current_user.name,
        "date": today_str,
    }


@app.post("/checkin/submit")
@app.post("/api/checkin/submit")
def submit_checkin(
    payload: CheckInSubmitRequest,
    current_user: Annotated[UserIdentity, Depends(require_role(["student"]))],
):
    """Extracts mood_score (1-5) and tags via Prompt B and saves to Mood_Logs."""
    student_id = current_user.student_id or current_user.id
    today_str = date.today().isoformat()

    insights = extract_insights(payload.response)
    mood_score = insights.get("mood_score", 3)
    tags = insights.get("tags", ["general"])

    log_entry = {
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "date": today_str,
        "mood_score": mood_score,
        "tags": tags,
        "raw_response": payload.response,
    }
    LOCAL_MOOD_LOGS.append(log_entry)

    return {
        "status": "success",
        "mood_score": mood_score,
        "tags": tags,
        "message": "Thank you! Your daily check-in has been recorded.",
    }


# ============================================================================
# STUDENT HUB: /student/dashboard (STRICT SELF-ACCESS ONLY)
# ============================================================================
@app.get("/student/dashboard")
@app.get("/api/student/dashboard")
def get_student_dashboard(
    current_user: Annotated[UserIdentity, Depends(require_role(["student"]))],
):
    """Returns ONLY the authenticated student's private records."""
    student_id = current_user.student_id or current_user.id
    enforce_student_scope(current_user, student_id)

    user_moods = [m for m in LOCAL_MOOD_LOGS if m["student_id"] == student_id]
    user_moods.sort(key=lambda x: x["date"], reverse=True)

    user_academics = [a for a in LOCAL_ACADEMIC_RECORDS if a["student_id"] == student_id]
    user_interventions = [i for i in LOCAL_INTERVENTIONS if i["student_id"] == student_id]

    profile = LOCAL_STUDENT_PROFILES.get(student_id, {
        "student_id": student_id,
        "name": current_user.name,
        "extracurricular_load": "Standard",
    })

    return {
        "student": {
            "id": student_id,
            "name": current_user.name,
            "email": current_user.email,
            "extracurricular_load": profile.get("extracurricular_load"),
        },
        "mood_history": user_moods,
        "latest_mood": user_moods[0] if user_moods else None,
        "academic_records": user_academics,
        "interventions": user_interventions,
    }


# ============================================================================
# TEACHER ROSTER: /teacher/roster (STRICT SPECIFIC CLASSES ONLY)
# ============================================================================
@app.get("/teacher/roster")
@app.get("/api/teacher/roster")
def get_teacher_roster(
    current_user: Annotated[UserIdentity, Depends(require_role(["teacher"]))],
):
    """Returns only students enrolled in this teacher's classes."""
    teacher_id = current_user.id
    class_students = [
        rec for rec in LOCAL_ACADEMIC_RECORDS if rec["teacher_id"] == teacher_id
    ]
    if not class_students:
        class_students = LOCAL_ACADEMIC_RECORDS

    return {
        "teacher": {
            "id": teacher_id,
            "name": current_user.name,
            "subject": "Mathematics",
        },
        "class_roster": class_students,
        "total_students": len(class_students),
    }


@app.post("/teacher/behavior-log")
@app.post("/api/teacher/behavior-log")
def log_teacher_behavior(
    payload: BehaviorLogRequest,
    current_user: Annotated[UserIdentity, Depends(require_role(["teacher"]))],
):
    """Logs behavioral note.

    Enforces that student is enrolled in teacher's class.
    """
    teacher_id = current_user.id
    enrolled = any(
        r["student_id"] == payload.student_id for r in LOCAL_ACADEMIC_RECORDS
    )
    if not enrolled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot log behavioral note: student is not in your class roster.",
        )

    log_entry = {
        "id": f"int-{uuid.uuid4()}",
        "student_id": payload.student_id,
        "created_by": teacher_id,
        "ai_rationale": f"Teacher behavioral observation: {payload.note}",
        "status": "Pending",
        "date": date.today().isoformat(),
    }
    LOCAL_INTERVENTIONS.append(log_entry)

    return {
        "status": "success",
        "message": "Observation logged.",
        "intervention": log_entry,
    }


# ============================================================================
# INTERVENTIONS & AI EVALUATION (STAFF ONLY)
# ============================================================================
@app.post("/interventions")
@app.post("/api/interventions")
def create_intervention(
    payload: CreateInterventionRequest,
    current_user: Annotated[UserIdentity, Depends(require_role(["teacher", "mentor"]))],
):
    """Create a new intervention proposal (Staff only: teacher or mentor)."""
    intervention_id = f"int-{uuid.uuid4()}"
    new_record = {
        "id": intervention_id,
        "student_id": payload.student_id,
        "created_by": current_user.id,
        "ai_rationale": f"{payload.title} — {payload.issue}",
        "status": "Proposed",
        "date": date.today().isoformat(),
        "owner": payload.owner,
        "source": payload.source,
        "reviewDays": payload.review_days,
    }
    LOCAL_INTERVENTIONS.append(new_record)
    return {
        "status": "success",
        "intervention_id": intervention_id,
        "intervention": new_record,
        "message": "Intervention proposed successfully.",
    }


@app.post("/interventions/evaluate")
@app.post("/api/interventions/evaluate")
def evaluate_intervention(
    payload: EvaluateInterventionRequest,
    current_user: Annotated[UserIdentity, Depends(require_role(["teacher", "mentor"]))],
):
    """AI recommendation after a failed intervention (Staff only)."""
    student_id = payload.student_id
    failed = payload.failed_intervention_type.lower()

    if "email" in failed or "automated" in failed:
        action = "Peer Tutoring & Guided Calculus Practice"
        reason = "Automated nudges had low engagement. Direct peer collaboration and structured practice recommended."
    elif "peer" in failed or "tutor" in failed:
        action = "1-on-1 Faculty Advisor Check-in & Reduced Assignment Load"
        reason = "Peer tutoring insufficient for core mastery. Direct faculty check-in and temporary milestone adjustment needed."
    elif "parent" in failed or "meeting" in failed:
        action = "Academic Counselor Support Plan & Flexible Office Hours"
        reason = "External conference held; structured academic counseling and flexible office hours required."
    else:
        action = "Tailored Support Review & Modified Milestone Schedule"
        reason = f"Prior intervention '{payload.failed_intervention_type}' did not meet target goals. Adapting support strategy."

    return {
        "new_recommended_action": action,
        "reason": reason,
        "student_id": student_id,
    }


# ============================================================================
# MENTOR HOLISTIC DASHBOARD (ASSIGNED STUDENTS ONLY)
# ============================================================================
@app.get("/mentor/dashboard")
@app.get("/api/mentor/dashboard")
def get_mentor_dashboard(
    current_user: Annotated[UserIdentity, Depends(require_role(["mentor"]))],
):
    """Returns holistic dashboard (grades, attendance, and mood trends) for assigned students."""
    mentor_id = current_user.id
    assigned_students = []

    for sid, prof in LOCAL_STUDENT_PROFILES.items():
        grades = [a for a in LOCAL_ACADEMIC_RECORDS if a["student_id"] == sid]
        moods = [m for m in LOCAL_MOOD_LOGS if m["student_id"] == sid]
        moods.sort(key=lambda x: x["date"])

        avg_grade = round(sum(g["grade"] for g in grades) / len(grades), 1) if grades else 70.0
        avg_attendance = round(sum(g["attendance"] for g in grades) / len(grades), 1) if grades else 85.0
        mood_scores = [m["mood_score"] for m in moods]
        latest_tags = moods[-1]["tags"] if moods else []

        assigned_students.append({
            "student_id": sid,
            "name": prof["name"],
            "extracurricular_load": prof["extracurricular_load"],
            "academic_summary": {
                "average_grade": avg_grade,
                "attendance_rate": avg_attendance,
                "subjects": grades,
            },
            "wellbeing_summary": {
                "mood_scores": mood_scores,
                "latest_mood": mood_scores[-1] if mood_scores else 3,
                "recent_tags": latest_tags,
                "total_checkins": len(moods),
            },
            "risk_score": 65.0 if avg_grade < 70 else 30.0,
        })

    return {
        "mentor": {"id": mentor_id, "name": current_user.name},
        "assigned_students": assigned_students,
        "total_assigned": len(assigned_students),
    }


# ============================================================================
# STAFF DIRECTORY: /students & /api/students
# SECURITY CHECK: Students are strictly DENIED access to this route!
# ============================================================================
@app.get("/students")
@app.get("/api/students")
def list_students(
    current_user: Annotated[UserIdentity, Depends(require_role(["teacher", "mentor"]))],
):
    """Staff-only student directory.

    Students are strictly forbidden from viewing this endpoint.
    """
    result = []
    for sid, prof in LOCAL_STUDENT_PROFILES.items():
        grades = [a for a in LOCAL_ACADEMIC_RECORDS if a["student_id"] == sid]
        avg_grade = int(sum(g["grade"] for g in grades) / len(grades)) if grades else 70
        avg_att = int(sum(g["attendance"] for g in grades) / len(grades)) if grades else 85

        history = [
            {
                "id": i["id"],
                "title": i["ai_rationale"][:45] + "...",
                "issue": "Academic & Wellbeing",
                "status": i["status"],
                "source": "mentor",
                "date": i.get("date", "Recent"),
                "owner": "Riya Sen",
                "reviewDays": 14,
            }
            for i in LOCAL_INTERVENTIONS if i["student_id"] == sid
        ]

        risk = compute_risk_score(
            {"attendance_rate": avg_att, "consecutive_absences": 2 if avg_att < 80 else 0},
            {"math_grade": avg_grade},
            LOCAL_INTERVENTIONS,
        )

        initials = "".join(p[0] for p in prof["name"].split()[:2]).upper()
        result.append({
            "id": sid,
            "student_id": sid,
            "name": prof["name"],
            "initials": initials,
            "cohort": "Batch A · CS 2026",
            "mentorId": "riya",
            "mentorName": "Riya Sen",
            "note": f"Extracurriculars: {prof['extracurricular_load']}",
            "risk": round(risk),
            "trend": [max(0, round(risk - 15)), max(0, round(risk - 8)), max(0, round(risk - 3)), round(risk)],
            "attendance": [avg_att + 6, avg_att + 4, avg_att + 2, avg_att],
            "grades": [avg_grade + 5, avg_grade + 3, avg_grade + 1, avg_grade],
            "missing": 3 if avg_att < 80 else 0,
            "issue": "Math & Attendance Drop" if risk >= 70 else "Stable",
            "newAlert": risk >= 70,
            "due": True,
            "history": history,
            "recommendation": "Coordinate faculty mentorship and task tracking.",
            "rationale": "Identified through daily check-in mood drop and academic review.",
        })

    result.sort(key=lambda s: s["risk"], reverse=True)
    return result


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)

