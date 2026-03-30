import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { getPool, ensureDatabaseSetup } from '@/lib/db';
import { getSameOriginError } from '@/lib/requestSecurity';
import { goalSchema } from '@/lib/validation';

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

    const body = goalSchema.parse(await request.json());

    const title = body.title.trim();
    const category = body.category.trim();
    const priority = body.priority;
    const targetAmount = Number(body.targetAmount);
    const targetDate = body.targetDate.trim() || null;
    const notes = body.notes.trim();

    if (!title || targetAmount <= 0) {
      return NextResponse.json(
        { error: 'Goal name and target amount are required.' },
        { status: 400 }
      );
    }

    await getPool().query(
      `
        INSERT INTO goals (
          id,
          user_id,
          title,
          category,
          priority,
          target_amount,
          target_date,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [randomUUID(), user.id, title, category, priority, targetAmount, targetDate, notes]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to save the goal.') },
      { status: 500 }
    );
  }
}
