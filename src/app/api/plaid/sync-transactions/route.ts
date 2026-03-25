import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { ensureDatabaseSetup, getPool } from '@/lib/db';
import { syncTransactionsForItem } from '@/lib/plaid';

type PlaidItemRecord = {
  id: string;
  user_id: string;
  access_token: string;
  transactions_cursor: string;
};

export async function POST() {
  try {
    await ensureDatabaseSetup();
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemsResult = await getPool().query<PlaidItemRecord>(
      `
        SELECT id, user_id, access_token, transactions_cursor
        FROM plaid_items
        WHERE user_id = $1
      `,
      [user.id]
    );

    if (!itemsResult.rows.length) {
      return NextResponse.json({ error: 'No connected Plaid accounts found.' }, { status: 400 });
    }

    const totals = {
      addedCount: 0,
      modifiedCount: 0,
      removedCount: 0,
    };

    for (const item of itemsResult.rows) {
      const result = await syncTransactionsForItem(item);
      totals.addedCount += result.addedCount;
      totals.modifiedCount += result.modifiedCount;
      totals.removedCount += result.removedCount;
    }

    return NextResponse.json({
      ok: true,
      ...totals,
    });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to sync Plaid transactions.') },
      { status: 500 }
    );
  }
}
