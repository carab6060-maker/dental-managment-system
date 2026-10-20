import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '';
    const doctorId = searchParams.get('doctor_id') || '';
    const patientId = searchParams.get('patient_id') || '';
    const status = searchParams.get('status') || '';

    if (!isSupabaseConfigured()) {
      const data = mockStore.getAppointments(date, status, doctorId, patientId);
      return NextResponse.json({ data });
    }

    const supabase = getServiceSupabase();
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (id, first_name, last_name, phone, email),
        doctors:doctor_id (id, first_name, last_name, specialization),
        treatments:treatment_id (id, name, cost, duration_minutes)
      `)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: true });

    if (date) query = query.eq('appointment_date', date);
    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (patientId) query = query.eq('patient_id', patientId);
    if (status) query = query.eq('status', status);
    if (from) query = query.gte('appointment_date', from);
    if (to) query = query.lte('appointment_date', to);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('Error fetching appointments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isSupabaseConfigured()) {
      // Conflict check in mock
      const existing = mockStore.getAppointments(body.appointment_date, '', body.doctor_id);
      const conflict = existing.find(
        (a) => a.start_time.slice(0, 5) === body.start_time.slice(0, 5) && a.status !== 'cancelled'
      );
      if (conflict) {
        return NextResponse.json(
          { error: 'This time slot is already booked for the selected doctor' },
          { status: 409 }
        );
      }
      const newApt = mockStore.addAppointment(body);
      return NextResponse.json(mockStore.getAppointment(newApt.id), { status: 201 });
    }

    const supabase = getServiceSupabase();

    // Check for scheduling conflicts
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', body.doctor_id)
      .eq('appointment_date', body.appointment_date)
      .eq('start_time', body.start_time)
      .not('status', 'eq', 'cancelled');

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is already booked for the selected doctor' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([body])
      .select(`
        *,
        patients:patient_id (id, first_name, last_name, phone),
        doctors:doctor_id (id, first_name, last_name, specialization),
        treatments:treatment_id (id, name, cost)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Error creating appointment:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
