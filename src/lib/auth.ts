import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { getPool, ensureDatabaseSetup } from '@/lib/db';

const SESSION_COOKIE_NAME = 'budgetai_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

export type UserRecord = {
  id: string;
  full_name: string;
  email: string;
  subscription_plan?: string;
};

export function hashPassword(password: string, salt?: string) {
  const passwordSalt = salt ?? randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, passwordSalt, 64).toString('hex');
  return `${passwordSalt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hashedPassword] = storedHash.split(':');
  const derivedKey = scryptSync(password, salt, 64);
  const storedKey = Buffer.from(hashedPassword, 'hex');

  return timingSafeEqual(derivedKey, storedKey);
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  };
}

export async function createUser(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  await ensureDatabaseSetup();
  const pool = getPool();

  const result = await pool.query<UserRecord>(
    `
      INSERT INTO users (id, full_name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email
    `,
    [
      randomUUID(),
      input.fullName.trim(),
      input.email.trim().toLowerCase(),
      hashPassword(input.password),
    ]
  );

  return result.rows[0];
}

export async function authenticateUser(email: string, password: string) {
  await ensureDatabaseSetup();
  const pool = getPool();

  const result = await pool.query<
    UserRecord & {
      password_hash: string;
    }
  >(
    `
      SELECT id, full_name, email, password_hash
      FROM users
      WHERE email = $1
    `,
    [email.trim().toLowerCase()]
  );

  const user = result.rows[0];
  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.password_hash)) {
    return null;
  }

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
  };
}

export async function createSession(userId: string) {
  await ensureDatabaseSetup();
  const pool = getPool();
  const sessionToken = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await pool.query(
    `
      INSERT INTO sessions (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [randomUUID(), userId, tokenHash, expiresAt]
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions(expiresAt));
}

export async function clearSession() {
  await ensureDatabaseSetup();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    const pool = getPool();
    await pool.query(`DELETE FROM sessions WHERE token_hash = $1`, [hashSessionToken(sessionToken)]);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSessionUser() {
  await ensureDatabaseSetup();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const pool = getPool();
  const result = await pool.query<UserRecord>(
    `
      SELECT users.id, users.full_name, users.email, users.subscription_plan
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1
        AND sessions.expires_at > NOW()
      LIMIT 1
    `,
    [hashSessionToken(sessionToken)]
  );

  return result.rows[0] ?? null;
}
