import { NextResponse } from 'next/server';
import { createSession, createUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
    };

    const fullName = body.fullName?.trim() ?? '';
    const email = body.email?.trim() ?? '';
    const password = body.password ?? '';

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
