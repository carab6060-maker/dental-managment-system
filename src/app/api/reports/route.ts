import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { getTenantContext } from '@/lib/tenantQuery';

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

    const { clinicId } = getTenantContext(request);

    if (isDbConfigured()) {
      if (type === 'revenue') {
        const payRes = clinicId
          ? await query(
              `SELECT 
                p.*,
                json_build_object('invoice_number', i.invoice_number) as invoices,
                json_build_object('first_name', pat.first_name, 'last_name', pat.last_name) as patients
              FROM payments p
              LEFT JOIN invoices i ON p.invoice_id = i.id
              LEFT JOIN patients pat ON p.patient_id = pat.id
              WHERE p.payment_date >= $1 AND p.payment_date <= $2 AND p.clinic_id = $3
              ORDER BY p.payment_date DESC`,
              [dateFrom, dateTo, clinicId]
            )
          : await query(
              `SELECT 
                p.*,
                json_build_object('invoice_number', i.invoice_number) as invoices,
                json_build_object('first_name', pat.first_name, 'last_name', pat.last_name) as patients
              FROM payments p
              LEFT JOIN invoices i ON p.invoice_id = i.id
              LEFT JOIN patients pat ON p.patient_id = pat.id
              WHERE p.payment_date >= $1 AND p.payment_date <= $2
              ORDER BY p.payment_date DESC`,
              [dateFrom, dateTo]
            );

        const payments = payRes.rows;
        const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);

        const byMethod: Record<string, number> = {};
        payments.forEach((p) => {
          byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + Number(p.amount);
        });

        return NextResponse.json({
          type: 'revenue',
          period: { from: dateFrom, to: dateTo },
          totalRevenue,
          paymentCount: payments.length,
          byMethod,
          payments,
        });
      }

      if (type === 'appointments') {
        const aptRes = clinicId
          ? await query(
              `SELECT 
                a.*,
                json_build_object('first_name', p.first_name, 'last_name', p.last_name) as patients,
                json_build_object('first_name', d.first_name, 'last_name', d.last_name, 'specialization', d.specialization) as doctors,
                json_build_object('name', t.name, 'category', t.category) as treatments
              FROM appointments a
              LEFT JOIN patients p ON a.patient_id = p.id
              LEFT JOIN doctors d ON a.doctor_id = d.id
              LEFT JOIN treatments t ON a.treatment_id = t.id
              WHERE a.appointment_date >= $1 AND a.appointment_date <= $2 AND a.clinic_id = $3
              ORDER BY a.appointment_date DESC`,
              [dateFrom, dateTo, clinicId]
            )
          : await query(
              `SELECT 
                a.*,
                json_build_object('first_name', p.first_name, 'last_name', p.last_name) as patients,
                json_build_object('first_name', d.first_name, 'last_name', d.last_name, 'specialization', d.specialization) as doctors,
                json_build_object('name', t.name, 'category', t.category) as treatments
              FROM appointments a
              LEFT JOIN patients p ON a.patient_id = p.id
              LEFT JOIN doctors d ON a.doctor_id = d.id
              LEFT JOIN treatments t ON a.treatment_id = t.id
              WHERE a.appointment_date >= $1 AND a.appointment_date <= $2
              ORDER BY a.appointment_date DESC`,
              [dateFrom, dateTo]
            );

        const appointments = aptRes.rows;
        const statusCount: Record<string, number> = {};
        const byDoctor: Record<string, number> = {};

        appointments.forEach((a) => {
          statusCount[a.status] = (statusCount[a.status] || 0) + 1;
          const docName = a.doctors?.first_name ? `Dr. ${a.doctors.first_name} ${a.doctors.last_name}` : 'Unknown';
          byDoctor[docName] = (byDoctor[docName] || 0) + 1;
        });

        return NextResponse.json({
          type: 'appointments',
          period: { from: dateFrom, to: dateTo },
          totalAppointments: appointments.length,
          statusBreakdown: statusCount,
          byDoctor,
          appointments,
        });
      }

      if (type === 'patients') {
        const patRes = clinicId
          ? await query(
              'SELECT * FROM patients WHERE is_active = true AND created_at >= $1 AND clinic_id = $2 ORDER BY created_at DESC',
              [dateFrom, clinicId]
            )
          : await query(
              'SELECT * FROM patients WHERE is_active = true AND created_at >= $1 ORDER BY created_at DESC',
              [dateFrom]
            );
        return NextResponse.json({
          type: 'patients',
          period: { from: dateFrom, to: dateTo },
          newPatients: patRes.rows.length,
          patients: patRes.rows,
        });
      }

      if (type === 'treatments') {
        const trtRes = clinicId
          ? await query(
              `SELECT 
                t.name,
                t.cost,
                count(a.id) as count
              FROM appointments a
              JOIN treatments t ON a.treatment_id = t.id
              WHERE a.appointment_date >= $1 AND a.appointment_date <= $2 AND a.status = 'completed' AND a.clinic_id = $3
              GROUP BY t.id, t.name, t.cost`,
              [dateFrom, dateTo, clinicId]
            )
          : await query(
              `SELECT 
                t.name,
                t.cost,
                count(a.id) as count
              FROM appointments a
              JOIN treatments t ON a.treatment_id = t.id
              WHERE a.appointment_date >= $1 AND a.appointment_date <= $2 AND a.status = 'completed'
              GROUP BY t.id, t.name, t.cost`,
              [dateFrom, dateTo]
            );

        const byTreatment: Record<string, { count: number; revenue: number }> = {};
        let totalCompleted = 0;

        trtRes.rows.forEach((r) => {
          const count = parseInt(r.count);
          const revenue = count * Number(r.cost);
          byTreatment[r.name] = { count, revenue };
          totalCompleted += count;
        });

        return NextResponse.json({
          type: 'treatments',
          period: { from: dateFrom, to: dateTo },
          totalCompleted,
          byTreatment,
        });
      }

      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    const data = mockStore.getReports(type, dateFrom, dateTo);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Reports error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
