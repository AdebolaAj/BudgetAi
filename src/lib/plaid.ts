import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
  Transaction,
  RemovedTransaction,
} from 'plaid';
import { getPool } from '@/lib/db';

declare global {
  var budgetAiPlaidClient: PlaidApi | undefined;
}

function getPlaidCredentials() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;

  if (!clientId || !secret) {
    throw new Error('Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to your environment.');
  }

  return { clientId, secret };
}

export function getPlaidClient() {
  if (!globalThis.budgetAiPlaidClient) {
    const { clientId, secret } = getPlaidCredentials();
    const env = process.env.PLAID_ENV ?? 'sandbox';
    const basePath =
      PlaidEnvironments[env as keyof typeof PlaidEnvironments] ?? PlaidEnvironments.sandbox;

    globalThis.budgetAiPlaidClient = new PlaidApi(
      new Configuration({
        basePath,
        baseOptions: {
          headers: {
            'PLAID-CLIENT-ID': clientId,
            'PLAID-SECRET': secret,
          },
        },
      })
    );
  }

  return globalThis.budgetAiPlaidClient;
}

export function getPlaidProductsForLink() {
  const configured = process.env.PLAID_PRODUCTS?.split(',')
    .map((product) => product.trim())
    .filter(Boolean) as Products[] | undefined;

  return configured?.length ? configured : [Products.Transactions];
}

export function getPlaidCountryCodesForLink() {
  const configured = process.env.PLAID_COUNTRY_CODES?.split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean) as CountryCode[] | undefined;

  return configured?.length ? configured : [CountryCode.Us];
}

type PlaidItemRecord = {
  id: string;
  user_id: string;
  access_token: string;
  transactions_cursor: string;
};

function normalizeTransactionDate(value?: string | null) {
  return value ?? new Date().toISOString().slice(0, 10);
}

async function upsertPlaidTransactions(
  plaidItemId: string,
  userId: string,
  transactions: Transaction[]
) {
  const pool = getPool();

  for (const transaction of transactions) {
    await pool.query(
      `
        INSERT INTO plaid_transactions (
          transaction_id,
          plaid_item_id,
          user_id,
          account_id,
          name,
          merchant_name,
          amount,
          iso_currency_code,
          date,
          authorized_date,
          category_primary,
          category_detailed,
          payment_channel,
          pending,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, NOW()
        )
        ON CONFLICT (transaction_id)
        DO UPDATE SET
          account_id = EXCLUDED.account_id,
          name = EXCLUDED.name,
          merchant_name = EXCLUDED.merchant_name,
          amount = EXCLUDED.amount,
          iso_currency_code = EXCLUDED.iso_currency_code,
          date = EXCLUDED.date,
          authorized_date = EXCLUDED.authorized_date,
          category_primary = EXCLUDED.category_primary,
          category_detailed = EXCLUDED.category_detailed,
          payment_channel = EXCLUDED.payment_channel,
          pending = EXCLUDED.pending,
          updated_at = NOW()
      `,
      [
        transaction.transaction_id,
        plaidItemId,
        userId,
        transaction.account_id,
        transaction.name,
        transaction.merchant_name ?? '',
        Number(transaction.amount),
        transaction.iso_currency_code ?? 'USD',
        normalizeTransactionDate(transaction.date),
        transaction.authorized_date ?? null,
        transaction.personal_finance_category?.primary ?? '',
        transaction.personal_finance_category?.detailed ?? '',
        transaction.payment_channel ?? '',
        Boolean(transaction.pending),
      ]
    );
  }
}

async function removePlaidTransactions(removed: RemovedTransaction[]) {
  if (!removed.length) {
    return;
  }

  const pool = getPool();
  await pool.query(
    `DELETE FROM plaid_transactions WHERE transaction_id = ANY($1::text[])`,
    [removed.map((transaction) => transaction.transaction_id)]
  );
}

export async function syncTransactionsForItem(item: PlaidItemRecord) {
  const client = getPlaidClient();
  const pool = getPool();
  let cursor = item.transactions_cursor || '';
  let hasMore = true;
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;

  while (hasMore) {
    const response = await client.transactionsSync({
      access_token: item.access_token,
      cursor: cursor || undefined,
    });

    await upsertPlaidTransactions(item.id, item.user_id, response.data.added);
    await upsertPlaidTransactions(item.id, item.user_id, response.data.modified);
    await removePlaidTransactions(response.data.removed);

    addedCount += response.data.added.length;
    modifiedCount += response.data.modified.length;
    removedCount += response.data.removed.length;
    cursor = response.data.next_cursor;
    hasMore = response.data.has_more;
  }

  await pool.query(
    `
      UPDATE plaid_items
      SET transactions_cursor = $2, updated_at = NOW()
      WHERE id = $1
    `,
    [item.id, cursor]
  );

  return {
    addedCount,
    modifiedCount,
    removedCount,
  };
}
