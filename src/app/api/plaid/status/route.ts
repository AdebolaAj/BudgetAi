import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { ensureDatabaseSetup, getPool } from '@/lib/db';

export async function GET() {
  try {
    await ensureDatabaseSetup();
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getPool().query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM plaid_items WHERE user_id = $1`,
      [user.id]
    );
    const institutionsResult = await getPool().query<{ institution_name: string }>(
      `
        SELECT DISTINCT institution_name
        FROM plaid_items
        WHERE user_id = $1
          AND institution_name IS NOT NULL
          AND institution_name <> ''
        ORDER BY institution_name ASC
      `,
      [user.id]
    );

    return NextResponse.json({
      hasConnectedItem: Number(result.rows[0]?.total ?? '0') > 0,
      institutions: institutionsResult.rows.map((row) => row.institution_name),
    });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to load Plaid connection status.') },
      { status: 500 }
    );
  }
}
