import { Pool } from 'pg';

declare global {
  var budgetAiPool: Pool | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Add it to your environment before using Postgres.');
  }

  return databaseUrl;
}

export function getPool() {
  if (!globalThis.budgetAiPool) {
    globalThis.budgetAiPool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  return globalThis.budgetAiPool;
}

export async function ensureDatabaseSetup() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      subscription_plan TEXT NOT NULL DEFAULT 'starter',
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'starter';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      blocked_until TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS financial_profiles (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      phone_number TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      employer_name TEXT NOT NULL DEFAULT '',
      tax_status TEXT NOT NULL DEFAULT '',
      frequency TEXT NOT NULL,
      salary TEXT NOT NULL,
      user_location TEXT NOT NULL,
      work_location TEXT NOT NULL,
      current_savings TEXT NOT NULL,
      monthly_rent TEXT NOT NULL,
      monthly_bills TEXT NOT NULL,
      monthly_food_budget TEXT NOT NULL,
      monthly_transport TEXT NOT NULL,
      monthly_utilities TEXT NOT NULL,
      monthly_insurance TEXT NOT NULL,
      monthly_plans TEXT NOT NULL,
      monthly_donations TEXT NOT NULL,
      monthly_entertainment TEXT NOT NULL,
      savings_goal TEXT NOT NULL,
      investment_amount TEXT NOT NULL,
      emergency_fund TEXT NOT NULL,
      currency TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE financial_profiles
    ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS employer_name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS tax_status TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transaction_entries (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_type TEXT NOT NULL CHECK (entry_type IN ('credit', 'debit')),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
      occurred_on DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      priority TEXT NOT NULL DEFAULT 'medium',
      target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
      target_date DATE,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plaid_items (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_id TEXT NOT NULL UNIQUE,
      access_token TEXT NOT NULL,
      transactions_cursor TEXT NOT NULL DEFAULT '',
      institution_id TEXT NOT NULL DEFAULT '',
      institution_name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE plaid_items
    ADD COLUMN IF NOT EXISTS transactions_cursor TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plaid_transactions (
      transaction_id TEXT PRIMARY KEY,
      plaid_item_id UUID NOT NULL REFERENCES plaid_items(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL,
      name TEXT NOT NULL,
      merchant_name TEXT NOT NULL DEFAULT '',
      amount NUMERIC(12, 2) NOT NULL,
      iso_currency_code TEXT NOT NULL DEFAULT 'USD',
      date DATE NOT NULL,
      authorized_date DATE,
      category_primary TEXT NOT NULL DEFAULT '',
      category_detailed TEXT NOT NULL DEFAULT '',
      payment_channel TEXT NOT NULL DEFAULT '',
      pending BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS plaid_accounts (
      account_id TEXT PRIMARY KEY,
      plaid_item_id UUID NOT NULL REFERENCES plaid_items(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      institution_name TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL DEFAULT '',
      mask TEXT NOT NULL DEFAULT '',
      official_name TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT '',
      subtype TEXT NOT NULL DEFAULT '',
      available_balance NUMERIC(12, 2),
      current_balance NUMERIC(12, 2),
      credit_limit NUMERIC(12, 2),
      iso_currency_code TEXT NOT NULL DEFAULT 'USD',
      is_selected BOOLEAN NOT NULL DEFAULT TRUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE plaid_accounts
    ADD COLUMN IF NOT EXISTS institution_name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS mask TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS official_name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS subtype TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS available_balance NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS current_balance NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS iso_currency_code TEXT NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS is_selected BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
  `);
}
