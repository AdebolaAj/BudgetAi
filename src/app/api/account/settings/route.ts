import { NextResponse } from 'next/server';
import { createSession, getCurrentSessionUser, hashPassword, verifyPassword } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { ensureDatabaseSetup, getPool } from '@/lib/db';
import { consumeRateLimit, getRequestClientAddress, getSameOriginError } from '@/lib/requestSecurity';
import { accountSettingsSchema } from '@/lib/validation';

export async function PATCH(request: Request) {
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

    const body = accountSettingsSchema.parse(await request.json());
    const pool = getPool();
    const clientAddress = getRequestClientAddress(request);
    const rateLimit = await consumeRateLimit({
      key: `settings:${user.id}:${clientAddress}:${body.type}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
      blockMs: 30 * 60 * 1000,
    });

    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Too many settings changes. Please try again later.' },
        {
          status: 429,
          headers: rateLimit.retryAfterSeconds
            ? { 'Retry-After': String(rateLimit.retryAfterSeconds) }
            : undefined,
        }
      );
    }

    if (body.type === 'email') {
      const email = body.email.trim().toLowerCase();

      const userResult = await pool.query<{ password_hash: string }>(
        `
          SELECT password_hash
          FROM users
          WHERE id = $1
          LIMIT 1
        `,
        [user.id]
      );

      const storedHash = userResult.rows[0]?.password_hash;
      if (!storedHash || !verifyPassword(body.currentPassword, storedHash)) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
      }

      await pool.query(
        `
          UPDATE users
          SET email = $2, updated_at = NOW()
          WHERE id = $1
        `,
        [user.id, email]
      );

      return NextResponse.json({ ok: true });
    }

    if (body.type === 'password') {
      const currentPassword = body.currentPassword ?? '';
      const newPassword = body.newPassword ?? '';

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: 'Current password and new password are required.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'New password must be at least 8 characters.' },
          { status: 400 }
        );
      }

      const userResult = await pool.query<{ password_hash: string }>(
        `
          SELECT password_hash
          FROM users
          WHERE id = $1
          LIMIT 1
        `,
        [user.id]
      );

      const storedHash = userResult.rows[0]?.password_hash;
      if (!storedHash || !verifyPassword(currentPassword, storedHash)) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
      }

      await pool.query(
        `
          DELETE FROM sessions
          WHERE user_id = $1
        `,
        [user.id]
      );

      await pool.query(
        `
          UPDATE users
          SET password_hash = $2, updated_at = NOW()
          WHERE id = $1
        `,
        [user.id, hashPassword(newPassword)]
      );

      await createSession(user.id);

      return NextResponse.json({ ok: true });
    }

    if (body.type === 'subscription') {
      const subscriptionPlan = body.subscriptionPlan;

      if (!subscriptionPlan || !['starter', 'plus', 'pro'].includes(subscriptionPlan)) {
        return NextResponse.json({ error: 'Select a valid subscription plan.' }, { status: 400 });
      }

      await pool.query(
        `
          UPDATE users
          SET subscription_plan = $2, updated_at = NOW()
          WHERE id = $1
        `,
        [user.id, subscriptionPlan]
      );

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unsupported settings update.' }, { status: 400 });
  } catch (error) {
    const message = getApiErrorMessage(error, 'Failed to update account settings.');
    const status = message.includes('already exists') ? 409 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
