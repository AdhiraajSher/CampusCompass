# CC Score — Care & Context prototype v0.1

This method is included in the consolidated CampusCompass source. The final website runs on port 5177 and uses a separate demo cookie. The original project and team Git checkout remain unchanged.

## What is implemented

- A staff-only wellbeing workspace at `/wellbeing`, linked from the landing page, header and each academic student detail.
- Six positive, voluntary self-report statements covering sleep, food access, accessible movement, emotional wellbeing, peer belonging and manageable outside responsibilities.
- Mentor-assisted check-in editing, skip answers, consent, summary-sharing choice, local withdrawal, a transparent CC Score, coverage and check-in trends.
- Teachers and batch managers receive only consented score summaries. Raw answers, optional outside-pressure tags and unshared history are excluded before serialization. Mentors receive only their assigned students' wellbeing records.
- Human-reviewed support invitation drafts. No messages are sent.
- A downloadable public research snapshot with cited aggregate figures and an on-screen explanation of the rubric.

## Formula

Each answered rating is an integer from 1 to 5. Its normalized value is `(rating - 1) * 25`. CC Score is the equally weighted arithmetic mean of answered normalized values, rounded once to an integer. At least four of six areas and voluntary consent are required. Missing responses are excluded; they do not count as zero. Coverage is answered areas / 6.

Higher scores mean greater self-reported balance. This is a separate support-conversation signal, never an adjustment to the academic risk score or a measure of a student's worth. It must not determine grades, discipline, admissions or eligibility.

The questions, equal weights and minimum-four rule are unvalidated design choices made for this prototype. This is not a clinical assessment, diagnosis, trained prediction model or validated mental-health scale. Coverage does not represent confidence. Different response subsets and sparse histories should not be treated as directly comparable. High scores do not rule out support needs.

## Open sources and data provenance

`apps/frontend/public/data/open-context.json` is a manually transcribed snapshot of published aggregate estimates. Source year, population, URL and page are included for each value. It does not contain individual respondent records.

- CDC YRBS Dietary, Physical Activity and Sleep Report, 2013–2023: 2023 sleep (23%), breakfast (27%) and activity (25%) estimates. https://www.cdc.gov/yrbs/dstr/pdf/DSTR-Dietary-PhysicalActivity-SleepBehavior2013-2023-508.pdf
- CDC MMWR, 2023 mental health and protective factors: 28.5% reported poor mental health most/all of the time in the previous 30 days. https://www.cdc.gov/mmwr/volumes/73/su/su7304a9.htm
- CDC MMWR, 2021 connectedness: 61.5% reported feeling connected to people at school. https://www.cdc.gov/mmwr/volumes/72/su/su7201a2.htm
- Downloadable source datasets and documentation: https://www.cdc.gov/yrbs/data/index.html

These estimates describe U.S. high-school respondents, not the campus, Indian university students, or the fictional people in the demo. They inform topic selection only; they are not personal scores, clinical cutoffs, CC Score weights or training data. Newer releases exist; this prototype explicitly uses the cited 2021/2023 snapshots. External responsibilities are optional student-described context, not inferred from demographics or public data.

## Personal check-ins and privacy

All named student check-ins are fictional and labeled as such. Public survey respondents are never linked to students. In a real product, collection would require a voluntary, accessible check-in and appropriate consent—not scraping health data or inferring mood from attendance. Fictional mentor-assisted check-in edits stay in browser memory and reset on refresh. The separate student portal saves explicitly consented demo answers in a process-local server store; it survives refresh/sign-out and resets on server restart. Students can erase their saved check-in without cancelling requested help. Actual student quiz answers are never projected to staff or mentors. Withdrawal in the fictional mentor editor affects its browser session only, not its fixture.

Production authentication, durable storage, consent auditing, data retention/deletion, clinical review, age/culture validation and notification delivery are not implemented. No compliance claim is made. The original demo identity chooser is unsuitable for real student data.

## Run and verify

Follow the root README: `npm ci`, start the Python service and run `npm run dev`. Open http://127.0.0.1:5177/demo. Riya Sen edits fictional mentoring examples; Demo student uses the separate voluntary quiz. Staff can see consented mentoring summaries, while private student requests withhold quiz answers and score.

`npm run typecheck`, `npm test`, and `npm run build` verify types, scoring/permission behavior and the production build.
