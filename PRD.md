# Fee Follow-Up Board

**DRAFT**

**Read these first:** the idea leaves key product decisions open. Review the questions below before treating this draft's audience, targets, or first-release boundaries as approved.

## Open questions

- Who will use the board: one fee-follow-up staff member, several staff, a manager, or another group? Decide the intended users and whether access differs between them.
- Which institution or institutions does it cover: one school or tuition centre, several branches, or multiple independent institutions? Decide the operating boundary.
- What counts as a pending fee, and how is the amount owed determined when a student has multiple fees, partial payments, adjustments, or credits? Decide the balance rules.
- What are the stages, what does each mean, and which events move a student between them? Decide the stage names and transition rules.
- Does a promised date mean the date a payer expects to pay, the date staff will follow up, or either? Decide its meaning and whether it is required.
- What information must be recorded for a payment or new promise, and can one payment cover only part of the balance? Decide the minimum details and partial-payment behavior.
- Who enters the initial student and balance information, and what existing source is authoritative? Decide the source and who is accountable for keeping it current.
- Which details are required when adding a student with pending fees? The demo form uses the row's current fields; confirm the real intake requirements before production.
- Is the board for staff only, or should students or their fee payers use it too? Decide who may see or change records.
- What initial adoption and outcome targets are acceptable? The numeric targets in Success metrics are provisional assumptions, not client-approved commitments.

## 1. What was said, and what it means for the build

| Words from the idea | What they imply for the product |
| --- | --- |
| “Fee follow-up board” | A working view for tracking unpaid fees and follow-up outcomes, rather than a general student information product. “Board” does not establish who uses it, where it applies, or which stages it contains; those remain open questions. |
| “A single page” | The core task is available in one page, without requiring users to move through a multi-page process to review a student and log an outcome. It does not settle whether sign-in or access controls exist. |
| “lists every student with pending fees” | The board represents all students who meet the agreed definition of pending fees within the agreed institution or institutions. Completeness depends on an agreed source and current records. **[A1]** |
| “the amount owed” | Each listed student has an understandable outstanding balance. The idea does not define how multiple fees, partial payments, credits, or adjustments affect that balance. |
| “Each row shows the promised date” | The student’s row displays a date associated with a payment promise. The client must clarify whether it is a payer’s expected payment date, a staff follow-up date, or both. |
| “a button to log a payment or a new promise” | Staff can record either of these two follow-up outcomes from the student’s row. The idea does not define the required details, whether partial payments are allowed, or what happens to a prior promise. **[A2]** |
| “Add a student” | The user has added a request for a small form to create a student fee-follow-up record. The minimum fields and production access rules are not established by that request. **[A12]** |
| “Logging an outcome updates the total pending” | After an outcome is recorded, the displayed overall amount pending reflects the resulting balances, using the balance rules the client chooses. |
| “and moves the student to the right stage” | Recording an outcome can change the student’s follow-up stage. The stage set, transition rules, and meaning of “right” require client decisions. |

## 2. Check these first

The decision list at the top contains the unresolved gaps in the idea. In particular, decide the users and institution boundary; pending-fee and balance rules; stage names and transitions; promised-date meaning; outcome details and partial-payment behavior; initial data source and ownership; who may access records; and acceptable success targets. None is silently decided in this draft.

## 3. Who this is for

- **Primary, working audience [A1]:** fee-follow-up staff who need to see which students have unpaid fees, the amount pending, and the next promised date, then record a payment or a new promise without losing the follow-up context.
- **Secondary, unconfirmed audience [A3]:** a fee lead or institution manager who needs to understand the overall pending amount and where each student sits in the follow-up process.
- **Not established as users:** students and their parents, guardians, or other payers. The idea does not say that they open the board or enter information; their access is a decision for the client.

## 4. Scope, locked

For the first release, the product is limited to the following idea-backed capabilities:

- One page listing students with pending fees within a client-confirmed scope.
- A pending amount and promised date shown for each listed student.
- A way to log a payment or a new promise for a listed student.
- An updated overall pending total after an outcome is logged.
- A student’s follow-up stage updated after an outcome is logged, according to client-approved stages and rules.
- A small form to add a synthetic demo student using the current row fields: name, grade, amount owed, and optional promised date. **[A12]**

This scope does not decide balance calculations, stage definitions, user permissions, or data ownership; those are required client decisions, not implied product behavior. **[A4]**

## 5. Not building, and why

- **Fee invoicing, fee collection, or payment processing:** the idea asks to log a payment, not to request or receive one. **[A5]**
- **A complete student-information system:** the stated job is fee follow-up, not maintaining every kind of student record.
- **A general-purpose finance or accounting product:** the idea only specifies pending-fee visibility and follow-up outcomes.
- **Automatic reminders or outreach:** no automatic contact is requested; the promised date and outcome logging do not imply sending messages.
- **Student or payer self-service:** the idea describes a staff-oriented follow-up board, but does not request a portal or direct access for payers. This remains a decision, not an approved exclusion from future consideration. **[A6]**
- **Multiple institutions, branches, or user permission levels:** no organizational boundary or access model is specified. These are not part of the locked first release until the client defines them. **[A7]**
- **Unspecified reports, forecasts, dashboards, or payment plans:** none is required to perform the stated task.

## 6. Phasing

- **First:** confirm the open decisions, then deliver the locked single-page list and the two stated outcome paths, with the pending total and stage reflecting the agreed rules. The idea supports this as the first release; it does not establish a delivery date. **[A8]**
- **Later, only if requested and agreed:** consider any capability not listed in the locked scope, such as payer access, automatic reminders, broader reporting, or multiple institution support. No later feature is committed by this draft.

## 7. Success metrics

These are proposed initial targets, not facts or promises from the idea. **[A9]** The client must approve or replace them before they become acceptance criteria.

- **Coverage:** at least 98% of students confirmed by the client’s chosen source as having pending fees appear on the board during a representative review.
- **Balance agreement:** at least 98% of reviewed student balances match the client-approved balance rules and source records.
- **Outcome recording:** at least 90% of payment or new-promise outcomes known to staff are logged on the day staff learn of them during a representative review period.
- **Stage agreement:** at least 95% of reviewed student stages match the client-approved transition rules after an outcome is recorded.
- **Usability:** at least 90% of representative staff users can locate a student and log either outcome without help in a short, client-approved task check.

## 8. Open dependencies

- **Client or fee-process owner:** answer the questions at the top, approve the first-release audience and boundary, and define pending balances, stages, date meaning, and outcome details.
- **Owner of student and fee records:** identify the authoritative source for students, pending balances, and existing promises, and confirm who is responsible for its accuracy. **[A10]**
- **Client decision-maker:** approve or replace each proposed success target and provide a representative set of records against which coverage and balance agreement can be judged. **[A11]**

## Assumptions

Every item below is a working assumption, not a client-confirmed fact. No assumption resolves an open question; confirm or reject each before using it to lock acceptance criteria.

- **[A1]** The initial audience is staff who follow up on unpaid fees, and the board covers a client-defined set of student records.
- **[A2]** Logging a payment or a promise is an explicit staff action for one student; what information the action needs and how partial payment is handled are still undecided.
- **[A3]** A fee lead or institution manager may benefit from viewing the board, but that person is not confirmed as a user.
- **[A4]** The first release is limited to the functions explicitly present in the one-line idea; the client will decide the rules required to make them unambiguous.
- **[A5]** “Log a payment” means record that a payment occurred, not collect money or initiate a transaction.
- **[A6]** Students and payers are not first-release users unless the client decides otherwise.
- **[A7]** Multi-institution support and differentiated permissions are not implied by the idea and are excluded from the first-release commitment pending a decision.
- **[A8]** The listed core functions are the first release; no schedule or later feature commitment is inferred.
- **[A9]** The numerical success targets are provisional starting points selected for this draft because no client targets or baselines were provided.
- **[A10]** Student and fee information exists in a source that a client-side owner can identify; neither the source nor its readiness is confirmed.
- **[A11]** A client decision-maker can approve targets and make representative records available for evaluation; availability and permission are unconfirmed.
- **[A12]** For this demo, student creation reuses the visible row fields: name, grade, amount owed, and optional promised date. Currency, initial stages, and production-required fields remain client decisions.
- **[A13]** Demo-only defaults use INR and a positive amount with at most two decimal places; an optional promise date sets the demo stage to “Promise made,” otherwise it starts at “Needs follow-up.” A logged payment cannot exceed the demo balance; full payment sets “Paid” and removes the row from the pending list.
- **[A14]** Because the board is publicly accessible for demonstration, the add form creates synthetic demo records only. It is not a way to add real student data.
