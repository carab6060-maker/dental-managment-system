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
      const res = await query('SELECT * FROM patients WHERE id = $1', [params.id]);
      if (res.rows.length === 0) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
      return NextResponse.json(res.rows[0]);
    }

    const patient = mockStore.getPatient(params.id);
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    return NextResponse.json(patient);
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

    let dob = body.date_of_birth;
    if (dob === undefined && body.age) {
      const birthYear = new Date().getFullYear() - parseInt(body.age);
      if (!isNaN(birthYear)) {
        dob = `${birthYear}-01-01`;
      }
    }

    if (isDbConfigured()) {
      const res = await query(
        `UPDATE patients SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          date_of_birth = COALESCE($3, date_of_birth),
          gender = COALESCE($4, gender),
          email = COALESCE($5, email),
          phone = COALESCE($6, phone),
          address = COALESCE($7, address),
          city = COALESCE($8, city),
          emergency_contact_name = COALESCE($9, emergency_contact_name),
          emergency_contact_phone = COALESCE($10, emergency_contact_phone),
          blood_group = COALESCE($11, blood_group),
          allergies = COALESCE($12, allergies),
          medical_history = COALESCE($13, medical_history),
          insurance_provider = COALESCE($14, insurance_provider),
          insurance_number = COALESCE($15, insurance_number),
          notes = COALESCE($16, notes),
          updated_at = NOW()
        WHERE id = $17
        RETURNING *`,
        [
          body.first_name,
          body.last_name,
          body.date_of_birth,
          body.gender,
          body.email,
          body.phone,
          body.address,
          body.city,
          body.emergency_contact_name,
          body.emergency_contact_phone,
          body.blood_group,
          body.allergies,
          body.medical_history,
          body.insurance_provider,
          body.insurance_number,
          body.notes,
          params.id,
        ]
      );
      if (res.rows.length === 0) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      return NextResponse.json(res.rows[0]);
    }

    const updated = mockStore.updatePatient(params.id, body);
    if (!updated) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
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
      await query('UPDATE patients SET is_active = false, updated_at = NOW() WHERE id = $1', [params.id]);
      return NextResponse.json({ message: 'Patient deleted' });
    }

    mockStore.deletePatient(params.id);
    return NextResponse.json({ message: 'Patient deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
