import { NextResponse } from 'next/server';
import { ensureDatabaseSetup, getPool } from '@/lib/db';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { getPlaidClient, getPlaidCountryCodesForLink, getPlaidProductsForLink } from '@/lib/plaid';
import { getSameOriginError } from '@/lib/requestSecurity';
import { decryptSecret } from '@/lib/secrets';
import { plaidLinkTokenSchema } from '@/lib/validation';

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

    const body = plaidLinkTokenSchema.parse(await request.json().catch(() => ({})));
    let accessToken: string | undefined;

    if (body.plaidItemId) {
      const itemResult = await getPool().query<{ access_token: string }>(
        `
          SELECT access_token
          FROM plaid_items
          WHERE id = $1 AND user_id = $2
        `,
        [body.plaidItemId, user.id]
      );

      accessToken = itemResult.rows[0]?.access_token
        ? decryptSecret(itemResult.rows[0].access_token)
        : undefined;

      if (!accessToken) {
        return NextResponse.json({ error: 'Plaid item not found.' }, { status: 404 });
      }
    }

    const response = await getPlaidClient().linkTokenCreate({
      user: {
        client_user_id: user.id,
      },
      client_name: 'BudgetAI',
      products: accessToken ? undefined : getPlaidProductsForLink(),
      country_codes: getPlaidCountryCodesForLink(),
      language: 'en',
      access_token: accessToken,
      update: accessToken
        ? {
            account_selection_enabled: true,
          }
        : undefined,
    });

    return NextResponse.json({ linkToken: response.data.link_token });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to create a Plaid link token.') },
      { status: 500 }
    );
  }
}
