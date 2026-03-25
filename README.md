# BudgetAI

BudgetAI is a Next.js 16 App Router app for account-based budgeting. Users sign up, complete a financial profile, optionally connect Plaid, and get a dashboard plus report built from saved profile data and synced transaction history.

## Features

- Postgres-backed sign up, sign in, sign out, and session cookies
- Saved financial profile with editable onboarding
- Plaid sandbox/live wiring for account connection and transaction sync
- Income normalization for hourly, monthly, or yearly pay
- Estimated U.S. take-home income with federal payroll tax logic and limited state/local tax support
- Dashboard cards derived from profile data and Plaid transaction history
- Dedicated report page with monthly spending bars and comparison windows
- Manual credit/debit entries that adjust the displayed balance
- Currency-aware location autocomplete in onboarding using `country-state-city`

## Core Flow

1. User creates an account.
2. User completes onboarding at `/setup`.
3. Step 1 captures identity, address, tax status, currency, user location, and work location.
4. Step 2 captures Plaid connection and income.
5. Step 3 captures monthly category caps, insurance, and savings goals.
6. Dashboard at `/profile` summarizes the saved profile and synced activity.
7. Report at `/report` uses Plaid transactions for spending breakdowns when available.

## Stack

- Next.js 16.2.1
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- PostgreSQL
- Plaid
- `country-state-city`

## App Routes

- `/` landing page
- `/setup` onboarding and profile update flow
- `/profile` dashboard
- `/report` spending report

## API Routes

- `/api/auth/signup`
- `/api/auth/signin`
- `/api/auth/signout`
- `/api/financial-profile`
- `/api/transactions`
- `/api/plaid/link-token`
- `/api/plaid/exchange-public-token`
- `/api/plaid/status`
- `/api/plaid/sync-transactions`
- `/api/plaid/monthly-spending-summary`

## Environment

Create `.env.local` in the project root.

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/budgetai
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
PLAID_PRODUCTS=transactions
PLAID_COUNTRY_CODES=US
```

Notes:

- Replace `DATABASE_URL` with your real local Postgres connection string.
- `PLAID_ENV=sandbox` is the safest default for local development.
- If Plaid credentials are blank, the app will not be able to create a Plaid link token.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

```bash
createdb budgetai
```

If your Postgres role is not `postgres`, use your local role and update `.env.local` accordingly.

### 3. Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Database

The app bootstraps its schema automatically on runtime. Current tables:

- `users`
- `sessions`
- `financial_profiles`
- `transaction_entries`
- `plaid_items`
- `plaid_transactions`

There is no formal migration system yet. Schema changes are currently handled with `CREATE TABLE IF NOT EXISTS` and targeted `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements in [src/lib/db.ts](/Users/adebolaajayi/BudgetAi/src/lib/db.ts).

## Plaid Sandbox

For a basic sandbox bank connection, use a Plaid test institution such as `First Platypus Bank` and Plaid sandbox credentials from the official docs.

Common local expectations:

- `PLAID_ENV` should be `sandbox`
- Link token creation must succeed before the Plaid button works
- Transaction-based report sections only populate after a successful item exchange and sync

## Financial Modeling Notes

BudgetAI currently uses:

- income normalization from hourly, monthly, or yearly pay
- pre-tax insurance deduction handling
- U.S. federal income tax estimation
- Social Security and Medicare estimation
- limited state/local support for selected jurisdictions

Current scoped state/local support includes:

- New York State
- New York City
- Pennsylvania
- Philadelphia
- no-wage-tax handling for states such as Texas and Florida

This is an estimate layer for planning, not tax filing software.

## Spending Logic

- If Plaid transactions are available, dashboard and report spending views use synced transaction history.
- If no Plaid account is linked, total expenses in the report fall back to `0`.
- Manual category inputs in onboarding are treated as monthly caps, not direct expense totals.
- Report bars can turn red when Plaid spending exceeds the corresponding saved monthly cap.

## Important Files

- [src/lib/db.ts](/Users/adebolaajayi/BudgetAi/src/lib/db.ts)
- [src/lib/auth.ts](/Users/adebolaajayi/BudgetAi/src/lib/auth.ts)
- [src/lib/plaid.ts](/Users/adebolaajayi/BudgetAi/src/lib/plaid.ts)
- [src/lib/financialProfile.ts](/Users/adebolaajayi/BudgetAi/src/lib/financialProfile.ts)
- [src/lib/profileData.ts](/Users/adebolaajayi/BudgetAi/src/lib/profileData.ts)
- [src/lib/locationOptions.ts](/Users/adebolaajayi/BudgetAi/src/lib/locationOptions.ts)
- [src/components/OnboardingForm.tsx](/Users/adebolaajayi/BudgetAi/src/components/OnboardingForm.tsx)
- [src/components/PlaidConnectButton.tsx](/Users/adebolaajayi/BudgetAi/src/components/PlaidConnectButton.tsx)
- [src/components/TransactionEntryForm.tsx](/Users/adebolaajayi/BudgetAi/src/components/TransactionEntryForm.tsx)
- [src/app/profile/page.tsx](/Users/adebolaajayi/BudgetAi/src/app/profile/page.tsx)
- [src/app/report/page.tsx](/Users/adebolaajayi/BudgetAi/src/app/report/page.tsx)

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Current Limitations

- Auth is custom and intentionally minimal.
- No password reset, email verification, or recovery flow yet.
- Plaid support is wired for connection and transaction sync, but not every downstream budgeting surface is fully account-aware.
- Tax logic is scoped and does not cover every jurisdiction or filing nuance.
- Schema setup is automatic, but there is no dedicated migration framework.

## Development

Run lint before shipping changes:

```bash
npm run lint
```
