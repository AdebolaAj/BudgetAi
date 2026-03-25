# BudgetAI

BudgetAI is a personal finance app that helps users turn account activity and self-reported goals into a clearer budgeting picture. It combines guided onboarding, income modeling, connected banking data, and lightweight reporting so users can understand what they earn, what they spend, and where they are drifting past plan.

## What The App Does

BudgetAI is built around a simple flow:

- users create an account and save a financial profile
- users enter identity, tax, income, savings, and monthly cap information
- users can connect Plaid to pull transaction history
- the dashboard summarizes income, spending, taxes, balance, and recent activity
- the report page visualizes monthly spending and compares actual transactions against expected caps

The app is designed to mix two inputs:

- profile data entered by the user, such as income and monthly category caps
- live transaction history from connected financial accounts

That allows BudgetAI to treat user-entered values as intent and transaction history as actual behavior.

## Tech Stack

BudgetAI is a full-stack TypeScript app built with:

- Next.js 16 App Router for the web application and API routes
- React 19 for the client UI
- Tailwind CSS 4 for styling
- PostgreSQL for persistence
- Plaid for account linking and transaction sync
- `country-state-city` for location autocomplete and normalized city suggestions

## Core Features

- Account creation, sign in, sign out, and session-based authentication
- Postgres-backed financial profile storage
- Multi-step onboarding with editable saved values
- Income support for hourly, monthly, and yearly pay
- Estimated take-home income with federal payroll tax logic and limited state/local tax support
- Currency-aware location selection for user and work location
- Plaid-based account connection and transaction syncing
- Dashboard cards driven by income data and transaction history
- Report page with monthly spending bars and longer-range comparisons
- Category cap comparisons that highlight overspending visually
- Manual credit/debit entries to adjust displayed balance

## Product Notes

- Plaid transaction history is the primary source for spending analysis when available.
- User-entered category amounts are treated as monthly caps rather than direct expenses.
- If Plaid is not connected, spending-based report sections fall back to a minimal state instead of inventing expense totals.
- Tax calculations are planning estimates, not tax filing advice or payroll-grade withholding calculations.

## Current Scope

BudgetAI currently focuses on:

- onboarding and financial-profile capture
- dashboard-style budget monitoring
- transaction-aware reporting

