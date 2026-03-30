import { NextResponse } from 'next/server';
import { authenticateUser, createSession } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { consumeRateLimit, getRequestClientAddress, getSameOriginError } from '@/lib/requestSecurity';
import { signInSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const originError = getSameOriginError(request);
    if (originError) {
      return NextResponse.json({ error: originError }, { status: 403 });
    }

    const body = signInSchema.parse(await request.json());

    const email = body.email.trim();
    const password = body.password;
    const clientAddress = getRequestClientAddress(request);
    const rateLimit = await consumeRateLimit({
      key: `signin:${clientAddress}:${email.toLowerCase() || 'unknown'}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
      blockMs: 30 * 60 * 1000,
    });

    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please try again later.' },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { 'Retry-After': String(rateLimit.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    await createSession(user.id);

    return NextResponse.json({
      ok: true,
      user: {
        fullName: user.full_name,
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to sign in.') },
      { status: 500 }
    );
  }
}
