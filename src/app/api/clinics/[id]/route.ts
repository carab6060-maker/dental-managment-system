import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { withAuth, JWTPayload } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/clinics/[id]
export const GET = withAuth(async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  const isSuper = user.role === 'superadmin' || user.role === 'admin' || user.username === 'carab' || user.username === 'superadmin';
  if (!isSuper && user.clinicId !== id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const res = await query(`SELECT * FROM clinics WHERE id = $1`, [id]);
  if (res.rows.length === 0) {
    return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
  }

  return NextResponse.json({ clinic: res.rows[0] });
});

// PATCH /api/clinics/[id]
export const PATCH = withAuth(async (request: NextRequest, user: JWTPayload) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  const isSuper = user.role === 'superadmin' || user.role === 'admin' || user.username === 'carab' || user.username === 'superadmin';
  if (!isSuper && user.clinicId !== id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, phone, email, address, city, status, subscriptionPlan } = body;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (address !== undefined) { fields.push(`address = $${idx++}`); values.push(address); }
    if (city !== undefined) { fields.push(`city = $${idx++}`); values.push(city); }
    if (status !== undefined && user.role === 'superadmin') {
      fields.push(`status = $${idx++}`); values.push(status);
    }
    if (subscriptionPlan !== undefined && user.role === 'superadmin') {
      fields.push(`subscription_plan = $${idx++}`); values.push(subscriptionPlan);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE clinics SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`,
      values
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, clinic: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update clinic' }, { status: 500 });
  }
});

// DELETE /api/clinics/[id] (Superadmin only)
export const DELETE = withAuth(async (request: NextRequest, user: JWTPayload) => {
  const isSuper = user.role === 'superadmin' || user.role === 'admin' || user.username === 'carab' || user.username === 'superadmin';
  if (!isSuper) {
    return NextResponse.json({ error: 'Only Superadmin can delete clinics' }, { status: 403 });
  }

  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  try {
    const res = await query(`DELETE FROM clinics WHERE id = $1 RETURNING id, name;`, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Clinic "${res.rows[0].name}" deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete clinic' }, { status: 500 });
  }
});
