import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { ensureDatabaseSetup, getPool } from '@/lib/db';
import { getPlaidClient, syncTransactionsForItem } from '@/lib/plaid';

export async function POST(request: Request) {
  try {
    await ensureDatabaseSetup();
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      publicToken?: string;
      institutionId?: string;
      institutionName?: string;
    };

    const publicToken = body.publicToken?.trim() ?? '';
    if (!publicToken) {
      return NextResponse.json({ error: 'Missing public token.' }, { status: 400 });
    }

    const exchangeResponse = await getPlaidClient().itemPublicTokenExchange({
      public_token: publicToken,
    });

    const pool = getPool();
    const upsertResult = await pool.query<{ id: string; user_id: string; access_token: string; transactions_cursor: string }>(
      `
        INSERT INTO plaid_items (
          id,
          user_id,
          item_id,
          access_token,
          transactions_cursor,
          institution_id,
          institution_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (item_id)
        DO UPDATE SET
          access_token = EXCLUDED.access_token,
          institution_id = EXCLUDED.institution_id,
          institution_name = EXCLUDED.institution_name,
          user_id = EXCLUDED.user_id,
          updated_at = NOW()
        RETURNING id, user_id, access_token, transactions_cursor
      `,
      [
        randomUUID(),
        user.id,
        exchangeResponse.data.item_id,
        exchangeResponse.data.access_token,
        '',
        body.institutionId?.trim() ?? '',
        body.institutionName?.trim() ?? '',
      ]
    );

    await syncTransactionsForItem(upsertResult.rows[0]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to exchange the Plaid public token.') },
      { status: 500 }
    );
  }
}
