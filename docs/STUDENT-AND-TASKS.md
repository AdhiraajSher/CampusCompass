# Student workspace and staff task queue

This module is part of the final integrated monorepo on port 5177. Original project copies and the user's Git checkout remain unchanged.

## New workspaces

- `/student`: student-only inverse-color workspace. A six-question check-in previews a CC Score, permits skipped answers, and saves only after consent. Summary sharing is off by default. Raw answers are never provided to staff.
- `/tasks`: teacher/batch-manager-only task queue. It joins the supplied attendance and student-detail CSVs, preserves intervention continuation rows, and provides task ownership and Open / In progress / Done states.
- Existing `/workspace` and `/wellbeing` pages remain staff-only. A student attempting to visit them is redirected. Mentor access to `/tasks` is denied.

Sign in through `/demo`. The new account is **Demo student**, ID `DEMO-001`, intentionally separate from the uploaded CSV students. No privacy preferences or wellbeing answers are fabricated for imported people. Teachers and batch managers now enter the task queue; mentors enter their wellbeing workspace.

## CSV sources

Optional authorized local files are read on the server, relative to `apps/frontend/`:

- `data/imports/attendance.csv`: Student Attendance Data.csv.
- `data/imports/students.csv`: student (1).csv.

The original uploaded files reconcile to 20 student IDs; the final source download uses a smaller, clearly synthetic sample by default. The live queue reports its actual input counts. Continuation rows with blank student IDs attach only to the preceding student. BOM, CRLF, quoted fields and escaped quotes are supported. Duplicate IDs, orphan continuations, conflicting names/attendance and invalid values fail visibly. Missing grades remain missing.

These CSVs contain no privacy preferences, mood data, assignment counts or attendance reporting period. None are invented. Names and records from these sources are never joined to the fictional CC examples by row position or similar names.

The import folder is outside `public/` and excluded from Git and the final ZIP. Without both local files, the queue uses `shared/fixtures/attendance.sample.csv` and `students.sample.csv`. If only one local file exists, or inputs are invalid, it fails visibly. CI/unit tests use synthetic records. Do not publish student records; the user-supplied originals remain unchanged.

## Priority method

The queue uses transparent prototype coordination rules, not ML or a clinical model:

- P1: attendance below 75%, five or more consecutive absences, or mean grade below 60%.
- P2: attendance below 85%, three or more absences, any subject below 65%, or an intervention proposal awaiting review.
- P3: a scheduled follow-up for an active intervention without the above signals.
- Active follow-up dates use the source intervention date plus 14 days. The current queue date is shown in the interface; the attendance/grade measurement period is explicitly unknown.
- Failed intervention names are excluded from new suggestions. The CSV lacks issue codes, so exclusions are conservative for the student rather than an asserted match to a specific issue.
- Existing active support is reviewed before adding another action. Staff review and act; updating a task never automatically sends a message or executes an intervention.

## Student quiz and private support

The student quiz uses the same CC Score v0.1 rubric described in `CC-SCORE-METHOD.md`: six positive 1–5 statements, normalized to 0–100, equal weighting over answered areas, at least four answers, explicit saving consent. Public CDC figures inform topics only; the score is unvalidated and is not trained on public data or a diagnosis.

Students can ask for help without taking or sharing the quiz. For private requests, staff receive the account name, request time, chosen contact timing, status and assignment. They receive no private topic, quiz answers, CC Score or mood details. A general request may show score and coverage only when the student explicitly enabled summary sharing; raw answers remain private.

“Contact me soon” is P1. Routine requests are P2. Within the same priority, private requests sort first, then review date and student ID. A dedicated private lane makes these requests easy to find. Higher-priority academic cases retain their urgency. Choosing privacy or declining a quiz does not create an academic risk label or change academic priority; no unsolicited request is created just because a quiz is private.

Staff assignment and request status synchronize to the student's account. A student can cancel their own request, refresh status, and delete their saved quiz. Deleting the quiz withdraws score sharing but leaves requested help active until cancelled separately.

## API and state boundaries

All routes validate the signed demo session and derive student identity/role on the server. Mutations check Origin. Responses are private/no-store.

| Endpoint                       | Allowed roles    | Behavior                                                            |
| ------------------------------ | ---------------- | ------------------------------------------------------------------- |
| GET `/api/student/check-in`    | Student          | Own quiz, own score and own requests                                |
| POST `/api/student/check-in`   | Student          | Validate and save own quiz                                          |
| DELETE `/api/student/check-in` | Student          | Delete own quiz and score                                           |
| POST `/api/student/support`    | Student          | Create/update own active support request                            |
| DELETE `/api/student/support`  | Student          | Cancel own request                                                  |
| GET `/api/tasks`               | Teacher, manager | Projected support requests and CSV tasks                            |
| PATCH `/api/tasks`             | Teacher, manager | Task status and self-assignment; owner-role changes require manager |

Student check-ins, support requests and task changes are stored in a process-local server Map. They survive page refresh and role sign-out, allowing a cross-account demo, but reset when the server restarts. They are not durable, do not synchronize across multiple server processes and do not send email. Existing fictional mentor edits retain their earlier browser-session behavior.

The account chooser is intentionally public demo access, not production authentication. Use fictional quiz responses. Institutional login, a durable database, consent audit trails, rate limits and production operational review remain future work.

## Run and demonstrate

1. Follow the root README to install npm/Python dependencies and start both services. Open http://127.0.0.1:5177/demo.
2. Choose Demo student. Answer or skip quiz questions, review, and save privately if desired.
3. Choose a private conversation and “Contact me soon,” then submit a support request.
4. Sign out and choose Anika Rao or Sam Thomas. The private request appears in the queue, without its score or answers.
5. Assign it and set In progress. Sign back in as the student and refresh request status.

Checks from the repository root: `npm run typecheck`, `npm test`, `npm run build`.
