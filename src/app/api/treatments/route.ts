import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    if (!isSupabaseConfigured()) {
      let data = mockStore.getTreatments();
      if (category) {
        data = data.filter((t) => t.category.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        data = data.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        );
      }
      return NextResponse.json({ data });
    }

    const supabase = getServiceSupabase();
    let query = supabase
      .from('treatments')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
    }
    if (category) {
      query = query.eq('category', category);
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
      const newTreatment = mockStore.addTreatment(body);
      return NextResponse.json(newTreatment, { status: 201 });
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('treatments')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
