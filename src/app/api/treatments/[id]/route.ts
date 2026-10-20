import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (isDbConfigured()) {
      const res = await query('SELECT * FROM treatments WHERE id = $1', [params.id]);
      if (res.rows.length === 0) return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
      return NextResponse.json(res.rows[0]);
    }

    const treatment = mockStore.getTreatment(params.id);
    if (!treatment) return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
    return NextResponse.json(treatment);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    if (isDbConfigured()) {
      const res = await query(
        `UPDATE treatments SET
          name = COALESCE($1, name),
          category = COALESCE($2, category),
          description = COALESCE($3, description),
          duration_minutes = COALESCE($4, duration_minutes),
          cost = COALESCE($5, cost),
          updated_at = NOW()
        WHERE id = $6
        RETURNING *`,
        [
          body.name,
          body.category,
          body.description,
          body.duration_minutes !== undefined ? Number(body.duration_minutes) : null,
          body.cost !== undefined ? Number(body.cost) : null,
          params.id,
        ]
      );
      if (res.rows.length === 0) return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
      return NextResponse.json(res.rows[0]);
    }

    const updated = mockStore.updateTreatment(params.id, body);
    if (!updated) return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (isDbConfigured()) {
      await query('UPDATE treatments SET is_active = false, updated_at = NOW() WHERE id = $1', [params.id]);
      return NextResponse.json({ message: 'Treatment deleted' });
    }

    mockStore.deleteTreatment(params.id);
    return NextResponse.json({ message: 'Treatment deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
