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
      const invRes = await query(
        `SELECT 
          i.*,
          json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'phone', p.phone, 'email', p.email) as patients,
          COALESCE(
            (SELECT json_agg(item) FROM invoice_items item WHERE item.invoice_id = i.id),
            '[]'::json
          ) as invoice_items
        FROM invoices i
        LEFT JOIN patients p ON i.patient_id = p.id
        WHERE i.id = $1`,
        [params.id]
      );

      if (invRes.rows.length === 0) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

      const payRes = await query(
        'SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
        [params.id]
      );

      return NextResponse.json({ ...invRes.rows[0], payments: payRes.rows || [] });
    }

    const inv = mockStore.getInvoice(params.id);
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(inv);
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
        `UPDATE invoices SET
          status = COALESCE($1, status),
          notes = COALESCE($2, notes),
          due_date = COALESCE($3, due_date),
          updated_at = NOW()
        WHERE id = $4
        RETURNING *`,
        [body.status, body.notes, body.due_date, params.id]
      );
      if (res.rows.length === 0) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      return NextResponse.json(res.rows[0]);
    }

    const updated = mockStore.updateInvoice(params.id, body);
    if (!updated) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
