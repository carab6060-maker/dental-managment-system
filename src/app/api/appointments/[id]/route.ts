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
      const res = await query(
        `SELECT 
          a.*,
          json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'phone', p.phone, 'email', p.email) as patients,
          json_build_object('id', d.id, 'first_name', d.first_name, 'last_name', d.last_name, 'specialization', d.specialization) as doctors,
          json_build_object('id', t.id, 'name', t.name, 'cost', t.cost, 'duration_minutes', t.duration_minutes) as treatments
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN treatments t ON a.treatment_id = t.id
        WHERE a.id = $1`,
        [params.id]
      );
      if (res.rows.length === 0) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      return NextResponse.json(res.rows[0]);
    }

    const apt = mockStore.getAppointment(params.id);
    if (!apt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    return NextResponse.json(apt);
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
        `UPDATE appointments SET
          patient_id = COALESCE($1, patient_id),
          doctor_id = COALESCE($2, doctor_id),
          treatment_id = COALESCE($3, treatment_id),
          appointment_date = COALESCE($4, appointment_date),
          start_time = COALESCE($5, start_time),
          end_time = COALESCE($6, end_time),
          status = COALESCE($7, status),
          notes = COALESCE($8, notes),
          updated_at = NOW()
        WHERE id = $9
        RETURNING *`,
        [
          body.patient_id,
          body.doctor_id,
          body.treatment_id,
          body.appointment_date,
          body.start_time,
          body.end_time,
          body.status,
          body.notes,
          params.id,
        ]
      );
      if (res.rows.length === 0) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      return NextResponse.json(res.rows[0]);
    }

    const updated = mockStore.updateAppointment(params.id, body);
    if (!updated) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
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
      await query("UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [params.id]);
      return NextResponse.json({ message: 'Appointment cancelled' });
    }

    mockStore.updateAppointment(params.id, { status: 'cancelled' });
    return NextResponse.json({ message: 'Appointment cancelled' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
