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
      const doc = mockStore.getDoctor(params.id);
      if (!doc) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      return NextResponse.json(doc);
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

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
      const updated = mockStore.updateDoctor(params.id, body);
      if (!updated) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      return NextResponse.json(updated);
    }

    const supabase = getServiceSupabase();
    body.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('doctors')
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
      mockStore.deleteDoctor(params.id);
      return NextResponse.json({ message: 'Doctor deleted' });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('doctors')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Doctor deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
