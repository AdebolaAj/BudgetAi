import {
  AccountBase,
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
  Transaction,
  RemovedTransaction,
} from 'plaid';
import { getPool } from '@/lib/db';
import { decryptSecret } from '@/lib/secrets';

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

export type PlaidLinkedAccount = {
  id: string;
  name: string;
  mask: string;
  type: string;
  subtype: string;
};

function normalizeTransactionDate(value?: string | null) {
  return value ?? new Date().toISOString().slice(0, 10);
}

function toNullableNumber(value?: number | null) {
  return typeof value === 'number' ? value : null;
}

export async function syncAccountsForItem(
  item: PlaidItemRecord,
  options?: {
    institutionName?: string;
    selectedAccounts?: PlaidLinkedAccount[];
  }
) {
  const client = getPlaidClient();
  const pool = getPool();
  const accountsResponse = await client.accountsGet({
    access_token: decryptSecret(item.access_token),
  });
  const selectedAccountIds = new Set((options?.selectedAccounts ?? []).map((account) => account.id));
  const hasExplicitSelection = selectedAccountIds.size > 0;

  for (const account of accountsResponse.data.accounts) {
    const isSelected = hasExplicitSelection ? selectedAccountIds.has(account.account_id) : true;

    await upsertPlaidAccount(
      pool,
      item,
      account,
      options?.institutionName ?? '',
      isSelected
    );
  }

  const returnedAccountIds = accountsResponse.data.accounts.map((account) => account.account_id);

  if (returnedAccountIds.length > 0) {
    await pool.query(
      `
        UPDATE plaid_accounts
        SET is_active = FALSE, updated_at = NOW()
        WHERE plaid_item_id = $1
          AND account_id <> ALL($2::text[])
      `,
      [item.id, returnedAccountIds]
    );
  }

  return accountsResponse.data.accounts.length;
}

async function upsertPlaidAccount(
  pool: ReturnType<typeof getPool>,
  item: PlaidItemRecord,
  account: AccountBase,
  institutionName: string,
  isSelected: boolean
) {
  await pool.query(
    `
      INSERT INTO plaid_accounts (
        account_id,
        plaid_item_id,
        user_id,
        institution_name,
        name,
        mask,
        official_name,
        type,
        subtype,
        available_balance,
        current_balance,
        credit_limit,
        iso_currency_code,
        is_selected,
        is_active,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, TRUE, NOW()
      )
      ON CONFLICT (account_id)
      DO UPDATE SET
        plaid_item_id = EXCLUDED.plaid_item_id,
        user_id = EXCLUDED.user_id,
        institution_name = EXCLUDED.institution_name,
        name = EXCLUDED.name,
        mask = EXCLUDED.mask,
        official_name = EXCLUDED.official_name,
        type = EXCLUDED.type,
        subtype = EXCLUDED.subtype,
        available_balance = EXCLUDED.available_balance,
        current_balance = EXCLUDED.current_balance,
        credit_limit = EXCLUDED.credit_limit,
        iso_currency_code = EXCLUDED.iso_currency_code,
        is_selected = EXCLUDED.is_selected,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `,
    [
      account.account_id,
      item.id,
      item.user_id,
      institutionName,
      account.name,
      account.mask ?? '',
      account.official_name ?? '',
      account.type,
      account.subtype ?? '',
      toNullableNumber(account.balances.available),
      toNullableNumber(account.balances.current),
      toNullableNumber(account.balances.limit),
      account.balances.iso_currency_code ?? 'USD',
      isSelected,
    ]
  );
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
      access_token: decryptSecret(item.access_token),
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
