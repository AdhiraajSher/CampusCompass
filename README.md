# CampusCompass — Adaptive Student Intervention System (ASIS)

<div align="center">

> *"See the signs. Change the story."*

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.1.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI%20Engine-6366F1?style=for-the-badge)](https://openrouter.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**CampusCompass** is an intelligent, full-stack student support and early-intervention platform designed for modern higher education institutions and schools. It connects students, educators, and mentors through role-scoped workspaces, real-time risk telemetry, a 1-minute daily conversational check-in, a transparent research-informed **CC Score** rubric, and an **adaptive intervention loop** that learns from failed outreach to recommend fresh, evidence-based support strategies.

[Latest Updates](#-latest-updates--whats-new) • [Key Features](#-key-features) • [Architecture](#-architecture) • [Demo Accounts](#-demo-accounts--credentials) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Database & Security](#-database-schema--rls) • [Push Guide](#-git-push-instructions)

---

</div>

## 🚀 Latest Updates & What's New

The latest iteration unifies the backend security hardening with the student self-advocacy and staff coordination suite:

1. **🔒 Enterprise RBAC & Security Hardening (FastAPI v2.1.0)**:
   - **Strict Data-Leakage Guards**: Hard runtime enforcement (`enforce_student_scope`) preventing students from viewing cohort rosters or other students' records.
   - **PBKDF2-HMAC-SHA256 Password Hashing**: 100,000 hash iterations with unique cryptographic salts and constant-time password verification (`auth_service.py`).
   - **Automated Security Verification Suite**: [`backend/test_security_rbac.py`](file:///Users/ashishsingh/antigravity/backend/test_security_rbac.py) verifying credential authentication, HMAC tamper resistance, student self-isolation, and staff permissions.
   - **Host-Ready Security Headers**: Middleware injecting `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and strict Referrer Policies.

2. **📋 Staff Task Queue & CSV Priority Engine (`/tasks`)**:
   - **Transparent Priority Logic**: Automated triaging into **P1** (Attendance < 75%, $\ge 5$ consecutive absences, or grade < 60%), **P2** (Attendance < 85%, $\ge 3$ absences, or subject < 65%), and **P3** (Scheduled follow-ups).
   - **CSV Ingestion with Continuation Rows**: Robust parsing of attendance and student demographic CSVs, preserving intervention continuation rows and multi-period records.
   - **Exclusion of Failed Strategies**: The task engine automatically excludes prior failed intervention names from new recommendations.

3. **🛡️ Dedicated Private Support Lane**:
   - Students can request direct, confidential help with priority delivery (*"Contact me soon"* = P1, routine = P2).
   - Within any priority band, **private support requests sort first**.
   - **Zero Privacy Leakage**: Staff receive contact timing, assignment, and status—**never** the student's raw quiz answers, emotional diary, or diagnostic labels.

4. **🌱 Student Workspace & CC Score v0.1 Rubric (`/student`)**:
   - **Research-Informed CC Score**: 6-domain positive self-assessment normalized to 0–100 with missing data tolerance.
   - **Student Consent First**: Summary score sharing is disabled by default; students can preview their score, request private help without taking the quiz, or permanently delete their check-in data at any time.

5. **🤖 Two-Step AI Daily Check-In**:
   - **Prompt A (Empathetic Questioner)**: Warm, non-intrusive micro-check-ins considering academic and extracurricular load.
   - **Prompt B (Insight Extractor)**: Natural language processing extracting quantitative mood scores ($1-5$) and stressor tags (`#calculus`, `#sleep`, `#burnout`) with graceful offline fallbacks.

---

## ⚡ Key Workspaces & Capabilities

### 🎓 1. Student Workspace (`/student`)
- **Inverse Dark/Emerald Interface**: Distinct visual atmosphere prioritizing student psychological safety.
- **1-Minute AI Check-in & CC Quiz**: Quick conversational prompts or 6-question CC Score assessment.
- **Self-Advocacy & Privacy Controls**:
  - Request help with one click (General or Private).
  - Explicit consent toggles for sharing wellbeing summaries with mentors.
  - One-click quiz data deletion without cancelling active support requests.

### 👩‍🏫 2. Educator & Staff Dashboard (`/workspace` & `/tasks`)
- **Priority Intervention Queue**: Dynamic queue sorting students by real-time risk score ($0-100$).
- **Academic & Attendance Telemetry**: 4-week trend graphs for subject grades, attendance percentages, and unexcused absences.
- **Intervention Studio**: Propose, review, assign, approve, or mark intervention outcomes (`Success` / `Failed`).
- **Classroom Behavioral Logs**: Direct behavioral notes scoped strictly to enrolled class rosters.
- **Task Management**: Open, In Progress, and Done states with assignment tracking.

### 🧭 3. Mentor Caseload Portal (`/mentor`)
- **Holistic Caseload Overview**: Scoped view combining academic progress with check-in mood history and emotional stress tags.
- **Cross-Domain Synthesis**: Highlights discrepancies between academic effort and emotional burnout.
- **Caseload Isolation**: Mentors can only view assigned mentees; academic staff evidence outside their scope is stripped before serialization.

### 🔄 4. The Adaptive Intervention Engine
Unlike static ticketing systems, interventions adapt dynamically when marked as failed:

```
[Intervention: Automated Email Nudge] ──> FAILED (Low engagement)
                   │
                   ▼  (AI Evaluation Engine adapts approach)
[Intervention: Peer Tutoring & Guided Practice] ──> FAILED (Struggling with core concepts)
                   │
                   ▼
[Intervention: 1-on-1 Faculty Advisor Check-in & Reduced Assignment Load]
                   │
                   ▼
[Intervention: Academic Counselor Support Plan & Flexible Office Hours]
```

---

## 🏗 Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Client Browser                                │
│    Landing Page · Demo Role Selector · Student / Staff / Mentor Views  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  HTTP / JSON (Port 5174 / Proxied API)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 16 / React 19)                     │
│  - App Router & Server Components                                      │
│  - BFF Proxy Routes (/api/students, /api/checkin/*, /api/tasks)        │
│  - HMAC-SHA256 Demo Session Cookies & Security Headers                 │
│  - CSV Data Parsers (Continuation rows & Priority rules)               │
│  - Mona Sans, Lucide Icons & Tailwind CSS v4                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Bearer Token (HMAC-signed session)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI / Python 3.11+)                    │
│  - Scoped RBAC Middleware (@require_role, enforce_student_scope)       │
│  - PBKDF2-HMAC-SHA256 Password Hash Service (100k rounds)              │
│  - Multi-Factor Risk Engine (0-100 score computation)                  │
│  - Two-Step AI Engine (Prompt A Questioner + Prompt B Insight Extractor│
│  - Host-Ready Security Headers (nosniff, DENY, XSS, Referrer)          │
│  - Port 8000 · OpenAPI / Swagger Docs at /docs                         │
└────────────────────────┬──────────────────────┬────────────────────────┘
                         │                      │
                         ▼                      ▼
        ┌─────────────────────────┐    ┌─────────────────────────┐
        │   Supabase / Postgres   │    │   OpenRouter AI Engine  │
        │ - PostgreSQL with RLS   │    │ - Prompt A & B Models   │
        │ - 5 Relational Tables   │    │ - Fallback Resilience   │
        │ - Seed Data Fixtures    │    │   (Zero-Crash Offline)  │
        └─────────────────────────┘    └─────────────────────────┘
```

---

## 👥 Demo Accounts & Credentials

The system comes pre-seeded with ready-to-test accounts across all roles. The default password for all demo accounts is **`password123`**.

| Role | Email | Password | Access Scope |
|:-----|:------|:---------|:-------------|
| **Student** | `aarav@student.edu`<br>*(alt: `student@school.edu`)* | `password123` | **Student Hub (`/student`)** — Daily AI check-in, personal mood tracking, self-records, private support requests. Strictly blocked from staff directory. |
| **Educator / Teacher** | `anika@school.edu`<br>*(alt: `teacher@school.edu`)* | `password123` | **Staff Workspace & Tasks** — Class roster, academic grades, attendance telemetry, behavioral logs, intervention proposals. |
| **Mentor** | `riya@school.edu`<br>*(alt: `mentor@school.edu`)* | `password123` | **Mentor Workspace** — Assigned student caseload, holistic academic + wellbeing mood trends, intervention tracking. |

> [!TIP]
> You can also click **"One-Click Demo Sign In"** on the `/demo` page to immediately enter any role without typing credentials.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 20.0.0 & **npm**
- **Python** ≥ 3.11 & **pip**
- *(Optional)* Supabase account & OpenRouter API key (both feature seamless offline fallbacks)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/YOUR_USERNAME/campuscompass.git
cd campuscompass

# Install root orchestration tools
npm install

# Install Frontend dependencies (Next.js 16, React 19, Tailwind)
cd frontend && npm install && cd ..

# Setup Backend Python virtual environment
cd backend
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

Or run the convenient one-liner from root:
```bash
npm run install:all
```

### 2. Environment Configuration

Copy the provided environment templates:

```bash
# Frontend environment
cp frontend/.env.example frontend/.env

# Backend environment
cp backend/.env.example backend/.env
```

**Frontend (`frontend/.env`):**
```env
DEMO_SESSION_SECRET=development-demo-only-change-me
API_BASE_URL=http://127.0.0.1:8000
```

**Backend (`backend/.env`):**
```env
DEMO_SESSION_SECRET=development-demo-only-change-me
ALLOWED_ORIGINS=http://127.0.0.1:5174,http://localhost:5174

# Optional: Add Supabase & OpenRouter for live cloud persistence & LLMs
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openrouter/free
```

### 3. Run the Development Servers

#### Option A: Unified Launcher (Recommended)
Run both backend and frontend concurrently with a single command:
```bash
./dev.sh
```
*Alternatively: `npm run dev`*

#### Option B: Separate Terminals
```bash
# Terminal 1: Backend (FastAPI on Port 8000)
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: Frontend (Next.js on Port 5174)
cd frontend
npm run dev
```

### 4. Open the Application
- 🌐 **Frontend Application**: [http://127.0.0.1:5174](http://127.0.0.1:5174)
- 🔑 **Demo Sign-In**: [http://127.0.0.1:5174/demo](http://127.0.0.1:5174/demo)
- 📑 **Backend Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- 🩺 **Health Endpoint**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 📡 API Reference

All protected endpoints expect a Bearer session token: `Authorization: Bearer <token>`.

### Authentication & System
| Method | Endpoint | Allowed Roles | Description |
|:-------|:---------|:--------------|:------------|
| `GET` | `/health` | Public | System health check and Supabase connectivity status |
| `POST` | `/auth/login` | Public | Authenticates credentials, returns PBKDF2-verified user & token |
| `GET` | `/auth/me` | Authenticated | Returns identity profile of currently logged-in user |

### Student Check-in & Self-Service
| Method | Endpoint | Allowed Roles | Description |
|:-------|:---------|:--------------|:------------|
| `GET` | `/checkin/status` | `student` | Checks if today's check-in is pending; runs Prompt A generator |
| `POST` | `/checkin/submit` | `student` | Submits check-in text; Prompt B extracts mood score (1-5) and tags |
| `GET` | `/student/dashboard` | `student` | Returns self-scoped mood history and academic metrics (enforces self-scope) |

### Educator, Tasks & Mentor Operations
| Method | Endpoint | Allowed Roles | Description |
|:-------|:---------|:--------------|:------------|
| `GET` | `/teacher/roster` | `teacher` | Class roster, grades, and attendance for teacher's enrolled students |
| `POST` | `/teacher/behavior-log`| `teacher` | Records behavioral classroom observation for an enrolled student |
| `GET` | `/mentor/dashboard` | `mentor` | Holistic dashboard (grades, attendance, mood trends) for assigned caseload |
| `GET` | `/students` | `teacher`, `mentor` | Full priority-risk student directory (strictly forbidden to students) |
| `POST` | `/interventions` | `teacher`, `mentor` | Proposes a new targeted student intervention |
| `POST` | `/interventions/evaluate`| `teacher`, `mentor` | AI adaptive evaluation engine recommending next step after a failure |

---

## 🔒 Database Schema & RLS

CampusCompass provides a production-ready PostgreSQL / Supabase migration script located in [`schema.sql`](file:///Users/ashishsingh/antigravity/schema.sql).

### Core Tables
1. **`users`**: UUID primary key, email, salted PBKDF2 hash, role (`student`, `teacher`, `mentor`).
2. **`student_profiles`**: Extracurricular load profile, assigned mentor linkage.
3. **`mood_logs`**: Check-in records, mood score ($1-5$), stress tags array (`TEXT[]`), unique index per student per calendar day.
4. **`academic_records`**: Subject-level grades ($0-100$), attendance rates ($0-100$), assigned teacher.
5. **`interventions`**: AI rationales, review periods, owners, status (`Pending`, `Success`, `Failed`).

### Row Level Security (RLS) Guarantees
- **Student Privacy Policy**: `mood_logs` are accessible only to the student who wrote them and their explicitly assigned mentor.
- **Teacher Isolation Policy**: Teachers can only inspect academic records for students enrolled in their classes.
- **Staff Access Policy**: Intervention proposals and evaluations can only be modified by authenticated staff (`teacher` or `mentor`).

---

## 🧪 Testing & Verification

Run tests and verification across both layers:

```bash
# 1. Run Backend Security & RBAC Test Suite
cd backend
python -m unittest test_security_rbac.py
cd ..

# 2. Run Frontend Unit and Integration Tests (Vitest)
npm run test

# 3. TypeScript Type Checking
npm run typecheck

# 4. Production Build Verification
npm run build
```

---

## 🌐 Cloud Deployment (Render + Vercel)

Deploying CampusCompass is split cleanly between **Render** (FastAPI backend) and **Vercel** (Next.js frontend):

### Step 1: Deploy Backend on Render (Deploy First)
1. Push your repository to GitHub.
2. Sign in to [Render](https://dashboard.render.com/) and click **New +** → **Web Service**.
3. Select your repository.
4. Configure service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
5. Under **Environment Variables**, add:
   - `DEMO_SESSION_SECRET`: *(Generate a secure string, e.g. `openssl rand -hex 32`)*
   - `ALLOWED_ORIGINS`: `https://*.vercel.app,http://localhost:3000` *(You will add your specific Vercel URL after Step 2)*
   - *(Optional)* `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`
6. Click **Create Web Service**. Once deployed, copy your service URL (e.g. `https://campuscompass-api.onrender.com`).

---

### Step 2: Deploy Frontend on Vercel
1. Sign in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. In the configuration screen:
   - **Root Directory**: Click *Edit* and select **`frontend`**.
   - **Framework Preset**: **Next.js** *(auto-detected)*.
4. Under **Environment Variables**, configure:
   - `API_BASE_URL`: Paste your Render backend URL (e.g., `https://campuscompass-api.onrender.com` without trailing slash).
   - `DEMO_SESSION_SECRET`: Paste the **exact same** secret used on Render in Step 1.
5. Click **Deploy**. Vercel will build and assign your domain (e.g., `https://campuscompass.vercel.app`).

---

### Step 3: Link CORS Origins
1. Return to your Render Dashboard for `campuscompass-backend`.
2. Update `ALLOWED_ORIGINS` to include your live Vercel domain:
   ```env
   ALLOWED_ORIGINS=https://campuscompass.vercel.app,https://*.vercel.app
   ```
3. Save changes — Render will automatically reload with your verified domain allowed!

---

## 👥 Two Developers, One Repository

This codebase is structured for clean two-developer ownership:

| Area | Primary Ownership | Responsibility |
|:-----|:------------------|:---------------|
| **Frontend** (`frontend/`) | Developer 1 (`feat/frontend-dashboard`) | Next.js screens, animations, student workspace, task queue, and UI interactions |
| **Backend** (`backend/`) | Developer 2 (`feat/backend-students`) | FastAPI routes, RBAC middleware, risk scoring, AI engine, and security suites |
| **Shared** (`shared/`, `schema.sql`) | Joint Review | Database schema, RLS policies, fixture data, and root CI workflows |

---

## 🚢 Git Push Instructions

Ready to push your changes to GitHub? Follow these steps:

```bash
# 1. Check current repository status (sensitive files and .venv are ignored via .gitignore)
git status

# 2. Stage all project files
git add .

# 3. Commit with a clear, conventional commit message
git commit -m "feat: complete CampusCompass with RBAC, 1-min AI check-in, task queue, and security suite"

# 4. Set remote repository URL (if not already set)
# git remote add origin https://github.com/YOUR_USERNAME/campuscompass.git

# 5. Push to main branch
git push -u origin main
```

---

## 🛡 Ethical AI & Student Privacy

CampusCompass is built under strict ethical computing guidelines:
- **Non-Punitive Design**: Risk scores and check-ins are designed to trigger support, mentorship, and load reduction — never disciplinary actions.
- **Psychological Safety**: Student check-in reflections are confidential. Mentors receive synthesized mood scores and thematic tags, not exposed private journaling.
- **Private Support First**: Choosing private support does not generate negative academic flags or change academic priority.
- **Transparency**: Every AI-generated recommendation includes clear rationale explaining why the action was suggested based on prior outcomes.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

*CampusCompass is a prototype demonstration utilizing synthetic data. Designed for academic institutions committed to student success.*
