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
      const treatment = mockStore.getTreatment(params.id);
      if (!treatment) return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
      return NextResponse.json(treatment);
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });

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
      const updated = mockStore.updateTreatment(params.id, body);
      if (!updated) return NextResponse.json({ error: 'Treatment not found' }, { status: 404 });
      return NextResponse.json(updated);
    }

    const supabase = getServiceSupabase();
    body.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('treatments')
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
      mockStore.deleteTreatment(params.id);
      return NextResponse.json({ message: 'Treatment deleted' });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('treatments')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Treatment deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
