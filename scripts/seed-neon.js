const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('DATABASE_URL=')) {
        return trimmed.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return null;
}

async function seedData() {
  const connectionString = getDatabaseUrl();
  console.log('🔄 Connecting to Neon PostgreSQL (with 30s timeout for cold start)...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database successfully!');

    // Check doctors
    const docCount = await client.query('SELECT count(*) FROM doctors');
    if (parseInt(docCount.rows[0].count) === 0) {
      console.log('🌱 Seeding initial doctors into Neon...');
      await client.query(`
        INSERT INTO doctors (first_name, last_name, email, phone, specialization, license_number, working_days, working_hours_start, working_hours_end, consultation_fee, notes)
        VALUES
        ('Sarah', 'Johnson', 'sarah.johnson@dental.com', '+1 (555) 234-5678', 'Orthodontics', 'DEN-94821', 'Mon,Tue,Wed,Thu', '09:00', '17:00', 100.00, 'Specialist in clear aligners and braces'),
        ('Michael', 'Chang', 'michael.chang@dental.com', '+1 (555) 345-6789', 'Implantology', 'DEN-71029', 'Tue,Wed,Thu,Fri', '08:30', '16:30', 150.00, 'Expert in dental implants and oral restorations'),
        ('Emily', 'Rodriguez', 'emily.rodriguez@dental.com', '+1 (555) 456-7890', 'General Dentistry', 'DEN-88231', 'Mon,Tue,Wed,Thu,Fri', '09:00', '18:00', 75.00, 'Preventive care, fillings, and restorative treatments'),
        ('David', 'Kim', 'david.kim@dental.com', '+1 (555) 567-8901', 'Endodontics', 'DEN-65490', 'Mon,Wed,Fri', '10:00', '16:00', 120.00, 'Root canal therapy specialist');
      `);
      console.log('✅ Seeded 4 doctors.');
    } else {
      console.log(`ℹ️ Doctors already exist (${docCount.rows[0].count} found).`);
    }

    // Check patients
    const patCount = await client.query('SELECT count(*) FROM patients');
    if (parseInt(patCount.rows[0].count) === 0) {
      console.log('🌱 Seeding initial patients into Neon...');
      await client.query(`
        INSERT INTO patients (first_name, last_name, date_of_birth, gender, email, phone, address, city, emergency_contact_name, emergency_contact_phone, blood_group, allergies, insurance_provider, insurance_number)
        VALUES
        ('John', 'Doe', '1988-04-12', 'male', 'john.doe@example.com', '+1 (555) 111-2222', '742 Evergreen Terrace', 'Springfield', 'Jane Doe', '+1 (555) 111-3333', 'O+', 'Penicillin', 'Blue Cross Dental', 'BC-882910'),
        ('Alice', 'Smith', '1995-09-24', 'female', 'alice.smith@example.com', '+1 (555) 222-3333', '100 Main Street', 'Springfield', 'Bob Smith', '+1 (555) 222-4444', 'A+', 'None', 'Delta Dental', 'DD-447192'),
        ('Robert', 'Miller', '1976-11-03', 'male', 'robert.m@example.com', '+1 (555) 333-4444', '45 Oak Ridge Lane', 'Springfield', 'Mary Miller', '+1 (555) 333-5555', 'B+', 'Latex', 'MetLife Dental', 'ML-992014');
      `);
      console.log('✅ Seeded 3 patients.');
    } else {
      console.log(`ℹ️ Patients already exist (${patCount.rows[0].count} found).`);
    }

    console.log('🌟 Neon database is fully populated and ready for clinic operations!');
  } catch (err) {
    console.error('Error seeding data:', err.message);
  } finally {
    await client.end();
  }
}

seedData();
