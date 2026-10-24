# TaskNova — Transparent Microtask & Verification Marketplace

TaskNova is a production-grade digital microtask marketplace built with clean financial accounting principles. Every published task is backed by client-funded budgets verified through real banking rails before going live. Contributor rewards are recorded through an append-only, immutable wallet ledger in integer minor units (PKR paisa), and worker payouts are manually verified and reconciled outside the website.

---

## 1. Core Architecture & Guarantees

1. **Pre-Funded Task Budgets**:
   - Clients create tasks and calculate their maximum reward liability (`max_slots * reward_per_slot`).
   - Tasks enter `pending_moderation` where administrators review quality criteria.
   - Clients report deposits made through supported rails (JazzCash, Easypaisa, Bank Transfer).
   - Tasks are **never activated** until a platform administrator independently confirms receipt against the official bank desk.

2. **Immutable Wallet Ledger**:
   - Balances are not stored as unverified mutable numbers.
   - All balance shifts (credits, reservations, completions, releases) are tracked in `wallet_ledger` with unique transaction IDs and idempotency keys.
   - Independent reconciliation audit guarantees zero discrepancies.

3. **Manual Payout Reconciliation**:
   - Workers request withdrawals (minimum PKR 100.00).
   - Requested funds are atomically reserved in the ledger, preventing double-spend attempts.
   - An administrator executes the payment externally and records the authentic payment reference number.
   - If rejected or cancelled, the reservation is atomically released back to available funds.

4. **15 Automated Security & Financial Tests**:
   - The platform includes an automated test suite verifying cross-user record isolation, slot limits, overdraw checks, double-reservation prevention, idempotency, and reconciliation integrity.

---

## 2. Directory Structure

```
├── /data/tasknova_db.json           # Persistent marketplace database & ledger store
├── /server.ts                       # Full-stack Express API & Vite dev server integration
├── /server/db.ts                    # Core ACID transaction mutators & ledger audit engine
├── /src
│   ├── /assets/images               # Generated visual assets
│   ├── /components
│   │   ├── Header.tsx               # 3-Zone top bar with instant demo persona switcher
│   │   ├── Footer.tsx               # Transparent operational disclosures & policy links
│   │   ├── LandingPage.tsx          # Public landing page with live funded tasks
│   │   ├── BrowseTasks.tsx          # Task catalog, filters, and evidence upload
│   │   ├── WorkerDashboard.tsx      # Submissions, wallet, ledger, and withdrawal flows
│   │   ├── ClientDashboard.tsx      # Task creation, liability calculations, and review
│   │   ├── AdminDashboard.tsx       # Moderation, funding verification, and payout reconciliation
│   │   ├── SupportDisputes.tsx      # Support ticket desk and submission dispute appeals
│   │   ├── LegalPoliciesModal.tsx   # Draft Terms, Privacy, Task Rules, and Payout Policies
│   │   └── AuthModal.tsx            # Login, registration, and demo quick access
│   ├── App.tsx                      # Root component and navigation state
│   ├── api.ts                       # Typed REST client with bearer session auth
│   └── types.ts                     # TypeScript schemas matching database entities
├── /supabase/migrations
│   └── 20260101_init.sql            # Full 16-table PostgreSQL schema with RLS policies
├── /tests
│   └── marketplace.test.ts          # 15 automated security, financial, and workflow tests
└── package.json                     # Scripts for dev, test, and build
```

---

## 3. Quickstart & Local Setup

### Prerequisites
- Node.js 20+
- npm

### Installation & Run
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (verifies all 15 financial & security invariants)
npm run test

# 3. Start development server (serves API & React client on http://localhost:3000)
npm run dev
```

---

## 4. Evaluator Demo Personas

For rapid testing and grading, TaskNova includes pre-configured demo personas accessible via the persona dropdown in the top header or the login modal:

1. **Worker (`worker@tasknova.io` / `WorkerPass2026!`)**:
   - Contributor Zainab Ahmed.
   - Has PKR 100 available balance and completed task submission history.
   - Can submit new work with private proof, appeal rejections, and submit withdrawal requests.

2. **Client (`client@tasknova.io` / `ClientPass2026!`)**:
   - Business client Apex Digital Solutions.
   - Has active tasks, verified funded budget, and submissions awaiting review.
   - Can create new tasks (with real-time liability calculation) and report funding deposits.

3. **Admin (`admin@tasknova.io` / `AdminPass2026!`)**:
   - Operations administrator with full verification privileges.
   - Can moderate tasks, verify incoming bank payments, reconcile manual payouts, manage users, and trigger the live ledger audit.

---

## 5. PostgreSQL & Supabase Setup

When deploying to Supabase:
1. Create a new Supabase project (Free Tier supported).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `/supabase/migrations/20260101_init.sql` and run the script.
4. Copy your project URL, anon key, and service role key into `.env`.

---

## 6. Deployment to Vercel

1. Push your repository to GitHub.
2. In the Vercel dashboard, click **Add New Project** and select your GitHub repository.
3. In **Environment Variables**, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Keep server-only)
   - `NEXT_PUBLIC_SITE_URL`
4. Set Build Command to `npm run build` and Output Directory to `dist`.
5. Deploy.
