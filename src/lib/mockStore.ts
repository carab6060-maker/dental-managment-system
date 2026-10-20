// In-Memory Data Store for when Database setup is postponed or offline
// Fully reactive with realistic dental clinic data, CRUD operations, relationships, and analytics

export interface MockDoctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialization: string;
  license_number: string;
  working_days: string;
  working_hours_start: string;
  working_hours_end: string;
  consultation_fee: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface MockPatient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  email: string;
  phone: string;
  address: string;
  city: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  blood_group: string;
  allergies: string;
  medical_history: string;
  insurance_provider: string;
  insurance_number: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface MockTreatment {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  cost: number;
  is_active: boolean;
  created_at: string;
}

export interface MockAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  treatment_id?: string;
  appointment_date: string;
  start_time: string;
  end_time?: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  created_at: string;
}

export interface MockInvoiceItem {
  id: string;
  invoice_id: string;
  treatment_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface MockInvoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  appointment_id?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string;
  notes?: string;
  created_at: string;
}

export interface MockPayment {
  id: string;
  invoice_id: string;
  patient_id: string;
  amount: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'insurance' | 'other';
  payment_date: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

// Initial Data
const initialDoctors: MockDoctor[] = [
  {
    id: 'doc-1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@dental.com',
    phone: '+1 (555) 234-5678',
    specialization: 'Orthodontics',
    license_number: 'DEN-94821',
    working_days: 'Mon,Tue,Wed,Thu',
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    consultation_fee: 100,
    is_active: true,
    notes: 'Specialist in clear aligners and adolescent orthodontics',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 'doc-2',
    first_name: 'Michael',
    last_name: 'Chang',
    email: 'michael.chang@dental.com',
    phone: '+1 (555) 345-6789',
    specialization: 'Implantology',
    license_number: 'DEN-71029',
    working_days: 'Tue,Wed,Thu,Fri',
    working_hours_start: '08:30',
    working_hours_end: '16:30',
    consultation_fee: 150,
    is_active: true,
    notes: 'Expert in dental implants and surgical restorations',
    created_at: '2026-01-12T09:00:00Z',
  },
  {
    id: 'doc-3',
    first_name: 'Emily',
    last_name: 'Rodriguez',
    email: 'emily.rodriguez@dental.com',
    phone: '+1 (555) 456-7890',
    specialization: 'General Dentistry',
    license_number: 'DEN-88231',
    working_days: 'Mon,Tue,Wed,Thu,Fri',
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    consultation_fee: 75,
    is_active: true,
    notes: 'Preventive care, fillings, and restorative treatments',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'doc-4',
    first_name: 'David',
    last_name: 'Kim',
    email: 'david.kim@dental.com',
    phone: '+1 (555) 567-8901',
    specialization: 'Endodontics',
    license_number: 'DEN-65490',
    working_days: 'Mon,Wed,Fri',
    working_hours_start: '10:00',
    working_hours_end: '16:00',
    consultation_fee: 120,
    is_active: true,
    notes: 'Root canal therapy specialist with microscopic endodontics',
    created_at: '2026-01-20T11:00:00Z',
  },
];

const initialTreatments: MockTreatment[] = [
  { id: 'trt-1', name: 'Dental Cleaning', category: 'Preventive', description: 'Professional teeth cleaning and plaque removal', duration_minutes: 45, cost: 75, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'trt-2', name: 'Comprehensive Exam', category: 'Preventive', description: 'Complete dental and oral health examination', duration_minutes: 30, cost: 50, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'trt-3', name: 'Panoramic X-Ray', category: 'Diagnostic', description: 'Full mouth panoramic digital imaging', duration_minutes: 15, cost: 35, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'trt-4', name: 'Tooth Filling (Composite)', category: 'Restorative', description: 'Tooth-colored aesthetic composite resin filling', duration_minutes: 45, cost: 150, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'trt-5', name: 'Root Canal Therapy', category: 'Endodontic', description: 'Full root canal treatment with canal disinfection', duration_minutes: 90, cost: 800, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'trt-6', name: 'Tooth Extraction (Simple)', category: 'Oral Surgery', description: 'Comfortable simple tooth extraction', duration_minutes: 30, cost: 120, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'trt-7', name: 'Porcelain Crown', category: 'Restorative', description: 'Custom fitted high-grade porcelain dental crown', duration_minutes: 60, cost: 900, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'trt-8', name: 'Teeth Whitening', category: 'Cosmetic', description: 'In-office professional laser teeth whitening', duration_minutes: 60, cost: 350, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'trt-9', name: 'Dental Implant', category: 'Implantology', description: 'Titanium root replacement and implant fixture', duration_minutes: 120, cost: 2500, is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'trt-10', name: 'Clear Aligners Consultation', category: 'Orthodontic', description: '3D scan and alignment treatment plan', duration_minutes: 45, cost: 100, is_active: true, created_at: '2026-01-01T00:00:00Z' },
];

const initialPatients: MockPatient[] = [
  {
    id: 'pat-1',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1988-04-12',
    gender: 'male',
    email: 'john.doe@example.com',
    phone: '+1 (555) 111-2222',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '+1 (555) 111-3333',
    blood_group: 'O+',
    allergies: 'Penicillin',
    medical_history: 'Mild asthma, seasonal allergies',
    insurance_provider: 'Blue Cross Dental',
    insurance_number: 'BC-882910',
    notes: 'Prefers morning appointments',
    is_active: true,
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'pat-2',
    first_name: 'Alice',
    last_name: 'Smith',
    date_of_birth: '1995-09-24',
    gender: 'female',
    email: 'alice.smith@example.com',
    phone: '+1 (555) 222-3333',
    address: '100 Main Street',
    city: 'Springfield',
    emergency_contact_name: 'Bob Smith',
    emergency_contact_phone: '+1 (555) 222-4444',
    blood_group: 'A+',
    allergies: 'None',
    medical_history: 'None',
    insurance_provider: 'Delta Dental',
    insurance_number: 'DD-447192',
    notes: 'Interested in teeth whitening and aligners',
    is_active: true,
    created_at: '2026-02-15T11:30:00Z',
  },
  {
    id: 'pat-3',
    first_name: 'Robert',
    last_name: 'Miller',
    date_of_birth: '1976-11-03',
    gender: 'male',
    email: 'robert.m@example.com',
    phone: '+1 (555) 333-4444',
    address: '45 Oak Ridge Lane',
    city: 'Springfield',
    emergency_contact_name: 'Mary Miller',
    emergency_contact_phone: '+1 (555) 333-5555',
    blood_group: 'B+',
    allergies: 'Latex',
    medical_history: 'Hypertension (managed)',
    insurance_provider: 'MetLife Dental',
    insurance_number: 'ML-992014',
    notes: 'Sensitive to cold temperatures',
    is_active: true,
    created_at: '2026-03-01T09:15:00Z',
  },
  {
    id: 'pat-4',
    first_name: 'Sophia',
    last_name: 'Taylor',
    date_of_birth: '2001-07-18',
    gender: 'female',
    email: 'sophia.t@example.com',
    phone: '+1 (555) 444-5555',
    address: '12 River Road',
    city: 'Springfield',
    emergency_contact_name: 'David Taylor',
    emergency_contact_phone: '+1 (555) 444-6666',
    blood_group: 'O-',
    allergies: 'Sulfa drugs',
    medical_history: 'None',
    insurance_provider: 'Aetna Dental',
    insurance_number: 'AET-102938',
    notes: 'Regular 6-month cleaning routine',
    is_active: true,
    created_at: '2026-03-10T14:20:00Z',
  },
];

const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const initialAppointments: MockAppointment[] = [
  {
    id: 'apt-1',
    patient_id: 'pat-1',
    doctor_id: 'doc-3',
    treatment_id: 'trt-1',
    appointment_date: todayStr,
    start_time: '09:30:00',
    end_time: '10:15:00',
    status: 'completed',
    notes: 'Routine biannual checkup & polish',
    created_at: '2026-03-15T09:00:00Z',
  },
  {
    id: 'apt-2',
    patient_id: 'pat-2',
    doctor_id: 'doc-1',
    treatment_id: 'trt-10',
    appointment_date: todayStr,
    start_time: '11:00:00',
    end_time: '11:45:00',
    status: 'in-progress',
    notes: 'Aligner progress check',
    created_at: '2026-03-18T10:00:00Z',
  },
  {
    id: 'apt-3',
    patient_id: 'pat-3',
    doctor_id: 'doc-4',
    treatment_id: 'trt-5',
    appointment_date: todayStr,
    start_time: '14:00:00',
    end_time: '15:30:00',
    status: 'scheduled',
    notes: 'Molar root canal session 2',
    created_at: '2026-03-19T11:00:00Z',
  },
  {
    id: 'apt-4',
    patient_id: 'pat-4',
    doctor_id: 'doc-2',
    treatment_id: 'trt-9',
    appointment_date: tomorrowStr,
    start_time: '10:00:00',
    end_time: '11:30:00',
    status: 'confirmed',
    notes: 'Implant post placement',
    created_at: '2026-03-20T12:00:00Z',
  },
];

const initialInvoices: MockInvoice[] = [
  {
    id: 'inv-1',
    invoice_number: 'INV-000001',
    patient_id: 'pat-1',
    appointment_id: 'apt-1',
    subtotal: 125,
    tax_rate: 0,
    tax_amount: 0,
    discount: 0,
    total: 125,
    amount_paid: 125,
    balance_due: 0,
    status: 'paid',
    due_date: todayStr,
    notes: 'Paid at front desk via debit card',
    created_at: '2026-03-15T10:30:00Z',
  },
  {
    id: 'inv-2',
    invoice_number: 'INV-000002',
    patient_id: 'pat-3',
    appointment_id: 'apt-3',
    subtotal: 800,
    tax_rate: 0,
    tax_amount: 0,
    discount: 50,
    total: 750,
    amount_paid: 400,
    balance_due: 350,
    status: 'partial',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: 'First installment paid, second installment due in 2 weeks',
    created_at: '2026-03-19T15:30:00Z',
  },
  {
    id: 'inv-3',
    invoice_number: 'INV-000003',
    patient_id: 'pat-2',
    appointment_id: 'apt-2',
    subtotal: 350,
    tax_rate: 0,
    tax_amount: 0,
    discount: 0,
    total: 350,
    amount_paid: 0,
    balance_due: 350,
    status: 'pending',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: 'Pending insurance verification',
    created_at: '2026-03-20T11:00:00Z',
  },
];

const initialInvoiceItems: MockInvoiceItem[] = [
  { id: 'item-1', invoice_id: 'inv-1', treatment_id: 'trt-1', description: 'Dental Cleaning', quantity: 1, unit_price: 75, total: 75 },
  { id: 'item-2', invoice_id: 'inv-1', treatment_id: 'trt-2', description: 'Comprehensive Exam', quantity: 1, unit_price: 50, total: 50 },
  { id: 'item-3', invoice_id: 'inv-2', treatment_id: 'trt-5', description: 'Root Canal Therapy', quantity: 1, unit_price: 800, total: 800 },
  { id: 'item-4', invoice_id: 'inv-3', treatment_id: 'trt-8', description: 'Teeth Whitening', quantity: 1, unit_price: 350, total: 350 },
];

const initialPayments: MockPayment[] = [
  {
    id: 'pay-1',
    invoice_id: 'inv-1',
    patient_id: 'pat-1',
    amount: 125,
    payment_method: 'debit_card',
    payment_date: todayStr,
    reference_number: 'POS-88912',
    notes: 'Full payment completed at clinic checkout',
    created_at: '2026-03-15T10:35:00Z',
  },
  {
    id: 'pay-2',
    invoice_id: 'inv-2',
    patient_id: 'pat-3',
    amount: 400,
    payment_method: 'credit_card',
    payment_date: yesterdayStr,
    reference_number: 'TXN-49021',
    notes: '50% deposit for endodontic therapy',
    created_at: '2026-03-19T15:40:00Z',
  },
];

// In-Memory state store instance
class MockStore {
  doctors: MockDoctor[] = [...initialDoctors];
  patients: MockPatient[] = [...initialPatients];
  treatments: MockTreatment[] = [...initialTreatments];
  appointments: MockAppointment[] = [...initialAppointments];
  invoices: MockInvoice[] = [...initialInvoices];
  invoiceItems: MockInvoiceItem[] = [...initialInvoiceItems];
  payments: MockPayment[] = [...initialPayments];

  // Patients
  getPatients(search = '', limit = 100) {
    let list = this.patients.filter((p) => p.is_active);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }
    return list.slice(0, limit);
  }

  getPatient(id: string) {
    return this.patients.find((p) => p.id === id);
  }

  addPatient(data: Partial<MockPatient>) {
    const newPatient: MockPatient = {
      id: `pat-${Date.now()}`,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      date_of_birth: data.date_of_birth || '',
      gender: data.gender || 'male',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      emergency_contact_name: data.emergency_contact_name || '',
      emergency_contact_phone: data.emergency_contact_phone || '',
      blood_group: data.blood_group || '',
      allergies: data.allergies || '',
      medical_history: data.medical_history || '',
      insurance_provider: data.insurance_provider || '',
      insurance_number: data.insurance_number || '',
      notes: data.notes || '',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.patients.unshift(newPatient);
    return newPatient;
  }

  updatePatient(id: string, data: Partial<MockPatient>) {
    const idx = this.patients.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.patients[idx] = { ...this.patients[idx], ...data };
      return this.patients[idx];
    }
    return null;
  }

  deletePatient(id: string) {
    const p = this.patients.find((p) => p.id === id);
    if (p) p.is_active = false;
    return true;
  }

  // Doctors
  getDoctors() {
    return this.doctors.filter((d) => d.is_active);
  }

  getDoctor(id: string) {
    return this.doctors.find((d) => d.id === id);
  }

  addDoctor(data: Partial<MockDoctor>) {
    const newDoc: MockDoctor = {
      id: `doc-${Date.now()}`,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone: data.phone || '',
      specialization: data.specialization || '',
      license_number: data.license_number || '',
      working_days: data.working_days || 'Mon,Tue,Wed,Thu,Fri',
      working_hours_start: data.working_hours_start || '09:00',
      working_hours_end: data.working_hours_end || '17:00',
      consultation_fee: Number(data.consultation_fee || 0),
      is_active: true,
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };
    this.doctors.unshift(newDoc);
    return newDoc;
  }

  updateDoctor(id: string, data: Partial<MockDoctor>) {
    const idx = this.doctors.findIndex((d) => d.id === id);
    if (idx !== -1) {
      this.doctors[idx] = { ...this.doctors[idx], ...data };
      return this.doctors[idx];
    }
    return null;
  }

  deleteDoctor(id: string) {
    const d = this.doctors.find((d) => d.id === id);
    if (d) d.is_active = false;
    return true;
  }

  // Treatments
  getTreatments() {
    return this.treatments.filter((t) => t.is_active);
  }

  getTreatment(id: string) {
    return this.treatments.find((t) => t.id === id);
  }

  addTreatment(data: Partial<MockTreatment>) {
    const newT: MockTreatment = {
      id: `trt-${Date.now()}`,
      name: data.name || '',
      category: data.category || 'General',
      description: data.description || '',
      duration_minutes: Number(data.duration_minutes || 30),
      cost: Number(data.cost || 0),
      is_active: true,
      created_at: new Date().toISOString(),
    };
    this.treatments.unshift(newT);
    return newT;
  }

  updateTreatment(id: string, data: Partial<MockTreatment>) {
    const idx = this.treatments.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.treatments[idx] = { ...this.treatments[idx], ...data };
      return this.treatments[idx];
    }
    return null;
  }

  deleteTreatment(id: string) {
    const t = this.treatments.find((t) => t.id === id);
    if (t) t.is_active = false;
    return true;
  }

  // Appointments
  getAppointments(date = '', status = '', doctorId = '', patientId = '') {
    return this.appointments
      .filter((a) => {
        if (date && a.appointment_date !== date) return false;
        if (status && a.status !== status) return false;
        if (doctorId && a.doctor_id !== doctorId) return false;
        if (patientId && a.patient_id !== patientId) return false;
        return true;
      })
      .map((a) => ({
        ...a,
        patients: this.getPatient(a.patient_id),
        doctors: this.getDoctor(a.doctor_id),
        treatments: a.treatment_id ? this.getTreatment(a.treatment_id) : undefined,
      }))
      .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));
  }

  getAppointment(id: string) {
    const a = this.appointments.find((apt) => apt.id === id);
    if (!a) return null;
    return {
      ...a,
      patients: this.getPatient(a.patient_id),
      doctors: this.getDoctor(a.doctor_id),
      treatments: a.treatment_id ? this.getTreatment(a.treatment_id) : undefined,
    };
  }

  addAppointment(data: Partial<MockAppointment>) {
    const newApt: MockAppointment = {
      id: `apt-${Date.now()}`,
      patient_id: data.patient_id || '',
      doctor_id: data.doctor_id || '',
      treatment_id: data.treatment_id || undefined,
      appointment_date: data.appointment_date || new Date().toISOString().split('T')[0],
      start_time: data.start_time || '09:00:00',
      end_time: data.end_time || '09:45:00',
      status: (data.status as any) || 'scheduled',
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };
    this.appointments.unshift(newApt);
    return newApt;
  }

  updateAppointment(id: string, data: Partial<MockAppointment>) {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.appointments[idx] = { ...this.appointments[idx], ...data };
      return this.appointments[idx];
    }
    return null;
  }

  deleteAppointment(id: string) {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.appointments.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Invoices
  getInvoices(status = '', patientId = '') {
    return this.invoices
      .filter((inv) => {
        if (status && inv.status !== status) return false;
        if (patientId && inv.patient_id !== patientId) return false;
        return true;
      })
      .map((inv) => ({
        ...inv,
        patients: this.getPatient(inv.patient_id),
        invoice_items: this.invoiceItems.filter((item) => item.invoice_id === inv.id),
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  getInvoice(id: string) {
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) return null;
    return {
      ...inv,
      patients: this.getPatient(inv.patient_id),
      invoice_items: this.invoiceItems.filter((item) => item.invoice_id === inv.id),
      payments: this.payments.filter((p) => p.invoice_id === inv.id),
    };
  }

  addInvoice(data: any, items: any[] = []) {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    const taxRate = Number(data.tax_rate) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = Number(data.discount) || 0;
    const total = Math.max(0, subtotal + taxAmount - discount);

    const invNum = `INV-${String(this.invoices.length + 1).padStart(6, '0')}`;
    const newInv: MockInvoice = {
      id: `inv-${Date.now()}`,
      invoice_number: invNum,
      patient_id: data.patient_id,
      appointment_id: data.appointment_id || undefined,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount,
      total,
      amount_paid: 0,
      balance_due: total,
      status: 'pending',
      due_date: data.due_date || undefined,
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };

    this.invoices.unshift(newInv);

    items.forEach((item) => {
      this.invoiceItems.push({
        id: `item-${Date.now()}-${Math.random()}`,
        invoice_id: newInv.id,
        treatment_id: item.treatment_id || undefined,
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      });
    });

    return newInv;
  }

  updateInvoice(id: string, data: Partial<MockInvoice>) {
    const idx = this.invoices.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.invoices[idx] = { ...this.invoices[idx], ...data };
      return this.invoices[idx];
    }
    return null;
  }

  // Payments
  getPayments(invoiceId = '', patientId = '') {
    return this.payments
      .filter((p) => {
        if (invoiceId && p.invoice_id !== invoiceId) return false;
        if (patientId && p.patient_id !== patientId) return false;
        return true;
      })
      .map((p) => ({
        ...p,
        invoices: this.invoices.find((i) => i.id === p.invoice_id),
        patients: this.getPatient(p.patient_id),
      }))
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  }

  addPayment(data: Partial<MockPayment>) {
    const inv = this.invoices.find((i) => i.id === data.invoice_id);
    if (!inv) throw new Error('Invoice not found');

    const paymentAmount = Number(data.amount);
    const newPaid = Number(inv.amount_paid) + paymentAmount;
    const newBalance = Math.max(0, Number(inv.total) - newPaid);

    inv.amount_paid = newPaid;
    inv.balance_due = newBalance;
    inv.status = newBalance <= 0 ? 'paid' : 'partial';

    const newPayment: MockPayment = {
      id: `pay-${Date.now()}`,
      invoice_id: inv.id,
      patient_id: data.patient_id || inv.patient_id,
      amount: paymentAmount,
      payment_method: (data.payment_method as any) || 'cash',
      payment_date: data.payment_date || new Date().toISOString().split('T')[0],
      reference_number: data.reference_number || undefined,
      notes: data.notes || '',
      created_at: new Date().toISOString(),
    };

    this.payments.unshift(newPayment);
    return newPayment;
  }

  // Dashboard Stats
  getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const totalPatients = this.patients.filter((p) => p.is_active).length;
    const totalDoctors = this.doctors.filter((d) => d.is_active).length;

    const todayAppointments = this.appointments
      .filter((a) => a.appointment_date === today && a.status !== 'cancelled')
      .map((a) => ({
        ...a,
        patients: this.getPatient(a.patient_id),
        doctors: this.getDoctor(a.doctor_id),
        treatments: a.treatment_id ? this.getTreatment(a.treatment_id) : undefined,
      }));

    const monthlyRevenue = this.payments
      .filter((p) => p.payment_date >= firstOfMonth)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingInvoices = this.invoices.filter((i) => ['pending', 'partial', 'overdue'].includes(i.status)).length;
    const totalOutstanding = this.invoices
      .filter((i) => ['pending', 'partial', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + Number(i.balance_due), 0);

    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const upcomingAppointments = this.appointments.filter(
      (a) => a.appointment_date > today && a.appointment_date <= nextWeek && a.status !== 'cancelled'
    ).length;

    const recentPatients = this.patients
      .filter((p) => p.is_active)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        phone: p.phone,
        created_at: p.created_at,
      }));

    // Revenue by last 6 months
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = d.toLocaleString('default', { month: 'short' });
      // Generate realistic past revenue trend
      const baseRev = 2500 + (5 - i) * 800;
      revenueByMonth.push({ month: mStr, revenue: baseRev });
    }
    // Add current month actual
    if (revenueByMonth.length > 0) {
      revenueByMonth[revenueByMonth.length - 1].revenue = Math.max(revenueByMonth[revenueByMonth.length - 1].revenue, monthlyRevenue);
    }

    const appointmentStatusBreakdown: Record<string, number> = {};
    this.appointments.forEach((a) => {
      appointmentStatusBreakdown[a.status] = (appointmentStatusBreakdown[a.status] || 0) + 1;
    });

    return {
      totalPatients,
      totalDoctors,
      todayAppointments: todayAppointments.length,
      todayAppointmentsList: todayAppointments,
      monthlyRevenue,
      pendingInvoices,
      totalOutstanding,
      upcomingAppointments,
      recentPatients,
      revenueByMonth,
      appointmentStatusBreakdown,
    };
  }

  // Reports
  getReports(type: string, from: string, to: string) {
    if (type === 'revenue') {
      const filteredPayments = this.payments
        .filter((p) => p.payment_date >= from && p.payment_date <= to)
        .map((p) => ({
          ...p,
          invoices: this.invoices.find((i) => i.id === p.invoice_id),
          patients: this.getPatient(p.patient_id),
        }));

      const totalRevenue = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const byMethod: Record<string, number> = {};
      filteredPayments.forEach((p) => {
        byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + Number(p.amount);
      });

      return {
        type: 'revenue',
        period: { from, to },
        totalRevenue,
        paymentCount: filteredPayments.length,
        byMethod,
        payments: filteredPayments,
      };
    }

    if (type === 'appointments') {
      const apts = this.appointments
        .filter((a) => a.appointment_date >= from && a.appointment_date <= to)
        .map((a) => ({
          ...a,
          patients: this.getPatient(a.patient_id),
          doctors: this.getDoctor(a.doctor_id),
          treatments: a.treatment_id ? this.getTreatment(a.treatment_id) : undefined,
        }));

      const statusBreakdown: Record<string, number> = {};
      const byDoctor: Record<string, number> = {};
      apts.forEach((a) => {
        statusBreakdown[a.status] = (statusBreakdown[a.status] || 0) + 1;
        const docName = a.doctors ? `Dr. ${a.doctors.first_name} ${a.doctors.last_name}` : 'Unknown';
        byDoctor[docName] = (byDoctor[docName] || 0) + 1;
      });

      return {
        type: 'appointments',
        period: { from, to },
        totalAppointments: apts.length,
        statusBreakdown,
        byDoctor,
        appointments: apts,
      };
    }

    if (type === 'patients') {
      const pats = this.patients.filter((p) => p.is_active && p.created_at >= from);
      return {
        type: 'patients',
        period: { from, to },
        newPatients: pats.length,
        patients: pats,
      };
    }

    if (type === 'treatments') {
      const completed = this.appointments.filter(
        (a) => a.appointment_date >= from && a.appointment_date <= to && a.status === 'completed'
      );

      const byTreatment: Record<string, { count: number; revenue: number }> = {};
      completed.forEach((a) => {
        const trt = a.treatment_id ? this.getTreatment(a.treatment_id) : null;
        if (trt) {
          if (!byTreatment[trt.name]) {
            byTreatment[trt.name] = { count: 0, revenue: 0 };
          }
          byTreatment[trt.name].count += 1;
          byTreatment[trt.name].revenue += Number(trt.cost);
        }
      });

      return {
        type: 'treatments',
        period: { from, to },
        totalCompleted: completed.length,
        byTreatment,
      };
    }

    return { error: 'Invalid report type' };
  }
}

// Global singleton instance
const globalForStore = global as unknown as { mockStore: MockStore };
export const mockStore = globalForStore.mockStore || new MockStore();
if (process.env.NODE_ENV !== 'production') globalForStore.mockStore = mockStore;
