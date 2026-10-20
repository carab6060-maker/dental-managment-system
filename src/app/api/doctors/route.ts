import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    if (!isSupabaseConfigured()) {
      let data = mockStore.getDoctors();
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(
          (d) =>
            d.first_name.toLowerCase().includes(q) ||
            d.last_name.toLowerCase().includes(q) ||
            d.specialization.toLowerCase().includes(q)
        );
      }
      return NextResponse.json({ data });
    }

    const supabase = getServiceSupabase();
    let query = supabase
      .from('doctors')
      .select('*')
      .eq('is_active', true)
      .order('last_name', { ascending: true });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,specialization.ilike.%${search}%`);
    }

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
      const newDoctor = mockStore.addDoctor(body);
      return NextResponse.json(newDoctor, { status: 201 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('doctors')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
