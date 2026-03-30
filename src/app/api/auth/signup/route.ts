import { NextResponse } from 'next/server';
import { createSession, createUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { consumeRateLimit, getRequestClientAddress, getSameOriginError } from '@/lib/requestSecurity';
import { signUpSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const originError = getSameOriginError(request);
    if (originError) {
      return NextResponse.json({ error: originError }, { status: 403 });
    }

    const body = signUpSchema.parse(await request.json());

    const fullName = body.fullName.trim();
    const email = body.email.trim();
    const password = body.password;
    const clientAddress = getRequestClientAddress(request);
    const rateLimit = await consumeRateLimit({
      key: `signup:${clientAddress}:${email.toLowerCase() || 'unknown'}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
      blockMs: 30 * 60 * 1000,
    });

    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Too many sign-up attempts. Please try again later.' },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { 'Retry-After': String(rateLimit.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'All sign up fields are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const user = await createUser({ fullName, email, password });
    await createSession(user.id);

    return NextResponse.json({
      ok: true,
      user: {
        fullName: user.full_name,
        email: user.email,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && 'code' in error && error.code === '23505'
        ? 'An account with that email already exists.'
        : getApiErrorMessage(error, 'Failed to create account.');

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
