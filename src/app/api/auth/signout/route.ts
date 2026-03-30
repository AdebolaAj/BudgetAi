import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';
import { getSameOriginError } from '@/lib/requestSecurity';

export async function POST(request: Request) {
  try {
    const originError = getSameOriginError(request);
    if (originError) {
      return NextResponse.json({ error: originError }, { status: 403 });
    }

    await clearSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to sign out.' }, { status: 500 });
  }
}
