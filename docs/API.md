# API

FastAPI base URL: http://127.0.0.1:8001. Generated schema: `shared/contracts/openapi.json`. Interactive docs: `/docs`. This OpenAPI file covers Python endpoints; the Next.js endpoint contracts below are documented separately.

## Python endpoints

| Method | Path                     | Authentication                    | Response                                                        |
| ------ | ------------------------ | --------------------------------- | --------------------------------------------------------------- |
| GET    | `/health`                | Public                            | 200 `{"status":"ok"}`                                           |
| GET    | `/students`              | Signed staff/mentor service token | 200 scoped Student array; 401 invalid identity                  |
| GET    | `/students/{student_id}` | Same                              | 200 scoped Student; 404 unknown/inaccessible; 401 invalid token |

Staff rows sort by risk. Mentor rows omit risk, attendance, grades, trends, missing assignments and staff interventions, and contain only assigned students. Roles come from the server's identity mapping. The student demo identity is not authorized by this API.

Student: id, name, initials, cohort, mentorId, mentorName, note, issue, newAlert, due, history, recommendation, rationale. Academic evidence fields are optional. Intervention: id, title, issue, status, source, date, owner, reviewDays. Status: Proposed / Active / Successful / Failed / Rejected.

## Next.js same-origin endpoints

All data routes require the signed demo cookie and derive identity/role on the server. Check-in/task responses are private/no-store. Student/task mutations check Origin and reject invalid data.

| Method | Path                    | Access                   | Behavior                                                                                                                   |
| ------ | ----------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/demo-session`     | Public demo              | Form identity=anika/sam/riya/studentdemo or action=signout; 303 to assigned workspace; 400 unknown account; 403 bad origin |
| GET    | `/api/students`         | Teacher, manager, mentor | Scoped Python data; 401 missing session, 403 student, 502 unavailable Python service                                       |
| GET    | `/api/student/check-in` | Student                  | Own quiz, calculated result and own requests                                                                               |
| POST   | `/api/student/check-in` | Student                  | Save validated consented own quiz                                                                                          |
| DELETE | `/api/student/check-in` | Student                  | Remove own quiz/score and summary sharing, preserving requested help                                                       |
| POST   | `/api/student/support`  | Student                  | Create/update own active private/general request                                                                           |
| DELETE | `/api/student/support`  | Student                  | Cancel own request                                                                                                         |
| GET    | `/api/tasks`            | Teacher, manager         | Prioritized CSV tasks and projected support requests                                                                       |
| PATCH  | `/api/tasks`            | Teacher, manager         | Update status/self-assignment; only manager may change owner role                                                          |

See `lib/portal-store.ts` and `lib/request-access.ts` for input validation. Student/task endpoints use 400 for invalid payloads and 403 for unauthorized operations. Task statuses are Open / In progress / Done; students may cancel their own support request.

Private request projections contain registered identity, contact timing, assignment/status and generic coordination instructions. They never contain quiz answers, CC Score or the private reason. A general request includes score and completeness only after explicit summary consent. Saving a private quiz alone creates no support request.

These endpoints record local coordination only; they never send notifications or execute interventions.
