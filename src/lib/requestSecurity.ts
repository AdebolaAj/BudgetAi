import { ensureDatabaseSetup, getPool } from '@/lib/db';

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  blockMs: number;
};

type RateLimitRow = {
  count: number;
  window_started_at: string;
  blocked_until: string | null;
};

export function getRequestClientAddress(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

export function getSameOriginError(request: Request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (origin) {
    return origin === expectedOrigin ? null : 'Invalid request origin.';
  }

  if (referer) {
    return referer.startsWith(expectedOrigin) ? null : 'Invalid request origin.';
  }

  return 'Missing request origin.';
}

export async function consumeRateLimit(options: RateLimitOptions) {
  await ensureDatabaseSetup();
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query<RateLimitRow>(
      `
        SELECT count, window_started_at::text, blocked_until::text
        FROM rate_limits
        WHERE key = $1
        FOR UPDATE
      `,
      [options.key]
    );

    const now = new Date();
    const row = result.rows[0];

    if (!row) {
      await client.query(
        `
          INSERT INTO rate_limits (key, count, window_started_at, blocked_until, updated_at)
          VALUES ($1, 1, NOW(), NULL, NOW())
        `,
        [options.key]
      );
      await client.query('COMMIT');
      return { limited: false };
    }

    const blockedUntil = row.blocked_until ? new Date(row.blocked_until) : null;
    if (blockedUntil && blockedUntil > now) {
      await client.query('COMMIT');
      return {
        limited: true,
        retryAfterSeconds: Math.max(Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000), 1),
      };
    }

    const windowStartedAt = new Date(row.window_started_at);
    if (now.getTime() - windowStartedAt.getTime() >= options.windowMs) {
      await client.query(
        `
          UPDATE rate_limits
          SET count = 1, window_started_at = NOW(), blocked_until = NULL, updated_at = NOW()
          WHERE key = $1
        `,
        [options.key]
      );
      await client.query('COMMIT');
      return { limited: false };
    }

    const nextCount = row.count + 1;
    if (nextCount > options.limit) {
      const blockedUntilDate = new Date(now.getTime() + options.blockMs);
      await client.query(
        `
          UPDATE rate_limits
          SET count = $2, blocked_until = $3, updated_at = NOW()
          WHERE key = $1
        `,
        [options.key, nextCount, blockedUntilDate]
      );
      await client.query('COMMIT');
      return {
        limited: true,
        retryAfterSeconds: Math.max(Math.ceil(options.blockMs / 1000), 1),
      };
    }

    await client.query(
      `
        UPDATE rate_limits
        SET count = $2, blocked_until = NULL, updated_at = NOW()
        WHERE key = $1
      `,
      [options.key, nextCount]
    );
    await client.query('COMMIT');
    return { limited: false };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
