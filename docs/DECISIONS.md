# Decision log

## ADR-001 — One repository, two applications

Status: Accepted for this starter.

Decision: use npm workspaces for `apps/frontend` and a separate Python application at `apps/backend`.

Reason: two developers can own different runtime boundaries while reviewing one API contract and running unified PR checks. Separate repositories would require coordinating contract versions and two CI configurations.

Consequence: root configuration and shared files require joint review. No fabricated contribution history is created.

## ADR-002 — Next.js App Router + TypeScript + Tailwind

Status: Accepted.

Reason: preserves the existing interface, supports server-side session handling and lets the frontend call a same-origin API without exposing service credentials. TypeScript strict mode and tests make integration changes reviewable.

Consequence: Node.js 24 and npm are required. Next's webpack build mode is used consistently for this starter.

## ADR-003 — FastAPI + Pydantic

Status: Accepted.

Reason: typed Python routes, response validation, generated OpenAPI documentation and a straightforward integration point for future data/AI services.

Alternative: embedding all backend logic into Next.js. FastAPI keeps Python services independently owned by Developer 2.

Consequence: local development starts two services. Pin dependencies and test contracts together.

## ADR-004 — Shared JSON; no database yet

Status: Accepted for the read-only starter.

Reason: a single fictional seed supports reproducible local runs and tests without cloud setup. Do not pretend an unimplemented database exists.

Consequence: frontend edits are not persisted or shared. SQLite for a single-process prototype and PostgreSQL for a deployed multi-user service are future options, not accepted database choices. Choose one before adding durable intervention APIs, migrations and transactions.

## ADR-005 — Explicit demo authentication

Status: Accepted only for fictional-data demonstration.

Decision: demo account chooser, signed expiring cookies and server-to-server HMAC tokens. Identity-to-role mappings are server-controlled; mentor projection occurs in Python.

Consequence: the known development secret and public account chooser are not suitable for real students. Replace with institutional OIDC, managed secrets and persisted role assignments before real deployment. No compliance claim is made.

## ADR-006 — Live read API; local intervention loop

Status: Accepted and explicitly labeled.

Decision: connect student reads to the real API now, while retaining the reviewed UI's local proposal/outcome/notification demonstration.

Consequence: only reads survive reload by reloading the fixture. Risk is illustrative and no notifications are sent. The next backend milestone is authenticated, durable intervention mutations with server-side failed-action validation.

## ADR-007 — Integrate student support without changing academic scoring

Status: Accepted for the final hackathon edition.

Decision: retain the approved student quiz, CC rubric and CSV priority engine in Next.js, with server-side role/identity validation and process-local coordination state. FastAPI continues to own academic fixture reads and field projections.

Reason: this preserves the working cross-account demonstration and two-developer module boundary. Private quiz responses must not enter academic risk or staff task evidence. Privacy alone does not create a task.

Consequence: database-backed coordination and production authentication remain future work. Students may ask for help without sharing quiz data. Higher academic urgency wins; private requests receive a tie-break at the same priority.

## ADR-008 — Safe sample inputs in the final source archive

Status: Accepted.

Decision: track clearly synthetic CSV examples, accept authorized local import overrides outside public/, and omit uploaded records from the final ZIP and Git.

Reason: the source must run on a fresh checkout without publishing student data. Both local CSVs must be present, and conflicts must fail rather than silently switching datasets.

Consequence: sample counts differ from the optional uploaded dataset. The interface reports the active source names and actual reconciliation counts.
