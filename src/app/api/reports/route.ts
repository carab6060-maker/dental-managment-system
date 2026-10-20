import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'revenue';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const dateFrom = from || thirtyDaysAgo;
    const dateTo = to || today;

    if (!isSupabaseConfigured()) {
      const data = mockStore.getReports(type, dateFrom, dateTo);
      return NextResponse.json(data);
    }

    const supabase = getServiceSupabase();

    if (type === 'revenue') {
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          *,
          invoices:invoice_id (invoice_number),
          patients:patient_id (first_name, last_name)
        `)
        .gte('payment_date', dateFrom)
        .lte('payment_date', dateTo)
        .order('payment_date', { ascending: false });

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Group by payment method
      const byMethod: Record<string, number> = {};
      payments?.forEach((p) => {
        byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + Number(p.amount);
      });

      return NextResponse.json({
        type: 'revenue',
        period: { from: dateFrom, to: dateTo },
        totalRevenue,
        paymentCount: payments?.length || 0,
        byMethod,
        payments: payments || [],
      });
    }

    if (type === 'appointments') {
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (first_name, last_name),
          doctors:doctor_id (first_name, last_name, specialization),
          treatments:treatment_id (name, category)
        `)
        .gte('appointment_date', dateFrom)
        .lte('appointment_date', dateTo)
        .order('appointment_date', { ascending: false });

      const statusCount: Record<string, number> = {};
      const byDoctor: Record<string, number> = {};
      appointments?.forEach((a) => {
        statusCount[a.status] = (statusCount[a.status] || 0) + 1;
        const docName = a.doctors ? `Dr. ${(a.doctors as any).first_name} ${(a.doctors as any).last_name}` : 'Unknown';
        byDoctor[docName] = (byDoctor[docName] || 0) + 1;
      });

      return NextResponse.json({
        type: 'appointments',
        period: { from: dateFrom, to: dateTo },
        totalAppointments: appointments?.length || 0,
        statusBreakdown: statusCount,
        byDoctor,
        appointments: appointments || [],
      });
    }

    if (type === 'patients') {
      const { data: patients } = await supabase
        .from('patients')
        .select('*')
        .eq('is_active', true)
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        type: 'patients',
        period: { from: dateFrom, to: dateTo },
        newPatients: patients?.length || 0,
        patients: patients || [],
      });
    }

    if (type === 'treatments') {
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          treatment_id,
          treatments:treatment_id (name, category, cost)
        `)
        .gte('appointment_date', dateFrom)
        .lte('appointment_date', dateTo)
        .eq('status', 'completed');

      const treatmentCount: Record<string, { count: number; revenue: number }> = {};
      appointments?.forEach((a) => {
        if (a.treatments) {
          const name = (a.treatments as any).name;
          if (!treatmentCount[name]) {
            treatmentCount[name] = { count: 0, revenue: 0 };
          }
          treatmentCount[name].count += 1;
          treatmentCount[name].revenue += Number((a.treatments as any).cost);
        }
      });

      return NextResponse.json({
        type: 'treatments',
        period: { from: dateFrom, to: dateTo },
        totalCompleted: appointments?.length || 0,
        byTreatment: treatmentCount,
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (err: any) {
    console.error('Reports error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
