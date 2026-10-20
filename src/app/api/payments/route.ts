import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoice_id') || '';
    const patientId = searchParams.get('patient_id') || '';

    if (!isSupabaseConfigured()) {
      const data = mockStore.getPayments(invoiceId, patientId);
      return NextResponse.json({ data });
    }

    const supabase = getServiceSupabase();
    let query = supabase
      .from('payments')
      .select(`
        *,
        invoices:invoice_id (id, invoice_number, total, balance_due, status),
        patients:patient_id (id, first_name, last_name)
      `)
      .order('payment_date', { ascending: false });

    if (invoiceId) query = query.eq('invoice_id', invoiceId);
    if (patientId) query = query.eq('patient_id', patientId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isSupabaseConfigured()) {
      const inv = mockStore.getInvoice(body.invoice_id);
      if (!inv) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }
      if (Number(body.amount) > Number(inv.balance_due)) {
        return NextResponse.json(
          { error: `Payment amount ($${body.amount}) exceeds balance due ($${inv.balance_due})` },
          { status: 400 }
        );
      }
      const newPay = mockStore.addPayment(body);
      return NextResponse.json(newPay, { status: 201 });
    }

    const supabase = getServiceSupabase();

    // Validate payment doesn't exceed balance
    const { data: invoice } = await supabase
      .from('invoices')
      .select('balance_due, total, amount_paid')
      .eq('id', body.invoice_id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (body.amount > invoice.balance_due) {
      return NextResponse.json(
        { error: `Payment amount ($${body.amount}) exceeds balance due ($${invoice.balance_due})` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('payments')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Error creating payment:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
