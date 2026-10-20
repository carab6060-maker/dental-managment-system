import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    if (isDbConfigured()) {
      let q = 'SELECT * FROM treatments WHERE is_active = true';
      const params: any[] = [];

      if (category) {
        q += ' AND category = $' + (params.length + 1);
        params.push(category);
      }
      if (search) {
        q += ' AND (name ILIKE $' + (params.length + 1) + ' OR category ILIKE $' + (params.length + 1) + ')';
        params.push(`%${search}%`);
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

    if (isDbConfigured()) {
      const res = await query(
        `INSERT INTO treatments (name, category, description, duration_minutes, cost)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          body.name,
          body.category || 'General',
          body.description || null,
          Number(body.duration_minutes || 30),
          Number(body.cost || 0),
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
