import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isSupabaseConfigured()) {
      const inv = mockStore.getInvoice(params.id);
      if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      return NextResponse.json(inv);
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patients:patient_id (id, first_name, last_name, phone, email),
        invoice_items (id, description, quantity, unit_price, total, treatment_id),
        appointments:appointment_id (id, appointment_date, start_time)
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;

    // Also get payments for this invoice
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', params.id)
      .order('payment_date', { ascending: false });

    return NextResponse.json({ ...data, payments: payments || [] });
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

    if (!isSupabaseConfigured()) {
      const updated = mockStore.updateInvoice(params.id, body);
      if (!updated) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      return NextResponse.json(updated);
    }

    const supabase = getServiceSupabase();
    body.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('invoices')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
