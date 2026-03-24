import { NextResponse } from 'next/server';
import { authenticateUser, createSession } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim() ?? '';
    const password = body.password ?? '';

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
