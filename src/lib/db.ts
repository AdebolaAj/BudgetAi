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
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
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
    CREATE TABLE IF NOT EXISTS financial_profiles (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
}
