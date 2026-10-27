# CampusCompass — Adaptive Student Intervention System (ASIS)

> *See the signs. Change the story.*

CampusCompass (ASIS) is an AI-powered, event-driven platform that proactively identifies at-risk students, tracks daily well-being through conversational AI check-ins, and generates adaptive, multi-tiered intervention recommendations for educators and mentors. 

When an intervention fails, the system learns and adapts — ensuring the next recommendation changes approach rather than repeating ineffective support loops.

---

## Key Features

- **Dynamic 1-Minute AI Check-in:** Replaces static mood sliders with a daily, personalized end-of-day AI chatbot conversation to track student sentiment and behavioral tags without survey fatigue.
- **Role-Based Access Control (RBAC):** Customized workspace environments and data access guardrails for **Students**, **Teachers**, and **Mentors/Advisors**.
- **Multi-Tiered System of Supports (MTSS):** Categorizes AI intervention recommendations across 3 tiers (Preventative, Targeted, Intensive) with strict safety guardrails.
- **Adaptive Closed-Loop Feedback:** Automatically updates student profiles when interventions are marked as `Failed`, forcing the AI engine to adjust future strategy.
- **Whole-Student Analytics:** Combines academic performance, digital engagement, self-reported stress, sleep quality, and extracurricular load to inform recommendations.

---

## Architecture & Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                             Browser                              │
│  Role-Based Dashboards (Student · Teacher · Mentor/Advisor)      │
└─────────────────────────────────┬────────────────────────────────┘
                                  │  fetch /api/students
                                  │  fetch /api/daily-checkin
                                  │  fetch /api/interventions/evaluate
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 16)                        │
│         BFF Proxy Routes  ·  HMAC Role Session Management        │
│                         Port 5174                                │
└─────────────────────────────────┬────────────────────────────────┘
                                  │  Bearer Token (HMAC-signed)
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI / Python)                    │
│   /students  ·  /daily-checkin  ·  /interventions/evaluate       │
│   RBAC Middleware  ·  Risk Engine  ·  Insight Extractor          │
│                         Port 8000                                │
└───────────────┬─────────────────┬─────────────────┬──────────────┘
                │                 │                 │
                ▼                 ▼                 ▼
          ┌───────────┐    ┌─────────────┐   ┌──────────────┐
          │ Supabase  │    │  Gemini /   │   │  OpenRouter  │
          │ Database  │    │ OpenAI API  │   │  (Optional)  │
          └───────────┘    └─────────────┘   └──────────────┘
```

### Data Flow Breakdown

1. **Daily Check-in Prompt:** At 5:00 PM, the frontend requests `GET /daily-checkin/question`. The AI inspects recent student events and generates a personalized 1-sentence prompt.
2. **Insight Extraction:** The student replies, and the backend sends the text to the AI engine (`Prompt B`), which silently extracts a 1–5 sentiment score and behavioral tags (e.g., `["sleep-deprived", "math-anxiety"]`).
3. **Risk Scoring & Triggers:** The backend calculates a dynamic risk score (0-100). Anomalies trigger intervention alerts.
4. **Adaptive AI Recommendation:** When an intervention is requested, `POST /interventions/evaluate` passes the student context (including past `FAILED` interventions) to the LLM to generate a non-repetitive MTSS recommendation.

---

## Quick Start

### Prerequisites

- **Node.js** >= 20 + `npm`
- **Python** >= 3.11

### 1. Install Dependencies

```bash
# Frontend setup
cd frontend && npm install

# Backend setup
cd ../backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Setup

```bash
# Create local backend environment config
cp backend/.env.example backend/.env

# Create local frontend environment config
cp frontend/.env.example frontend/.env
```

*Note: Shared `DEMO_SESSION_SECRET` defaults to `development-demo-only-change-me` for quick local development.*

### 3. Run Application

```bash
# Option A: Unified startup script
./dev.sh

# Option B: Run services individually
# Terminal 1 — Backend API Engine
cd backend && source .venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — Frontend Application
cd frontend && npm run dev
```

Open **http://127.0.0.1:5174** in your browser, choose a role persona (Student, Teacher, or Mentor), and explore the application.

---

## Project Structure

```
antigravity/
├── backend/                        # FastAPI Service
│   ├── main.py                    # Core routes: /students, /daily-checkin, /interventions
│   ├── database.py                # Supabase / PostgreSQL Client with RBAC
│   ├── session.py                 # HMAC token verification & security middleware
│   ├── risk.py                    # Multi-parameter Risk Scoring Algorithm (0-100)
│   ├── ai_engine.py               # Prompt pipeline (Question Gen, Sentiment Extraction, MTSS Recommendations)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                       # Next.js 16 / React 19 Frontend
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── demo/page.tsx          # Role-selection portal (Student / Teacher / Mentor)
│   │   ├── workspace/page.tsx     # Role-based workspace route handler
│   │   └── api/                   # BFF Proxy API routes
│   │       ├── students/          # Student data proxy
│   │       ├── daily-checkin/     # Dynamic AI check-in endpoints
│   │       └── interventions/     # Intervention evaluation proxy
│   ├── components/
│   │   ├── student-checkin.tsx    # End-of-day dynamic chatbot UI modal
│   │   ├── mentor-dashboard.tsx   # Holistic cohort view & MTSS action center
│   │   ├── teacher-dashboard.tsx  # Class roster & micro-intervention view
│   │   └── student-hub.tsx        # Personal task hub & help requests
│   ├── lib/
│   │   ├── api.ts                 # API client wrapper
│   │   └── domain.ts              # MTSS types, rules, and fallback evaluation logic
│   └── .env.example
├── shared/
│   └── fixtures/
│       └── students.json          # Seed data (Profiles, Mood logs, Academic history)
├── dev.sh                         # Startup script
├── package.json                   # Monorepo orchestration scripts
└── README.md                      # GitHub Repository Documentation
```

---

## Team Responsibilities & Task Allocation

| Role & Owner | Primary Focus | Key Responsibilities |
| :--- | :--- | :--- |
| **Person 1: Frontend Developer** | User Interfaces & Experience | Builds role-based dashboards (`/student`, `/teacher`, `/mentor`) and the dynamic 1-minute end-of-day AI check-in chatbot UI component. |
| **Person 2: Backend Developer** | Core APIs & Security | Implements Supabase schema, authentication, RBAC middleware, and endpoints for daily mood logs and intervention state tracking. |
| **Person 3: AI & Data Engineer** | AI Prompt Pipeline | Engineers the two-step AI engine (Question Generation + Sentiment/Tag Extraction) and the MTSS recommendation logic with failure guardrails. |
| **Person 4: Integration & QA Lead** | Orchestration & Testing | Synthesizes realistic JSON seed data, manages GitHub repository merge flows, verifies API endpoints, and performs end-to-end adaptive loop testing. |

---

## API Reference Summary

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | No | System health check |
| `GET` | `/students` | Bearer | Fetch student rosters (Filtered by user RBAC role) |
| `GET` | `/daily-checkin/question` | Bearer | Generate personalized daily 1-minute check-in prompt |
| `POST` | `/daily-checkin/answer` | Bearer | Submit response; triggers AI sentiment & tag extraction |
| `POST` | `/interventions` | Bearer | Propose, approve, or update intervention status (`Pending`/`Success`/`Failed`) |
| `POST` | `/interventions/evaluate` | Bearer | Generate adaptive MTSS recommendation considering past failed attempts |

Interactive Swagger API Docs available locally at: **http://127.0.0.1:8000/docs**

---

## Testing

Run the automated unit and integration test suite:

```bash
cd frontend && npm test
```

Tests use seed fixtures (`shared/fixtures/students.json`) to validate MTSS recommendation fallback logic, role checks, dynamic prompt extraction pipelines, and error handling.

---

*Notice: Hackathon prototype developed with simulated student datasets for demonstration purposes.*
