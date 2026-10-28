# Frontend — Developer 1

Next.js App Router, React, strict TypeScript and Tailwind CSS. Own the interface, animation/accessibility behavior, session handling, same-origin proxy, CC Score and student/task coordination routes.

## Run

From the repository root, run `npm ci`, copy this module's `.env.example` to `.env.local`, configure your teammate's Python service as explained in `FRONTEND.md`, and run `npm run dev`. Open http://127.0.0.1:5177/demo. The Python implementation is owned separately and is not included in this frontend contribution.

Root commands: `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`, `npm run build`. After building, `npm start` serves the production preview.

## Modules

- `app/`: landing, demo entry, academic, mentor wellbeing, staff tasks and student workspace.
- `app/api/students/`: authenticated Python proxy, denied to student accounts.
- `app/api/student/`: identity-bound quiz/request APIs.
- `app/api/tasks/`: staff-only read/update API.
- `components/`: dashboards, API loader, quiz, task queue, chrome and motion.
- `lib/domain.ts`: roles, identities and failed-action guards.
- `lib/data.ts`: role projections of the same shared JSON fixture used by Python; retained for pure projection tests.
- `lib/cc-score.ts`, `lib/wellbeing-data.ts`: score method and scoped fictional mentoring examples.
- `lib/csv-priority.ts`, `lib/imports.ts`: CSV validation and transparent academic task rules.
- `lib/portal-store.ts`: process-local shared check-ins/support/task state.
- `tests/`: six Vitest UI/animation tests plus nineteen Node domain/privacy/scoring/CSV tests.

Staff academic reads use the real Python API with loading/error/empty states. Next.js validates every student/task request on the server; client-side hiding is supplementary. Keep imported CSVs under ignored `data/imports/`, outside `public/`. Synthetic CSVs are used when the local pair is absent. See the root docs for privacy and runtime limits.
