# BudgetAI

BudgetAI is a personal finance app that combines user-defined budgeting intent with live bank activity. The product is designed to help users connect their accounts, define monthly caps and goals, and then compare those plans against what is actually happening in their transaction history.

Instead of treating budgeting as a static spreadsheet exercise, BudgetAI blends three signals:

- financial profile data entered by the user
- synced account and transaction data from Plaid
- AI-assisted guidance layered on top of real numbers

The result is a dashboard that is meant to feel more like an operating view of a user’s finances than a one-time form or passive report.

## Product Experience

BudgetAI is organized around a simple flow:

- create an account and complete a guided financial profile
- connect one or more banks or cards through Plaid
- define monthly category caps and savings goals
- track real inflows, spending, rent, utilities, and savings balances
- compare actual spending against expected caps in a dedicated report view
- open AI deep dives on the current focus area for more specific budgeting guidance

The app separates planning values from observed cash movement:

- manual inputs represent expected caps, goals, and planning assumptions
- Plaid transactions represent actual account behavior
- linked savings balances replace manual savings entry

That distinction keeps the dashboard grounded in real account activity without losing the user’s original budget targets.

## Core Features

- Account creation, sign in, sign out, and Postgres-backed sessions
- Guided onboarding for identity, employer, income, tax status, monthly caps, and goals
- Plaid bank and card linking with support for multiple institutions and multiple shared accounts
- Linked account summaries and institution-level account views
- Transaction sync for spending, savings balances, rent, utilities, and paycheck-like inflows
- Dashboard cards for projected budget, actual cashflow, savings progress, and recent bank activity
- Report page with period-based spending views:
  - month
  - 3 months
  - 6 months
  - year
  - year to date
- Category cap comparison that highlights overspending visually
- Goal creation flow from the dashboard
- Account settings for profile access, password changes, email changes, and subscription-plan selection
- AI “current focus” deep dive powered by real report data rather than invented values

## Tech Stack

BudgetAI is built as a full-stack TypeScript application with:

- Next.js 16 App Router for the web app and server routes
- React 19 for the client interface
- Tailwind CSS 4 for styling
- PostgreSQL for persistence
- Plaid for account linking, account metadata, and transaction sync
- OpenAI Responses API for grounded financial guidance in the deep-dive workflow
- `country-state-city` for location autocomplete
- `zod` for request validation

## Data Model At A High Level

The app’s backend centers around a few main data domains:

- `users` and `sessions` for authentication
- `financial_profiles` for onboarding and budgeting inputs
- `plaid_items`, `plaid_accounts`, and `plaid_transactions` for connected institutions and synced activity
- `goals` for user-created planning targets
- `rate_limits` for basic application-level abuse protection

This lets BudgetAI support both combined financial views and institution/account-level reporting.

## Security Posture

BudgetAI includes a first pass at application security:

- hashed passwords
- httpOnly session cookies
- request validation with `zod`
- same-origin protection on authenticated mutation routes
- basic rate limiting on sensitive endpoints
- encrypted Plaid access tokens at rest
- session rotation on password change

This is not yet a production-complete security posture. The app still needs stronger email verification flows, better auditability, and more mature operational hardening before it should be treated as a fully production-ready financial platform.

## Current Scope

BudgetAI currently focuses on:

- consumer budgeting and spending awareness
- transaction-backed financial dashboards
- multi-account visibility
- goal planning
- AI-assisted financial explanations

It is not currently positioned as:

- a bookkeeping system
- a tax filing platform
- a brokerage or payments product
- a fully mature subscription billing platform
- a complete enterprise-grade banking data warehouse

## Product Direction

The app is already structured to grow into:

- account-level reports by institution or account type
- richer recurring-income detection
- deeper goal tracking
- better budgeting recommendations based on transaction behavior
- stronger subscription and billing flows

The current implementation aims to establish the core budgeting loop first: connect accounts, set intent, observe reality, and act on the gap.
