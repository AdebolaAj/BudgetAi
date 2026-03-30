import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { ensureDatabaseSetup, getPool } from '@/lib/db';
import { syncAccountsForItem, syncTransactionsForItem } from '@/lib/plaid';
import { getSameOriginError } from '@/lib/requestSecurity';

type PlaidItemRecord = {
  id: string;
  user_id: string;
  access_token: string;
  transactions_cursor: string;
};

export async function POST(request: Request) {
  try {
    const originError = getSameOriginError(request);
    if (originError) {
      return NextResponse.json({ error: originError }, { status: 403 });
    }

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
      accountsCount: 0,
      addedCount: 0,
      modifiedCount: 0,
      removedCount: 0,
    };

    for (const item of itemsResult.rows) {
      totals.accountsCount += await syncAccountsForItem(item);
      const result = await syncTransactionsForItem(item);
      totals.addedCount += result.addedCount;
      totals.modifiedCount += result.modifiedCount;
      totals.removedCount += result.removedCount;
    }

    revalidatePath('/profile');
    revalidatePath('/report');
    revalidatePath('/accounts');
    revalidatePath('/setup');

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
