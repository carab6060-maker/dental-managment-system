import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { getTenantContext, getDefaultClinicId } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const { clinicId } = getTenantContext(request);

    if (isDbConfigured()) {
      let q = 'SELECT * FROM treatments WHERE is_active = true';
      const params: any[] = [];

      if (clinicId) {
        params.push(clinicId);
        q += ` AND clinic_id = $${params.length}`;
      }

      if (category) {
        params.push(category);
        q += ` AND category = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        q += ` AND (name ILIKE $${params.length} OR category ILIKE $${params.length})`;
      }

      q += ' ORDER BY category ASC, name ASC';
      const res = await query(q, params);
      return NextResponse.json({ data: res.rows });
    }

    let data = mockStore.getTreatments();
    if (category) {
      data = data.filter((t) => t.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
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
        `INSERT INTO treatments (name, category, description, duration_minutes, cost, clinic_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          body.name,
          body.category || 'General',
          body.description || null,
          body.duration_minutes || 30,
          body.cost || 0,
          targetClinicId,
        ]
      );
      return NextResponse.json(res.rows[0], { status: 201 });
    }

    const newTreatment = mockStore.addTreatment(body);
    return NextResponse.json(newTreatment, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
