# Shared frontend data and service contract

`fixtures/students.json` contains fictional academic records. Frontend integration tests use this JSON, and `lib/data.ts` retains its role projections for pure unit tests. The Python API is expected to return compatible, server-scoped records.

`fixtures/attendance.sample.csv` and `students.sample.csv` are clearly synthetic defaults for the staff task queue. Do not replace them with private student inputs. Optional authorized files belong under ignored `apps/frontend/data/imports/`.

`contracts/openapi.json` records the expected FastAPI health/student API contract from the integrated prototype. Coordinate changes with the backend owner. This frontend branch does not include the Python API implementation or imply that broader AI endpoints are already connected.

Public aggregate research context lives in `apps/frontend/public/data/open-context.json`. It informs quiz topics only. Imported CSV identities, fictional academic profiles and student-submitted check-ins remain separate datasets.
