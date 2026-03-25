import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { getPlaidClient, getPlaidCountryCodesForLink, getPlaidProductsForLink } from '@/lib/plaid';

export async function POST() {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await getPlaidClient().linkTokenCreate({
      user: {
        client_user_id: user.id,
      },
      client_name: 'BudgetAI',
      products: getPlaidProductsForLink(),
      country_codes: getPlaidCountryCodesForLink(),
      language: 'en',
    });

    return NextResponse.json({ linkToken: response.data.link_token });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to create a Plaid link token.') },
      { status: 500 }
    );
  }
}
