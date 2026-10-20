import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockStore } from '@/lib/mockStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(mockStore.getDashboardStats());
    }

    const supabase = getServiceSupabase();
    const today = new Date().toISOString().split('T')[0];

    // Total patients
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Total doctors
    const { count: totalDoctors } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Today's appointments
    const { data: todayAppointments, count: todayAppointmentCount } = await supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id (first_name, last_name),
        doctors:doctor_id (first_name, last_name, specialization),
        treatments:treatment_id (name)
      `, { count: 'exact' })
      .eq('appointment_date', today)
      .not('status', 'eq', 'cancelled')
      .order('start_time', { ascending: true });

    // This month's revenue
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const { data: monthPayments } = await supabase
      .from('payments')
      .select('amount')
      .gte('payment_date', firstOfMonth);

    const monthlyRevenue = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // Pending invoices
    const { count: pendingInvoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'partial', 'overdue']);

    // Total outstanding balance
    const { data: outstandingData } = await supabase
      .from('invoices')
      .select('balance_due')
      .in('status', ['pending', 'partial', 'overdue']);

    const totalOutstanding = outstandingData?.reduce((sum, inv) => sum + Number(inv.balance_due), 0) || 0;

    // Upcoming appointments (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const { count: upcomingCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gt('appointment_date', today)
      .lte('appointment_date', nextWeekStr)
      .not('status', 'eq', 'cancelled');

    // Recent patients (last 5)
    const { data: recentPatients } = await supabase
      .from('patients')
      .select('id, first_name, last_name, phone, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    // Monthly revenue chart data (last 6 months)
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: mPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', monthStart)
        .lte('payment_date', monthEnd);

      const total = mPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const monthName = d.toLocaleString('default', { month: 'short' });
      revenueByMonth.push({ month: monthName, revenue: total });
    }

    // Appointment status breakdown
    const { data: allAppointments } = await supabase
      .from('appointments')
      .select('status')
      .gte('appointment_date', firstOfMonth);

    const statusBreakdown: Record<string, number> = {};
    allAppointments?.forEach((a) => {
      statusBreakdown[a.status] = (statusBreakdown[a.status] || 0) + 1;
    });

    return NextResponse.json({
      totalPatients: totalPatients || 0,
      totalDoctors: totalDoctors || 0,
      todayAppointments: todayAppointmentCount || 0,
      todayAppointmentsList: todayAppointments || [],
      monthlyRevenue,
      pendingInvoices: pendingInvoices || 0,
      totalOutstanding,
      upcomingAppointments: upcomingCount || 0,
      recentPatients: recentPatients || [],
      revenueByMonth,
      appointmentStatusBreakdown: statusBreakdown,
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
