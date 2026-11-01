# Fee Follow-Up Board: Tech Stack

**DRAFT**

**Decision (revised 2026-10-30 at the user's direction):** Next.js App Router, developed locally and deployable to Vercel without changing frameworks; use the existing single Supabase project for Postgres and database functions. The demo app is anonymous, but row-level security permits anonymous CRUD only on rows explicitly marked synthetic demo data. Never put real student fee records in that public demo table. Real production records require staff authentication and institution-scoped policies first.

This is a stack proposal, not confirmation of unresolved product rules in `PRD.md`. It assumes 100 registered accounts, no more than 100 concurrent users, and no external payment collection or automatic outreach. Treating all 100 as staff is provisional; the PRD's user types, institution boundary, role differences, balance rules, stage transitions, and source of fee data still need client decisions.

## Choices by layer

### Database and data access

- **Use:** Supabase Postgres in exactly one hosted project. Use relational records for institutions, memberships, students, fee balances or charges, payment outcomes, promises, and stages. Use exact decimal money values, not binary floating-point numbers. Add an institution identifier to business records from the start, even if the confirmed MVP has only one institution.
- **Constraint:** The board relates students to balances and follow-up outcomes; a payment must change the balance and stage consistently. The PRD leaves both the fee source and single-versus-multiple-institution boundary open. Postgres transactions and foreign keys fit those relationships, while the institution identifier avoids a later data-isolation retrofit. One institution identifier in the MVP does not require a multi-institution user interface.
- **Rejected:** A document store or spreadsheet as the primary source of truth. They do not provide as direct a fit for related payment records, concurrent updates, and atomic balance/stage changes. A separate database vendor is also rejected because Supabase already supplies the selected database and auth, and a second project/vendor adds cost without a stated need.

### Authentication and access control

- **Use for this demo:** No sign-in is required to see or change the synthetic demo. Enable row-level security on both demo tables, and grant `anon` and `authenticated` only the CRUD permissions covered by policies requiring `is_demo = true`. Keep `is_demo` false by default. The outcome table's policies also require its parent row to be demo data. Student creation uses a caller-permission database function that inserts only `is_demo = true` rows.
- **Constraint:** The user requests an immediately usable demo without supplying test accounts. Open policies over real student balances would expose sensitive financial data. The `is_demo` boundary permits an anonymous demo while denying access to future real rows.
- **Production requirement:** Before importing real records, add Supabase Auth for invited staff and policies based on approved institution membership, then prove that unauthorized reads and writes fail. The anonymous demo policy is not a production access policy.
- **Rejected:** Anonymous CRUD over every row, custom authentication, or a second identity vendor. Anonymous unrestricted access would expose and permit modification/deletion of student financial records; a custom or second auth system adds cost and security work without a PRD need.
- **Email limit for production Auth:** Supabase's built-in Auth email sender is limited to **2 emails per hour**. If production invitations exceed that rate, configure custom SMTP, available on Free, before onboarding.

### Frontend

- **Use:** Next.js App Router, with the Supabase JavaScript client doing browser-side reads and writes through the publishable key. Keep the board, demo outcomes, total, and stage display on the single main screen.
- **Constraint:** The user explicitly selected Next.js to preserve a direct Vercel deployment path. The PRD's single interactive page does not need a separate mobile app or a server-side secret.
- **Rejected:** Reverting to React/Vite or adding a separate mobile client. Both contradict the requested Next.js/Vercel path or multiply the clients without a feature requirement.

### Hosting

- **Use:** Next.js local development now; deploy this same Next.js project to Vercel when authorized. Keep the Supabase publishable key as the only Supabase key in the browser. No Vercel deployment is part of this local build.
- **Constraint:** The user named Vercel as the future host and requires no framework rewrite. The data remains in the existing Supabase project.
- **Rejected:** Cloudflare Pages and a separately operated application host because the user explicitly selected Vercel for the future deployment path.
- **Commercial-plan constraint:** Vercel Hobby is restricted to non-commercial personal use. Before deploying a business fee-follow-up app commercially, use Vercel Pro; current listed price is **$20/month per developer seat**, with $20 of usage credit. The Hobby quota is not a valid production substitute for this commercial restriction.

### Server-side operations

- **Use:** Postgres database functions called through Supabase RPC for student creation and outcome writes. The create function validates required fields and inserts only synthetic demo students. A payment function records the outcome and updates the balance/stage in one transaction; a promise function records the outcome and updates the stage. All functions run with caller permissions and enforce the demo boundary. Calculate the demo pending total in Postgres, not as an independently editable browser value. Transition labels and amounts are demo-only assumptions until approved for production.
- **Constraint:** The PRD requires one logged outcome to update both the total and stage. A database transaction keeps those changes together. The PRD does not define stage names or partial-payment policy; sample behavior must remain clearly labeled as demonstration logic. A promise alone does not count as money received.
- **Rejected:** Supabase Edge Functions, Cloudflare Pages Functions, a Node server, a task queue, and a cache for the first release. The stated work is database-bound and needs transactional writes, not third-party API calls, scheduled jobs, or slow background work. Introducing an extra runtime would add cost and another place to secure without satisfying a current PRD feature.
- **Live collaboration:** Do not add Realtime subscriptions initially. The PRD asks for updates after the current user's action, not live updates in every other open session. Refresh the relevant rows and total after a successful write; add subscriptions only if simultaneous live visibility becomes a confirmed requirement.

### Fee records and money correctness

- **Use:** Keep current demo student/balance rows separate from payment/promise event rows. Store synthetic rows with `is_demo = true`; default all inserted rows to false and seed only explicitly synthetic records as true. Calculate the displayed total in Postgres. This demo's currency and transition labels are placeholders, not agreed client rules.
- **Constraint:** The amount must remain explainable after payments, and multiple users can log outcomes concurrently. A transaction-backed record and database arithmetic avoid browser rounding and stale totals. The source of opening balances, currency, adjustments, and partial-payment rules are unresolved in the PRD, so those must be confirmed before locking the detailed schema.
- **Rejected:** Calculating or storing a mutable grand total only in the browser. It would be stale across users and can disagree with the underlying records. A payment gateway is out of scope because the PRD only asks staff to log a payment that already happened.

## MVP and production

| Layer | MVP | Production for 100 users | Type of change |
| --- | --- | --- | --- |
| Frontend | Next.js App Router, local dev | Same Next.js project deployed to Vercel | No framework rewrite |
| Hosting | Local Next.js dev server | Vercel Pro for commercial production; Hobby only for non-commercial personal use | Deployment/config and plan switch; same app |
| Supabase project | Existing single Supabase project, using the supplied URL/key | Same project; upgrade that project only if availability, backup, or quota needs require it | Config/plan switch; no second project |
| Database | Demo rows and outcome events, RLS enabled, public CRUD restricted to `is_demo = true`, validated student-create function | Add staff Auth and institution-scoped policies before real records; do not weaken demo boundary | Additive migration/policy change; no database-vendor rewrite |
| Authentication | No sign-in for synthetic demo rows | Supabase Auth for invited staff before real student data is loaded | Add Auth and policies; not a public access switch |
| Payment/promise processing | Transactional Postgres RPC, demo-only stage and amount rules | Same transaction pattern, rewritten only if approved balance/stage rules require different logic | Policy/logic migration may be required; do not infer production rules |
| Notifications and integrations | None | None unless a future approved requirement adds them | New feature would add a service/function; not part of this stack |

The Pro plan is currently listed from **$25/month** and includes a $10 compute credit that covers one Micro compute instance. Confirm the account's displayed price and tax before upgrading. Pro includes daily backups retained for seven days; Free does not include automatic backups. Pro does not include an uptime SLA.

## Free-tier exit triggers

Do **not** upgrade just because the app has 100 users. Supabase Free currently includes 50,000 monthly active users and unlimited API requests. Upgrade the one existing project when any of these is true:

- The live product cannot tolerate a project pausing after **one week without activity**. This is the earliest production trigger if the board must remain available during school breaks or any quiet week.
- Database size reaches the Free limit of **500 MB**. The PRD does not say how many student or outcome records there will be, so monitor actual growth rather than infer it from the account count.
- Egress exceeds **5 GB** or cached egress exceeds **5 GB** in a billing month.
- Monthly active users exceed **50,000**. That is far beyond the stated 100-user target.
- The project needs automatic backups. Free has none; Pro supplies seven days of daily backups.
- Email invitations need to exceed **2 per hour** using Supabase's built-in sender. This does not itself require Pro: configure custom SMTP, available on Free, and account for that provider's own price/limits.

Vercel Hobby currently includes up to **1,000,000 Function invocations/month** and **4 hours of active CPU**, but its non-commercial restriction means a business production deployment must use Pro regardless of whether 100 users reach those quotas. Pro currently starts at $20 per developer seat/month with $20 usage credit; confirm price and metered usage before deployment. Supabase Free currently includes **500,000 Edge Function invocations/month**; the app does not use Edge Functions.

## One-project operating constraint

There will be one hosted Supabase project, shared by MVP and production. Supabase Free permits two active projects, but this design deliberately does not consume a second one. Preview builds use the same project and must contain synthetic records only. Anonymous CRUD policies are restricted to `is_demo = true`; do not put real student data in the demo tables. Before any real data is loaded, add Supabase Auth and institution-scoped policies, then verify them with denied-access tests. Keep schema changes as reviewed SQL migrations and upgrade the existing project rather than creating another hosted project.

The anonymous demo tables may contain synthetic records only. Before any real student fee record is loaded, first add staff authentication and institution-scoped policies; also confirm production availability and backup requirements. The public demo policy must not be reused for real records.

## Decisions still needed

- Confirm whether 100 means total accounts or peak concurrent users. This proposal assumes at most 100 concurrent sessions; load-test that peak before production.
- Confirm one institution versus multiple institutions, and who may see or change each institution's records. This determines the final membership policies.
- Confirm the authoritative balance source, currency, partial-payment and correction rules, and stage transition rules before writing the final database schema.
- Confirm the email provider and acceptable onboarding pace. Supabase's built-in sender cannot send a 100-person invitation batch quickly.
- Confirm whether the live product may pause during a week with no activity and what backup retention is required.

## Current vendor references

- Supabase pricing and plan quotas: https://supabase.com/pricing
- Supabase Auth rate limits, including the built-in email rate: https://supabase.com/docs/guides/auth/rate-limits
- Supabase row-level security and table protection: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase database functions and function security: https://supabase.com/docs/guides/database/functions
- Vercel Hobby eligibility and its non-commercial restriction: https://vercel.com/docs/plans/hobby
- Vercel pricing and current Pro seat/usage credit: https://vercel.com/pricing

## the decision most expensive to reverse

**Whether records belong to one institution or to multiple independent institutions.** The PRD explicitly leaves this open. Put an institution identifier on each student, balance, and outcome and enforce membership in row-level security from the first schema, even if the MVP contains one institution. Skipping that boundary makes later tenant separation a data migration plus an authorization rewrite; including it now is a small schema and policy cost. The client must still confirm the institution boundary before real data is loaded.
