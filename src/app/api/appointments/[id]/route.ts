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
      const apt = mockStore.getAppointment(params.id);
      if (!apt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      return NextResponse.json(apt);
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (id, first_name, last_name, phone, email),
        doctors:doctor_id (id, first_name, last_name, specialization),
        treatments:treatment_id (id, name, cost, duration_minutes)
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
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
      const updated = mockStore.updateAppointment(params.id, body);
      if (!updated) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      return NextResponse.json(updated);
    }

    const supabase = getServiceSupabase();
    body.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('appointments')
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isSupabaseConfigured()) {
      mockStore.updateAppointment(params.id, { status: 'cancelled' });
      return NextResponse.json({ message: 'Appointment cancelled' });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Appointment cancelled' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
