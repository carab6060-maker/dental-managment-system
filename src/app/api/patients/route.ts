import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { getTenantContext, getDefaultClinicId } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const { clinicId } = getTenantContext(request);

    if (isDbConfigured()) {
      let q = 'SELECT * FROM patients WHERE is_active = true';
      const params: any[] = [];

      if (clinicId) {
        params.push(clinicId);
        q += ` AND clinic_id = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        q += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`;
      }

      q += ' ORDER BY created_at DESC';

      // Count query
      const countRes = await query(`SELECT count(*) as total FROM (${q}) as sub`, params);
      const total = parseInt(countRes.rows[0].total);

      // Pagination
      q += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const res = await query(q, params);
      return NextResponse.json({ data: res.rows, count: total, page, limit });
    }

    const data = mockStore.getPatients(search, limit);
    return NextResponse.json({ data, count: data.length, page, limit });
  } catch (err: any) {
    console.error('Error fetching patients:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicId } = getTenantContext(request);
    const targetClinicId = body.clinic_id || clinicId || (await getDefaultClinicId());

    if (isDbConfigured()) {
      const res = await query(
        `INSERT INTO patients (
          first_name, last_name, date_of_birth, gender, email, phone,
          address, city, emergency_contact_name, emergency_contact_phone,
          blood_group, allergies, medical_history, insurance_provider,
          insurance_number, notes, clinic_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          body.first_name,
          body.last_name,
          body.date_of_birth || null,
          body.gender || null,
          body.email || null,
          body.phone,
          body.address || null,
          body.city || null,
          body.emergency_contact_name || null,
          body.emergency_contact_phone || null,
          body.blood_group || null,
          body.allergies || null,
          body.medical_history || null,
          body.insurance_provider || null,
          body.insurance_number || null,
          body.notes || null,
          targetClinicId,
        ]
      );
      return NextResponse.json(res.rows[0], { status: 201 });
    }

    const newPatient = mockStore.addPatient(body);
    return NextResponse.json(newPatient, { status: 201 });
  } catch (err: any) {
    console.error('Error creating patient:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
