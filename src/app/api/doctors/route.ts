import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { getTenantContext, getDefaultClinicId } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const { clinicId } = getTenantContext(request);

    if (isDbConfigured()) {
      let q = 'SELECT * FROM doctors WHERE is_active = true';
      const params: any[] = [];

      if (clinicId) {
        params.push(clinicId);
        q += ` AND clinic_id = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        q += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR specialization ILIKE $${params.length})`;
      }

      q += ' ORDER BY last_name ASC';
      const res = await query(q, params);
      return NextResponse.json({ data: res.rows });
    }

    let data = mockStore.getDoctors();
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (d) =>
          d.first_name.toLowerCase().includes(q) ||
          d.last_name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q)
      );
    }
    return NextResponse.json({ data });
  } catch (err: any) {
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
        `INSERT INTO doctors (
          first_name, last_name, email, phone, specialization,
          license_number, working_days, working_hours_start,
          working_hours_end, consultation_fee, notes, clinic_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          body.first_name,
          body.last_name,
          body.email || null,
          body.phone || null,
          body.specialization,
          body.license_number || null,
          body.working_days || 'Mon,Tue,Wed,Thu,Fri',
          body.working_hours_start || '09:00',
          body.working_hours_end || '17:00',
          body.consultation_fee || 0,
          body.notes || null,
          targetClinicId,
        ]
      );
      return NextResponse.json(res.rows[0], { status: 201 });
    }

    const newDoctor = mockStore.addDoctor(body);
    return NextResponse.json(newDoctor, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
