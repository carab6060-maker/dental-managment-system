import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { getTenantContext } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { clinicId } = getTenantContext(request);

    if (isDbConfigured()) {
      const today = new Date().toISOString().split('T')[0];
      const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Patients count
      const patRes = clinicId
        ? await query('SELECT count(*) as count FROM patients WHERE is_active = true AND clinic_id = $1', [clinicId])
        : await query('SELECT count(*) as count FROM patients WHERE is_active = true');
      const totalPatients = parseInt(patRes.rows[0].count);

      // Doctors count
      const docRes = clinicId
        ? await query('SELECT count(*) as count FROM doctors WHERE is_active = true AND clinic_id = $1', [clinicId])
        : await query('SELECT count(*) as count FROM doctors WHERE is_active = true');
      const totalDoctors = parseInt(docRes.rows[0].count);

      // Today's appointments
      const todayAptRes = clinicId
        ? await query(
            `SELECT 
              a.*,
              json_build_object('first_name', p.first_name, 'last_name', p.last_name) as patients,
              json_build_object('first_name', d.first_name, 'last_name', d.last_name, 'specialization', d.specialization) as doctors,
              json_build_object('name', t.name) as treatments
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN treatments t ON a.treatment_id = t.id
            WHERE a.appointment_date = $1 AND a.status != 'cancelled' AND a.clinic_id = $2
            ORDER BY a.start_time ASC`,
            [today, clinicId]
          )
        : await query(
            `SELECT 
              a.*,
              json_build_object('first_name', p.first_name, 'last_name', p.last_name) as patients,
              json_build_object('first_name', d.first_name, 'last_name', d.last_name, 'specialization', d.specialization) as doctors,
              json_build_object('name', t.name) as treatments
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN treatments t ON a.treatment_id = t.id
            WHERE a.appointment_date = $1 AND a.status != 'cancelled'
            ORDER BY a.start_time ASC`,
            [today]
          );
      const todayAppointmentsList = todayAptRes.rows;
      const todayAppointments = todayAppointmentsList.length;

      // This month's revenue
      const monthPayRes = clinicId
        ? await query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date >= $1 AND clinic_id = $2',
            [firstOfMonth, clinicId]
          )
        : await query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date >= $1',
            [firstOfMonth]
          );
      const monthlyRevenue = parseFloat(monthPayRes.rows[0].total) || 0;

      // Pending invoices
      const pendingInvRes = clinicId
        ? await query(
            "SELECT count(*) as count, COALESCE(SUM(balance_due), 0) as outstanding FROM invoices WHERE status IN ('pending', 'partial', 'overdue') AND clinic_id = $1",
            [clinicId]
          )
        : await query(
            "SELECT count(*) as count, COALESCE(SUM(balance_due), 0) as outstanding FROM invoices WHERE status IN ('pending', 'partial', 'overdue')"
          );
      const pendingInvoices = parseInt(pendingInvRes.rows[0].count);
      const totalOutstanding = parseFloat(pendingInvRes.rows[0].outstanding) || 0;

      // Upcoming appointments (next 7 days)
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const upcomingRes = clinicId
        ? await query(
            "SELECT count(*) as count FROM appointments WHERE appointment_date > $1 AND appointment_date <= $2 AND status != 'cancelled' AND clinic_id = $3",
            [today, nextWeek, clinicId]
          )
        : await query(
            "SELECT count(*) as count FROM appointments WHERE appointment_date > $1 AND appointment_date <= $2 AND status != 'cancelled'",
            [today, nextWeek]
          );
      const upcomingAppointments = parseInt(upcomingRes.rows[0].count);

      // Recent patients (last 5)
      const recentPatRes = clinicId
        ? await query(
            'SELECT id, first_name, last_name, phone, created_at FROM patients WHERE is_active = true AND clinic_id = $1 ORDER BY created_at DESC LIMIT 5',
            [clinicId]
          )
        : await query(
            'SELECT id, first_name, last_name, phone, created_at FROM patients WHERE is_active = true ORDER BY created_at DESC LIMIT 5'
          );
      const recentPatients = recentPatRes.rows;

      // 6 month revenue trend
      const revenueByMonth = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
        const monthName = d.toLocaleString('default', { month: 'short' });

        const revRes = clinicId
          ? await query(
              'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date >= $1 AND payment_date <= $2 AND clinic_id = $3',
              [mStart, mEnd, clinicId]
            )
          : await query(
              'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_date >= $1 AND payment_date <= $2',
              [mStart, mEnd]
            );
        revenueByMonth.push({ month: monthName, revenue: parseFloat(revRes.rows[0].total) || 0 });
      }

      // Appointment status breakdown
      const aptStatusRes = clinicId
        ? await query('SELECT status, count(*) as count FROM appointments WHERE clinic_id = $1 GROUP BY status', [clinicId])
        : await query('SELECT status, count(*) as count FROM appointments GROUP BY status');
      const appointmentStatusBreakdown: Record<string, number> = {};
      aptStatusRes.rows.forEach(r => {
        appointmentStatusBreakdown[r.status] = parseInt(r.count);
      });

      return NextResponse.json({
        totalPatients,
        totalDoctors,
        todayAppointments,
        todayAppointmentsList,
        monthlyRevenue,
        pendingInvoices,
        totalOutstanding,
        upcomingAppointments,
        recentPatients,
        revenueByMonth,
        appointmentStatusBreakdown,
      });
    }

    return NextResponse.json(mockStore.getDashboardStats());
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
