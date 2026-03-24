import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentSessionUser } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { getPool, ensureDatabaseSetup } from '@/lib/db';

export async function POST(request: Request) {
  try {
    await ensureDatabaseSetup();
    const user = await getCurrentSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      entryType?: 'credit' | 'debit';
      title?: string;
      category?: string;
      notes?: string;
      amount?: string;
      occurredOn?: string;
    };

    const entryType = body.entryType;
    const title = body.title?.trim() ?? '';
    const category = body.category?.trim() ?? '';
    const notes = body.notes?.trim() ?? '';
    const amount = Number(body.amount ?? 0);
    const occurredOn = body.occurredOn?.trim() ?? '';

    if (!entryType || !['credit', 'debit'].includes(entryType)) {
      return NextResponse.json({ error: 'Select a valid entry type.' }, { status: 400 });
    }

    if (!title || !category || !occurredOn || amount <= 0) {
      return NextResponse.json(
        { error: 'Type, title, category, amount, and date are required.' },
        { status: 400 }
      );
    }

    const pool = getPool();
    await pool.query(
      `
        INSERT INTO transaction_entries (
          id,
          user_id,
          entry_type,
          title,
          category,
          notes,
          amount,
          occurred_on
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [randomUUID(), user.id, entryType, title, category, notes, amount, occurredOn]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'Failed to save the transaction entry.') },
      { status: 500 }
    );
  }
}
