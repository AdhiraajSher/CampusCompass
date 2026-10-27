# CampusCompass frontend

The current Next.js application lives in `apps/frontend/`. Existing root-level screens and team documentation remain in place. This branch adds the reviewed frontend and the shared fixtures/build configuration it requires. Python backend implementations remain a separate ownership area.

## Run

Requires Node.js 24 and npm. From the repository root:

```sh
npm ci
cp apps/frontend/.env.example apps/frontend/.env.local
npm run dev
```

Open http://127.0.0.1:5177/demo. Choose a fictional account. Sign out before exploring a different role.

Set `API_BASE_URL` in the local environment to your teammate's Python service URL. Its demo signing secret must match `DEMO_SESSION_SECRET`. The example points to port 8001; change that if your service runs elsewhere. Academic reads require that service. Student check-ins and staff task coordination run through Next.js routes.

## Included UI

- Responsive landing page and educator interface with self-hosted Mona Sans, glass abstracts, cursor particles, button hovers, text scramble and first-appearance effects.
- Shared teacher/batch-manager academic dashboard and restricted mentor wellbeing workspace.
- Separate inverse-color student workspace with six voluntary questions, CC Score preview, saving consent, summary-sharing choice and check-in deletion.
- CSV-based staff task priorities, intervention history, failed-action exclusions and review dates.
- Dedicated private-support requests with staff assignment and status visible to the student.
- Server-side role checks and identity-bound student APIs. Raw student-submitted quiz answers never enter staff task responses.
- Loading, empty and error handling for the live academic API.

The CC Score uses an explicit research-informed prototype rubric. It is unvalidated and does not change academic risk, grades or eligibility. Privacy preference alone creates no task and does not increase academic urgency.

## Backend integration contract

The frontend proxies `GET /students` to the configured service with a signed identity. The expected records and role projections are documented in `shared/contracts/openapi.json`; the shared fictional JSON also supports frontend integration tests. Teachers/managers may receive academic evidence. Mentors receive only assigned mentoring records without academic staff evidence. The student account cannot access the academic proxy.

The current frontend does not call the broader project's proposed conversational check-in or LLM endpoints. Coordinate contract changes with the backend owner rather than assuming the latest UI already implements those integrations.

## Data and state

- `shared/fixtures/students.json` contains fictional academic records.
- The two `*.sample.csv` files contain synthetic CSV examples. These work on a fresh checkout.
- Optional authorized inputs belong in `apps/frontend/data/imports/attendance.csv` and `students.csv`. Supply both. They are server-only and excluded from Git.
- Invalid, conflicting or incomplete local inputs fail visibly. No mood/privacy labels are inferred from CSV records.
- Student check-ins, support requests and staff task changes share a process-local server store. They survive page refresh/sign-out but reset on restart and do not synchronize across replicas.
- Academic intervention edits and fictional mentor check-in edits remain browser-memory demonstrations. Notifications are simulated.
- Public demo account entry is unsuitable for real private student data. Institutional identity and durable storage are required before real use.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

The frontend suite includes six UI/animation tests and nineteen domain, scoring, CSV and privacy tests. GitHub Actions runs these checks and the production build. A workflow file does not imply a hosted run has already passed.

## Vercel frontend settings

Choose Next.js and set Root Directory to `apps/frontend`. Use the frontend build script and default Next.js output handling. Include shared source files outside the app directory when configuring the monorepo. Set `API_BASE_URL` to a reachable hosted backend URL and configure the demo secret consistently for a fictional-data demonstration. Replace temporary state before relying on a serverless multi-user deployment.

## Collaboration

Frontend ownership includes `apps/frontend/` and its Next.js route handlers. Shared fixtures/contracts and root build configuration need joint review. Keep commits genuine and use Conventional Commits such as `feat(frontend): ...`, `fix(frontend): ...`, `docs: ...`, `refactor: ...`, `test: ...` or `chore: ...`. Never commit real environment files, imported student records, dependencies or build output.
