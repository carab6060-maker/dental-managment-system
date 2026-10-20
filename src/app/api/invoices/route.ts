import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const patientId = searchParams.get('patient_id') || '';

    if (!isSupabaseConfigured()) {
      const data = mockStore.getInvoices(status, patientId);
      return NextResponse.json({ data });
    }

    const supabase = getServiceSupabase();

    let query = supabase
      .from('invoices')
      .select(`
        *,
        patients:patient_id (id, first_name, last_name, phone, email),
        invoice_items (id, description, quantity, unit_price, total, treatment_id)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
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
    const { items, ...invoiceData } = body;

    if (!isSupabaseConfigured()) {
      const invoice = mockStore.addInvoice(invoiceData, items || []);
      return NextResponse.json(invoice, { status: 201 });
    }

    const supabase = getServiceSupabase();

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = subtotal * (invoiceData.tax_rate || 0) / 100;
    const total = subtotal + taxAmount - (invoiceData.discount || 0);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        ...invoiceData,
        subtotal,
        tax_amount: taxAmount,
        total,
        balance_due: total,
        amount_paid: 0,
      }])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice items
    if (items && items.length > 0) {
      const invoiceItems = items.map((item: any) => ({
        invoice_id: invoice.id,
        treatment_id: item.treatment_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (err: any) {
    console.error('Error creating invoice:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
