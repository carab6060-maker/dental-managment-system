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
      const res = await query('SELECT * FROM doctors WHERE id = $1', [params.id]);
      if (res.rows.length === 0) {
        return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      }
      return NextResponse.json(res.rows[0]);
    }

    const doc = mockStore.getDoctor(params.id);
    if (!doc) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    return NextResponse.json(doc);
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
        `UPDATE doctors SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          email = COALESCE($3, email),
          phone = COALESCE($4, phone),
          specialization = COALESCE($5, specialization),
          license_number = COALESCE($6, license_number),
          working_days = COALESCE($7, working_days),
          working_hours_start = COALESCE($8, working_hours_start),
          working_hours_end = COALESCE($9, working_hours_end),
          consultation_fee = COALESCE($10, consultation_fee),
          notes = COALESCE($11, notes),
          updated_at = NOW()
        WHERE id = $12
        RETURNING *`,
        [
          body.first_name,
          body.last_name,
          body.email,
          body.phone,
          body.specialization,
          body.license_number,
          body.working_days,
          body.working_hours_start,
          body.working_hours_end,
          body.consultation_fee !== undefined ? Number(body.consultation_fee) : null,
          body.notes,
          params.id,
        ]
      );
      if (res.rows.length === 0) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      return NextResponse.json(res.rows[0]);
    }

    const updated = mockStore.updateDoctor(params.id, body);
    if (!updated) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
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
      await query('UPDATE doctors SET is_active = false, updated_at = NOW() WHERE id = $1', [params.id]);
      return NextResponse.json({ message: 'Doctor deleted' });
    }

    mockStore.deleteDoctor(params.id);
    return NextResponse.json({ message: 'Doctor deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
