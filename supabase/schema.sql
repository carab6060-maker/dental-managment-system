-- ============================================
-- DENTAL MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (for authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'receptionist' CHECK (role IN ('admin', 'doctor', 'receptionist')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  specialization VARCHAR(100) NOT NULL,
  license_number VARCHAR(50),
  working_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
  working_hours_start TIME DEFAULT '09:00',
  working_hours_end TIME DEFAULT '17:00',
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  blood_group VARCHAR(5),
  allergies TEXT,
  medical_history TEXT,
  insurance_provider VARCHAR(200),
  insurance_number VARCHAR(100),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TREATMENTS TABLE (catalog of available treatments)
-- ============================================
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 30,
  cost DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BILLING TABLE (invoices)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance_due DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'insurance', 'other')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (service role key)
-- In production, you'd want more granular policies
CREATE POLICY "Allow all for service role" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON treatments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON payments FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA: Default admin user
-- Password: admin123 (bcrypt hashed)
-- ============================================
INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@dental.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- SEED DATA: Sample treatments
-- ============================================
INSERT INTO treatments (name, category, description, duration_minutes, cost) VALUES
('Dental Cleaning', 'Preventive', 'Professional teeth cleaning and polishing', 45, 75.00),
('Dental Exam', 'Preventive', 'Comprehensive dental examination', 30, 50.00),
('Dental X-Ray', 'Diagnostic', 'Panoramic or periapical X-ray imaging', 15, 35.00),
('Tooth Filling (Composite)', 'Restorative', 'Tooth-colored composite resin filling', 45, 150.00),
('Tooth Filling (Amalgam)', 'Restorative', 'Silver amalgam filling', 30, 100.00),
('Root Canal Treatment', 'Endodontic', 'Root canal therapy for infected tooth', 90, 800.00),
('Tooth Extraction (Simple)', 'Oral Surgery', 'Simple tooth extraction', 30, 120.00),
('Tooth Extraction (Surgical)', 'Oral Surgery', 'Surgical extraction of impacted tooth', 60, 300.00),
('Dental Crown (Porcelain)', 'Restorative', 'Porcelain crown fabrication and placement', 60, 900.00),
('Dental Bridge', 'Restorative', 'Fixed dental bridge (per unit)', 90, 850.00),
('Teeth Whitening', 'Cosmetic', 'Professional in-office teeth whitening', 60, 350.00),
('Dental Veneer', 'Cosmetic', 'Porcelain veneer per tooth', 60, 1000.00),
('Dental Implant', 'Implantology', 'Titanium dental implant placement', 120, 2500.00),
('Orthodontic Consultation', 'Orthodontic', 'Initial orthodontic evaluation', 45, 100.00),
('Braces (Metal)', 'Orthodontic', 'Traditional metal braces full treatment', 60, 4000.00),
('Clear Aligners', 'Orthodontic', 'Invisible aligner therapy', 30, 5000.00),
('Gum Treatment', 'Periodontic', 'Scaling and root planing', 60, 250.00),
('Wisdom Tooth Removal', 'Oral Surgery', 'Extraction of wisdom teeth', 60, 350.00),
('Dentures (Full)', 'Prosthodontic', 'Complete denture set', 90, 1800.00),
('Dentures (Partial)', 'Prosthodontic', 'Removable partial denture', 60, 1200.00)
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCTION: Auto-generate invoice number
-- ============================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INT)), 0) + 1
  INTO next_num
  FROM invoices;
  
  NEW.invoice_number := 'INV-' || LPAD(next_num::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- ============================================
-- FUNCTION: Update invoice balance on payment
-- ============================================
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(10,2);
  inv_total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments WHERE invoice_id = NEW.invoice_id;
  
  SELECT total INTO inv_total
  FROM invoices WHERE id = NEW.invoice_id;
  
  UPDATE invoices SET
    amount_paid = total_paid,
    balance_due = inv_total - total_paid,
    status = CASE
      WHEN total_paid >= inv_total THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_update_invoice_payment
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_on_payment();
