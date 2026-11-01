# Fee Follow-Up Board: Implementation Plan

**DRAFT**

This plan follows `PRD.md` and the revised `TECH-STACK.md`: the user selected Next.js and Vercel, and supplied an existing Supabase project. It keeps that single hosted project. The implementation is a public demo only; anonymous database access must be limited to rows explicitly marked synthetic.

**Estimate:** 685 minutes of agent implementation and verification time (11 hours 25 minutes), revised to include the requested student-add form. This excludes client decision time, account/SMTP setup, waiting on data, and any custom integration required by the yet-to-be-confirmed source of student balances. Each step includes its own test time. A step is not complete until its verification passes and its screen has been opened at 375 px wide.

## Numbered steps

### 1. Record unresolved decisions and build the phone-first Next.js prototype — 75 minutes

**Build:** Review the PRD's open questions and record any answers supplied for institution boundary, user types/access, authoritative source, currency/balance rules, partial payments/corrections, promised-date meaning, required outcome fields, stage names/transitions, and acceptance targets. Unanswered decisions remain explicitly open. Inspect for the existing palette, logo, and images; if the kit is absent, record that and choose one consistent, high-contrast direction for the tool. Build a phone-first Next.js board prototype with clearly marked synthetic data and preview-only payment/promise actions. Do not create the production data schema yet.

**What can be opened:** A working Next.js prototype of the one-page board at a local address, including student rows, balance, promised date, stage, and preview-only outcome dialogs. A visible note says that preview actions are not saved and the values/stages are demo assumptions.

**Verification before marking complete:** Open and inspect screenshots at 375 px and 1440 px. At 375 px verify one-column layout, no horizontal scrolling, and tap targets at least 44 px high. Calculate each text/background contrast ratio and record passing pairs in `WORKLOG.md`. Exercise both preview actions, check the displayed preview state, refresh, and confirm the unsaved preview resets. Record each unresolved answer as a blocker rather than inventing it. Do not start Step 2 until the tenant boundary, user/access policy, balance rules, and stage rules are approved in writing.

### 2. Build the main board and distinct connection states — 120 minutes

**Build:** Implement the single main screen using a clearly labeled local demo fixture. Add loading, missing-setting, Supabase-error, empty-table, and populated-board states. Name a missing environment variable in the missing-setting state. Keep this slice independent of Supabase schema creation so it can be built and tested before the migration.

**What can be opened:** The phone-sized board displays realistic synthetic student rows; the other states are visible through a development-only state selector or component preview, never by pointing at a fake Supabase address.

**Verification before marking complete:** Render and assert distinct text for a missing setting (including its exact name), a mocked Supabase failure, and a successful empty result. Render the populated local fixture as a fourth state. Run these tests without a fake URL or a second app server. Inspect the board at 375 px; verify one-column layout, no horizontal scrolling, and 44 px minimum buttons.

### 3. Implement student creation and demo outcome interactions — 150 minutes

**Build:** Add a small “Add student” form using the current row fields: name, grade, amount owed, and optional promised date. Implement the two row actions against a test double/local demo state. A promise updates the displayed promised date and demo stage without changing the balance. A payment reduces the demo balance and total and selects a demo stage; a fully paid row leaves the pending list. Label the stage names, currency, and transition behavior as synthetic demo assumptions, not approved business rules.

**What can be opened:** The board on a phone shows synthetic students, amount owed, promised date, stage, pending total, an add-student form, and working promise/payment dialogs.

**Verification before marking complete:** Test adding a valid demo student, missing name/grade/amount, zero/negative amounts, excessive decimal places, optional promised date, and duplicate submission. Test valid and missing payment/promise values, double submission, full and partial payment, promise-only behavior, and reload of local state. Invalid input must show a clear reason and write nothing. Open at 375 px and 1440 px. This is a demo behavior check only; it does not approve production balance or stage rules.

### 4. Connect the app to the supplied Supabase settings — 100 minutes

**Build:** Install `@supabase/supabase-js`; create the browser client from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Implement read, student-create, and outcome-write adapters targeting the planned demo tables and RPC. Do not use a service-role key or change the URL to simulate failures. Until the schema migration is applied, the real request is expected to render the distinct Supabase failure state.

**What can be opened:** The same Next.js board opens on a phone using the actual supplied project settings; before schema creation, it clearly reports the real missing-table response rather than showing a blank page.

**Verification before marking complete:** Verify the client uses only the supplied real URL/key and that the browser bundle includes no service-role key. Test missing config in a unit/component test and test remote failures with a mocked Supabase client; do not start a second server or use a fake project address. Confirm the actual missing-table response is distinct. Inspect at 375 px.

### 5. Apply the demo schema, policies, seed, and persistence — 150 minutes

**Build:** After the Next.js app builds and the UI/action tests pass, apply a migration to the existing project using the Supabase MCP migration tool. Create the demo student/balance and outcome-event tables with `id`, `created_at default now()`, `is_demo default false`, RLS, separate select/insert/update/delete policies, and the requested `anon, authenticated` grants. Every public policy must be restricted to `is_demo = true`; event policies must also require a demo parent row. Add a validated create-student RPC that always inserts synthetic demo rows, plus a transactional RPC that logs a demo payment/promise and updates the demo balance/stage. Seed realistic but fictional student rows. Keep production business rules unapproved and demo-labeled.

**What can be opened:** The app reads real seeded rows from the supplied Supabase project; adding a synthetic demo student, logging a payment, and logging a promise all persist after refresh and update the total/stage on the phone screen.

**Verification before marking complete:** Inspect the resulting tables/policies, then call `execute_sql` to confirm demo rows exist. Test an anonymous select/insert/update/delete against demo rows and confirm all four succeed; test that attempts against `is_demo = false` rows fail or affect zero rows. Add a student through the phone form and reload to verify it persists. Test blank name/grade, zero/negative amounts, and amounts with more than two decimal places; each must show a clear reason and save nothing. Test a payment and promise, reload, and verify the event, balance, stage, and SQL-computed total persist. Test transaction rollback. No real student records may be added. Inspect at 375 px.

### 6. Final local hardening and phone verification — 90 minutes

**Build:** Complete accessible loading/empty/error states, final mobile styling, and local production-build checks. Keep the single Supabase project. Do not deploy to Vercel in this request; a commercial launch requires a Vercel Pro plan and staff authentication/institution-scoped RLS before any real student records are loaded.

**What can be opened:** The one local Next.js dev server at its local link shows the real Supabase demo rows and both persistent outcome actions on a phone.

**Verification before marking complete:** Run the final production build and component/database tests. Stop all earlier dev servers, delete `.next`, start exactly one dev server with the real `.env.local`, open the local page, and confirm the demo rows load. Re-test the three failure states without using a fake Supabase URL or another server. Confirm no secret/service-role key is in the browser build. Note that commercial Vercel deployment and production authorization remain future work.

## Exit criteria for the whole phase

- [ ] The demo uses only synthetic records, visibly labeled, and never treats its temporary stage/currency/payment rules as client-approved policy.
- [ ] The demo tables have RLS, explicit select/insert/update/delete policies, and table grants. Anonymous CRUD is limited to `is_demo = true` records and demo-linked outcomes; real records are not available to the demo policy.
- [ ] Each payment and promise action is saved exactly according to the approved rules; invalid required data is rejected with a reason and saves nothing.
- [ ] A valid demo student can be added and remains after refresh; invalid required fields or amounts are rejected with a reason and save nothing.
- [ ] Payment and promise outcomes persist across refresh; payments update demo balance/total/stage and promises update demo date/stage without reducing the balance.
- [ ] Missing-setting, Supabase-failure, empty-table, and populated states are visibly distinct and tested without a fake URL or second server.
- [ ] The local screen has been opened and inspected at 375 px and 1440 px. At 375 px there is no horizontal scrolling, the layout is one column, and buttons are at least 44 px high.
- [ ] The browser build contains only the supplied publishable key and URL, never a service-role key. Supabase migration and row-count check succeeded.
- [ ] `WORKLOG.md` records each completed slice with the command and actual output; `REPORT.md` records final status, evidence, and any unverified item.

## Decisions most expensive to reverse

Make these decisions in Step 1, before Step 2 creates tables or policies:

- **One institution or multiple institutions:** determines the institution key and every row-level access rule. The implementation plan follows `TECH-STACK.md` and includes an institution identifier from the beginning, even if the first approved institution is the only one in the MVP.
- **Who can see and change student fee records:** determines authentication, membership records, and access policies. No payer/public access is added without explicit approval.
- **Authoritative balance source, currency, partial payments, adjustments, and payment corrections:** determines the financial record model and total calculation. Do not encode guessed arithmetic in the schema or payment function.
- **Stage list and transitions:** determines whether stages are stored, derived, or rule-driven. Keep the rules in the database boundary, not duplicated in the screen.
- **Meaning and requiredness of the promised date and each outcome field:** determines form validation and saved event shape.
- **Peak concurrency and availability/backup expectations:** confirms whether 100 means accounts or simultaneous sessions and whether the single Free Supabase project is acceptable for the MVP. This affects final launch configuration, not the institution model.

If any of the first five decisions remains open, continue only with synthetic demo data and temporary demo rules. Do not create production policies or load real student records until the decisions are approved.

## What to drop if time runs short tonight

- Drop visual polish beyond a coherent, branded, readable first pass; do not drop the 375 px open-and-inspect check.
- Drop live cross-user updates, charts, exports, reminders, and any feature already outside the locked PRD scope.
- Defer automation of student/balance import only if the client confirms a safe, complete alternative for loading the agreed records. If no safe source-loading path exists, do not claim the board is complete.
- Do not drop sign-in, row-level security, transactional payment recording, input rejection, balance/stage verification, or per-step tests. If the two outcome paths or their security tests are unfinished, stop at the last verified phone-openable milestone and label the MVP incomplete.

## Open dependencies

- The client/process owner must answer the Step 1 decisions and approve or replace the PRD's provisional success targets.
- The owner of student and fee records must supply the authoritative source definition and a representative, permitted test fixture; any required source integration needs a separate estimate.
- The account owner must provide access to the single Supabase project and, only if deployment is requested, Vercel and an approved SMTP provider. Do not place secrets in the client build or repository.
- A client representative must be available for the phone prototype review, the staff usability check, and approval to use any non-synthetic student data.
