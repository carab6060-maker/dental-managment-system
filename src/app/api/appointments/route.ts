import { NextRequest, NextResponse } from 'next/server';
import { query, isDbConfigured } from '@/lib/db';
import { mockStore } from '@/lib/mockStore';
import { getTenantContext, getDefaultClinicId } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '';
    const doctorId = searchParams.get('doctor_id') || '';
    const patientId = searchParams.get('patient_id') || '';
    const status = searchParams.get('status') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const { clinicId } = getTenantContext(request);

    if (isDbConfigured()) {
      let q = `
        SELECT 
          a.*,
          json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'phone', p.phone, 'email', p.email) as patients,
          json_build_object('id', d.id, 'first_name', d.first_name, 'last_name', d.last_name, 'specialization', d.specialization) as doctors,
          json_build_object('id', t.id, 'name', t.name, 'cost', t.cost, 'duration_minutes', t.duration_minutes) as treatments
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN treatments t ON a.treatment_id = t.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (clinicId) {
        params.push(clinicId);
        q += ` AND a.clinic_id = $${params.length}`;
      }

      if (date) {
        params.push(date);
        q += ` AND a.appointment_date = $${params.length}`;
      }
      if (doctorId) {
        params.push(doctorId);
        q += ` AND a.doctor_id = $${params.length}`;
      }
      if (patientId) {
        params.push(patientId);
        q += ` AND a.patient_id = $${params.length}`;
      }
      if (status) {
        params.push(status);
        q += ` AND a.status = $${params.length}`;
      }
      if (from) {
        params.push(from);
        q += ` AND a.appointment_date >= $${params.length}`;
      }
      if (to) {
        params.push(to);
        q += ` AND a.appointment_date <= $${params.length}`;
      }

      q += ' ORDER BY a.appointment_date DESC, a.start_time ASC';
      const res = await query(q, params);
      return NextResponse.json({ data: res.rows });
    }

    const data = mockStore.getAppointments(date, status, doctorId, patientId);
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('Error fetching appointments:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinicId } = getTenantContext(request);
    const targetClinicId = body.clinic_id || clinicId || (await getDefaultClinicId());

    let patientId = body.patient_id;
    let doctorId = body.doctor_id;
    const appointmentDate = body.appointment_date || new Date().toISOString().split('T')[0];
    const startTime = body.start_time || '09:00';

    if (isDbConfigured()) {
      // If a new patient object was provided directly
      if (!patientId && body.new_patient) {
        const np = body.new_patient;
        let pDob = np.date_of_birth || null;
        if (!pDob && np.age) {
          const birthYear = new Date().getFullYear() - parseInt(np.age);
          if (!isNaN(birthYear)) pDob = `${birthYear}-01-01`;
        }
        let fName = np.first_name?.trim() || '';
        let lName = np.last_name?.trim() || '';
        if (!lName && fName.includes(' ')) {
          const parts = fName.split(/\s+/);
          fName = parts[0];
          lName = parts.slice(1).join(' ');
        } else if (!lName) {
          lName = '-';
        }

        const newPatRes = await query(
          `INSERT INTO patients (first_name, last_name, phone, date_of_birth, clinic_id)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [fName || 'Patient', lName, np.phone || '', pDob, targetClinicId]
        );
        if (newPatRes.rows.length > 0) {
          patientId = newPatRes.rows[0].id;
        }
      }

      // If doctor is not specified, auto-select first active doctor
      if (!doctorId) {
        const docRes = await query(
          `SELECT id FROM doctors WHERE clinic_id = $1 AND is_active = true ORDER BY created_at ASC LIMIT 1`,
          [targetClinicId]
        );
        if (docRes.rows.length > 0) {
          doctorId = docRes.rows[0].id;
        } else {
          const anyDoc = await query(`SELECT id FROM doctors WHERE is_active = true ORDER BY created_at ASC LIMIT 1`);
          if (anyDoc.rows.length > 0) doctorId = anyDoc.rows[0].id;
        }
      }

      // Conflict check (only if doctorId is present)
      if (doctorId) {
        const conflicts = await query(
          `SELECT id FROM appointments 
           WHERE doctor_id = $1 AND appointment_date = $2 AND start_time = $3 AND status != 'cancelled'`,
          [doctorId, appointmentDate, startTime]
        );

        if (conflicts.rows.length > 0) {
          return NextResponse.json(
            { error: 'This time slot is already booked for the doctor' },
            { status: 409 }
          );
        }
      }

      const res = await query(
        `INSERT INTO appointments (
          patient_id, doctor_id, treatment_id, appointment_date, start_time, end_time, status, notes, clinic_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          patientId,
          doctorId,
          body.treatment_id || null,
          appointmentDate,
          startTime,
          body.end_time || null,
          body.status || 'scheduled',
          body.notes || null,
          targetClinicId,
        ]
      );

      // Fetch with relations
      const detail = await query(
        `SELECT 
          a.*,
          json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'phone', p.phone) as patients,
          json_build_object('id', d.id, 'first_name', d.first_name, 'last_name', d.last_name, 'specialization', d.specialization) as doctors,
          json_build_object('id', t.id, 'name', t.name, 'cost', t.cost) as treatments
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN treatments t ON a.treatment_id = t.id
        WHERE a.id = $1`,
        [res.rows[0].id]
      );

      return NextResponse.json(detail.rows[0], { status: 201 });
    }

    const existing = mockStore.getAppointments(appointmentDate, '', doctorId);
    const conflict = existing.find(
      (a) => a.start_time.slice(0, 5) === startTime.slice(0, 5) && a.status !== 'cancelled'
    );
    if (conflict) {
      return NextResponse.json(
        { error: 'This time slot is already booked for the selected doctor' },
        { status: 409 }
      );
    }
    const newApt = mockStore.addAppointment({
      ...body,
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: appointmentDate,
      start_time: startTime,
    });
    return NextResponse.json(mockStore.getAppointment(newApt.id), { status: 201 });
  } catch (err: any) {
    console.error('Error creating appointment:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
