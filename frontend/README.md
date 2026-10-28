# Frontend — Developer 1

Next.js App Router, React, TypeScript strict mode, Tailwind CSS and Lucide icons. Contains the landing page, demo staff entry and teacher/batch-manager/mentor experiences. The original visual direction, fonts and motion are preserved.

## Run

From the repository root:

```sh
npm ci
cp apps/frontend/.env.example apps/frontend/.env.local
npm run dev
```

Start the FastAPI service using the root README. Open http://127.0.0.1:5174.

Checks from the root: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run format:check`.

## Modules

- `app/`: landing, demo sign-in, workspace and same-origin API routes.
- `components/student-loader.tsx`: fetch lifecycle with loading/error/empty states.
- `components/dashboard.tsx`: evidence, notes, proposals, outcomes and notification demonstration.
- `components/effects.tsx`: reduced-motion-aware particles and stable-width text scramble.
- `lib/api.ts`: typed browser API client.
- `lib/session.ts`: signed demo session adapter; replace for institutional login.
- `lib/domain.ts`: shared frontend types and local adaptive guards.
- `tests/`: rendered UI integration tests using the shared fixture.

`API_BASE_URL` and `DEMO_SESSION_SECRET` are server variables; do not prefix them with `NEXT_PUBLIC_`. No Python fixture data is imported into the production browser bundle.

Intervention edits and notifications are local simulations, not backend mutations. Coordinate API changes with Developer 2 using `shared/contracts/openapi.json`.
