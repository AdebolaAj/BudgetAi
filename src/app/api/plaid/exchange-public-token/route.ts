import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { ensureDatabaseSetup, getPool } from '@/lib/db';
import { getPlaidClient, syncAccountsForItem, syncTransactionsForItem } from '@/lib/plaid';
import { getSameOriginError } from '@/lib/requestSecurity';
import { encryptSecret } from '@/lib/secrets';
import { plaidExchangeSchema } from '@/lib/validation';

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

    const body = plaidExchangeSchema.parse(await request.json());

    const publicToken = body.publicToken?.trim() ?? '';
    if (!publicToken) {
      return NextResponse.json({ error: 'Missing public token.' }, { status: 400 });
    }

    const institutionId = body.institutionId?.trim() ?? '';
    const institutionName = body.institutionName?.trim() ?? '';
    const plaidItemId = body.plaidItemId?.trim() ?? '';

    if (institutionId) {
      const existingInstitutionResult = await getPool().query<{ id: string }>(
        `
          SELECT id
          FROM plaid_items
          WHERE user_id = $1
            AND institution_id = $2
          LIMIT 1
        `,
        [user.id, institutionId]
      );

      const existingInstitutionItemId = existingInstitutionResult.rows[0]?.id;

      if (existingInstitutionItemId && existingInstitutionItemId !== plaidItemId) {
        return NextResponse.json(
          { error: 'This bank is already connected. Use Manage Shared Accounts instead.' },
          { status: 409 }
        );
      }
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
        encryptSecret(exchangeResponse.data.access_token),
        '',
        institutionId,
        institutionName,
      ]
    );

    await syncAccountsForItem(upsertResult.rows[0], {
      institutionName,
      selectedAccounts: body.accounts ?? [],
    });
    await syncTransactionsForItem(upsertResult.rows[0]);

    revalidatePath('/profile');
    revalidatePath('/report');
    revalidatePath('/accounts');
    revalidatePath('/setup');

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to exchange the Plaid public token.') },
      { status: 500 }
    );
  }
}
