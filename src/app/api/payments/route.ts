import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { getTenantContext, getDefaultClinicId } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoice_id') || '';
    const patientId = searchParams.get('patient_id') || '';
    const { clinicId } = getTenantContext(request);

    if (isDbConfigured()) {
      let q = `
        SELECT 
          p.*,
          json_build_object('id', i.id, 'invoice_number', i.invoice_number, 'total', i.total, 'balance_due', i.balance_due, 'status', i.status) as invoices,
          json_build_object('id', pat.id, 'first_name', pat.first_name, 'last_name', pat.last_name) as patients
        FROM payments p
        LEFT JOIN invoices i ON p.invoice_id = i.id
        LEFT JOIN patients pat ON p.patient_id = pat.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (clinicId) {
        params.push(clinicId);
        q += ` AND p.clinic_id = $${params.length}`;
      }

      if (invoiceId) {
        params.push(invoiceId);
        q += ` AND p.invoice_id = $${params.length}`;
      }
      if (patientId) {
        params.push(patientId);
        q += ` AND p.patient_id = $${params.length}`;
      }

      q += ' ORDER BY p.payment_date DESC, p.created_at DESC';
      const res = await query(q, params);
      return NextResponse.json({ data: res.rows });
    }

    const data = mockStore.getPayments(invoiceId, patientId);
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
      // Validate payment doesn't exceed balance
      const invRes = await query('SELECT balance_due, total, amount_paid FROM invoices WHERE id = $1', [body.invoice_id]);
      if (invRes.rows.length === 0) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const invoice = invRes.rows[0];
      const amount = Number(body.amount);

      if (amount > Number(invoice.balance_due)) {
        return NextResponse.json(
          { error: `Payment amount ($${amount}) exceeds balance due ($${invoice.balance_due})` },
          { status: 400 }
        );
      }

      const payRes = await query(
        `INSERT INTO payments (
          invoice_id, patient_id, amount, payment_method, payment_date, reference_number, notes, clinic_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          body.invoice_id,
          body.patient_id,
          amount,
          body.payment_method,
          body.payment_date || new Date().toISOString().split('T')[0],
          body.reference_number || null,
          body.notes || null,
          targetClinicId,
        ]
      );

      // Explicitly update invoice balance
      const newPaid = Number(invoice.amount_paid) + amount;
      const newBalance = Math.max(0, Number(invoice.total) - newPaid);
      const newStatus = newBalance <= 0 ? 'paid' : 'partial';

      await query(
        `UPDATE invoices SET
          amount_paid = $1,
          balance_due = $2,
          status = $3,
          updated_at = NOW()
        WHERE id = $4`,
        [newPaid, newBalance, newStatus, body.invoice_id]
      );

      return NextResponse.json(payRes.rows[0], { status: 201 });
    }

    const inv = mockStore.getInvoice(body.invoice_id);
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (Number(body.amount) > Number(inv.balance_due)) {
      return NextResponse.json(
        { error: `Payment amount ($${body.amount}) exceeds balance due ($${inv.balance_due})` },
        { status: 400 }
      );
    }
    const newPay = mockStore.addPayment(body);
    return NextResponse.json(newPay, { status: 201 });
  } catch (err: any) {
    console.error('Error creating payment:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
