import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const patientId = searchParams.get('patient_id') || '';

    if (isDbConfigured()) {
      let q = `
        SELECT 
          i.*,
          json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'phone', p.phone, 'email', p.email) as patients,
          COALESCE(
            (SELECT json_agg(item) FROM invoice_items item WHERE item.invoice_id = i.id),
            '[]'::json
          ) as invoice_items
        FROM invoices i
        LEFT JOIN patients p ON i.patient_id = p.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (status) {
        q += ` AND i.status = $${params.length + 1}`;
        params.push(status);
      }
      if (patientId) {
        q += ` AND i.patient_id = $${params.length + 1}`;
        params.push(patientId);
      }

      q += ' ORDER BY i.created_at DESC';
      const res = await query(q, params);
      return NextResponse.json({ data: res.rows });
    }

    const data = mockStore.getInvoices(status, patientId);
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, ...invoiceData } = body;

    if (isDbConfigured()) {
      // Calculate totals
      const subtotal = (items || []).reduce(
        (sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price)),
        0
      );
      const taxRate = Number(invoiceData.tax_rate || 0);
      const taxAmount = (subtotal * taxRate) / 100;
      const discount = Number(invoiceData.discount || 0);
      const total = Math.max(0, subtotal + taxAmount - discount);

      // Create invoice (invoice_number handled by DB trigger or manual fallback)
      const countRes = await query('SELECT count(*) as count FROM invoices');
      const invNum = `INV-${String(parseInt(countRes.rows[0].count) + 1).padStart(6, '0')}`;

      const invRes = await query(
        `INSERT INTO invoices (
          invoice_number, patient_id, appointment_id, subtotal,
          tax_rate, tax_amount, discount, total, amount_paid,
          balance_due, status, due_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $8, 'pending', $9, $10)
        RETURNING *`,
        [
          invNum,
          invoiceData.patient_id,
          invoiceData.appointment_id || null,
          subtotal,
          taxRate,
          taxAmount,
          discount,
          total,
          invoiceData.due_date || null,
          invoiceData.notes || null,
        ]
      );

      const invoice = invRes.rows[0];

      // Insert line items
      if (items && items.length > 0) {
        for (const item of items) {
          const itemTotal = Number(item.quantity) * Number(item.unit_price);
          await query(
            `INSERT INTO invoice_items (invoice_id, treatment_id, description, quantity, unit_price, total)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              invoice.id,
              item.treatment_id || null,
              item.description,
              Number(item.quantity) || 1,
              Number(item.unit_price) || 0,
              itemTotal,
            ]
          );
        }
      }

      return NextResponse.json(invoice, { status: 201 });
    }

    const invoice = mockStore.addInvoice(invoiceData, items || []);
    return NextResponse.json(invoice, { status: 201 });
  } catch (err: any) {
    console.error('Error creating invoice:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
