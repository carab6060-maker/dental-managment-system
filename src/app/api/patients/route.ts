import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!isSupabaseConfigured()) {
      const data = mockStore.getPatients(search, limit);
      return NextResponse.json({ data, count: data.length, page, limit });
    }

    const supabase = getServiceSupabase();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ data, count, page, limit });
  } catch (err: any) {
    console.error('Error fetching patients:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isSupabaseConfigured()) {
      const newPatient = mockStore.addPatient(body);
      return NextResponse.json(newPatient, { status: 201 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('patients')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Error creating patient:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
