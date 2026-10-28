# CampusCompass — 4-Person Git Contribution & Push Guide

This guide divides the CampusCompass application cleanly into **4 distinct ownership areas** so that 4 team members can push their own authentic commits, branches, and pull requests to GitHub:

Repository: **`https://github.com/AdhiraajSher/CampusCompass.git`**

---

## 👥 Team Breakdown & Ownership Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CampusCompass Monorepo                            │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Contributor        │ Branch Name        │ Primary Domain               │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 👤 Person 1 (Lead) │ feat/backend-rbac  │ Backend Security, Auth & RBAC│
│ 👤 Person 2        │ feat/ai-database   │ AI Check-In, Risk & Supabase │
│ 👤 Person 3        │ feat/staff-tasks   │ Educator & Mentor Workspaces │
│ 👤 Person 4        │ feat/student-ui    │ Student Portal, CC-Score & UI│
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

## 👤 Person 1: Backend Security, RBAC & Auth Architecture

- **Role**: Backend & Security Engineer
- **Branch**: `feat/backend-rbac`
- **Owned Files**:
  ```
  backend/main.py               # FastAPI 2.1.0 application & security headers
  backend/auth_service.py       # PBKDF2-HMAC-SHA256 password hashing (100k rounds)
  backend/rbac.py               # Role-Based Access Control & data-leakage guards
  backend/session.py            # HMAC-SHA256 session token verification
  backend/test_security_rbac.py # Security & RBAC test suite
  backend/requirements.txt      # Python dependencies
  backend/.env.example          # Backend environment template
  render.yaml                   # Render Cloud deployment blueprint
  ```
- **Terminal Commands**:
  ```bash
  git checkout -b feat/backend-rbac
  git add backend/main.py backend/auth_service.py backend/rbac.py backend/session.py backend/test_security_rbac.py backend/requirements.txt backend/.env.example render.yaml
  git commit -m "feat(backend): implement FastAPI RBAC, PBKDF2 authentication, and security suite"
  git push -u origin feat/backend-rbac
  ```
- **PR Title**: `feat(backend): implement FastAPI RBAC, PBKDF2 authentication, and security suite`

---

## 👤 Person 2: AI Check-in Engine, Risk Scoring & Supabase Database

- **Role**: AI & Data Systems Engineer
- **Branch**: `feat/ai-database`
- **Owned Files**:
  ```
  backend/ai_engine.py                  # Prompt A Questioner & Prompt B Insight Extractor
  backend/risk.py                       # 0-100 multivariable risk calculation algorithm
  backend/database.py                   # Supabase PostgreSQL client + offline fallback
  schema.sql                            # Supabase PostgreSQL schema with RLS policies
  shared/fixtures/students.json         # Fictional seed student roster
  shared/fixtures/attendance.sample.csv # Attendance telemetry fixture
  shared/fixtures/students.sample.csv   # Student demographic fixture
  shared/contracts/openapi.json         # API contract specification
  scripts/export_openapi.py             # OpenAPI contract exporter script
  ```
- **Terminal Commands**:
  ```bash
  git checkout -b feat/ai-database
  git add backend/ai_engine.py backend/risk.py backend/database.py schema.sql shared/ scripts/
  git commit -m "feat(ai-data): add 2-step AI check-in engine, risk scoring, and Supabase RLS schema"
  git push -u origin feat/ai-database
  ```
- **PR Title**: `feat(ai-data): add 2-step AI check-in engine, risk scoring, and Supabase RLS schema`

---

## 👤 Person 3: Educator & Mentor Workspaces, CSV Task Queue

- **Role**: Frontend Staff Experience Engineer
- **Branch**: `feat/staff-tasks`
- **Owned Files**:
  ```
  frontend/app/workspace/page.tsx             # Educator Priority Intervention Dashboard
  frontend/app/tasks/page.tsx                 # Staff Task Queue (P1/P2/P3 triaging)
  frontend/app/wellbeing/page.tsx             # Mentor holistic wellbeing portal
  frontend/components/dashboard.tsx           # Student queue, trend charts, intervention actions
  frontend/components/task-queue.tsx          # Task coordination UI & CSV joining
  frontend/components/wellbeing-dashboard.tsx # Caseload mood trends & emotional stress tags
  frontend/lib/csv-priority.ts                # Priority sorting logic (P1, P2, P3)
  frontend/lib/wellbeing-data.ts              # Mentor caseload projection data
  frontend/app/api/tasks/                     # Task queue BFF proxy routes
  frontend/app/api/students/                  # Student roster BFF proxy routes
  frontend/app/api/interventions/             # Intervention propose/evaluate routes
  ```
- **Terminal Commands**:
  ```bash
  git checkout -b feat/staff-tasks
  git add frontend/app/workspace/ frontend/app/tasks/ frontend/app/wellbeing/ frontend/components/dashboard.tsx frontend/components/task-queue.tsx frontend/components/wellbeing-dashboard.tsx frontend/lib/csv-priority.ts frontend/lib/wellbeing-data.ts frontend/app/api/tasks/ frontend/app/api/students/ frontend/app/api/interventions/
  git commit -m "feat(frontend-staff): add educator dashboard, CSV task queue, and mentor wellbeing workspace"
  git push -u origin feat/staff-tasks
  ```
- **PR Title**: `feat(frontend-staff): add educator dashboard, CSV task queue, and mentor wellbeing workspace`

---

## 👤 Person 4: Student Portal, CC-Score Rubric, UI Chrome & System Docs

- **Role**: Frontend Student Experience & Lead Architect
- **Branch**: `feat/student-ui`
- **Owned Files**:
  ```
  frontend/app/student/page.tsx              # Student Hub & 1-minute daily check-in
  frontend/app/demo/page.tsx                 # Interactive demo role switcher
  frontend/app/page.tsx                      # Landing page with particle canvas
  frontend/app/layout.tsx                    # Root layout with font and styling imports
  frontend/components/student-portal.tsx     # Student self-advocacy & CC-Score assessment
  frontend/components/checkin-modal.tsx      # Modal check-in dialog with dynamic AI question
  frontend/components/login-form.tsx         # Clean credential authentication form
  frontend/components/chrome.tsx             # Navigation header, glass footer & abstract art
  frontend/components/effects.tsx            # Particle canvas & interactive text scramble
  frontend/lib/cc-score.ts                   # CC Score v0.1 rubric calculation (0-100)
  frontend/lib/portal-store.ts               # Student consent & private request store
  frontend/app/cc-score.css                  # CC Score styling & visual indicators
  frontend/app/student-tasks.css             # Student & task queue styles
  frontend/app/api/student/                  # Student check-in & support request routes
  frontend/app/api/auth/                     # Auth login & session routes
  docs/                                      # Complete system architecture documentation
  README.md                                  # Production-ready project documentation
  dev.sh                                     # Unified development server runner
  package.json                               # Monorepo orchestration scripts
  .gitignore                                 # Environment & dependency ignore rules
  ```
- **Terminal Commands**:
  ```bash
  git checkout -b feat/student-ui
  git add frontend/app/student/ frontend/app/demo/ frontend/app/page.tsx frontend/app/layout.tsx frontend/components/student-portal.tsx frontend/components/checkin-modal.tsx frontend/components/login-form.tsx frontend/components/chrome.tsx frontend/components/effects.tsx frontend/lib/cc-score.ts frontend/lib/portal-store.ts frontend/app/cc-score.css frontend/app/student-tasks.css frontend/app/api/student/ frontend/app/api/auth/ docs/ README.md dev.sh package.json .gitignore
  git commit -m "feat(student-ui): implement student portal, CC Score rubric, UI chrome, and documentation"
  git push -u origin feat/student-ui
  ```
- **PR Title**: `feat(student-ui): implement student portal, CC Score rubric, UI chrome, and documentation`

---

## 🚀 Recommended Pull Request & Merge Workflow

1. **Person 1** opens PR `#1` (`feat/backend-rbac` → `main`) → Team reviews and merges.
2. **Person 2** opens PR `#2` (`feat/ai-database` → `main`) → Team reviews and merges.
3. **Person 3** opens PR `#3` (`feat/staff-tasks` → `main`) → Team reviews and merges.
4. **Person 4** opens PR `#4` (`feat/student-ui` → `main`) → Team reviews and merges.

Each person gets full, authentic GitHub contribution credit without merge conflicts!
