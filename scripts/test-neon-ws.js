const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const fs = require('fs');
const path = require('path');

neonConfig.webSocketConstructor = ws;

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

async function testWebSocketNeon() {
  const connectionString = getDatabaseUrl();
  console.log('🔄 Connecting to Neon via WebSocket (port 443)...');
  const pool = new Pool({ connectionString });

  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('✅ Connected successfully via WebSocket (port 443)!');
    console.log('📋 Public tables in Neon database:');
    res.rows.forEach(r => console.log('   - ' + r.table_name));

    const users = await pool.query('SELECT count(*) FROM users;');
    const doctors = await pool.query('SELECT count(*) FROM doctors;');
    const patients = await pool.query('SELECT count(*) FROM patients;');
    const treatments = await pool.query('SELECT count(*) FROM treatments;');

    console.log(`👤 Users: ${users.rows[0].count}`);
    console.log(`🩺 Doctors: ${doctors.rows[0].count}`);
    console.log(`👥 Patients: ${patients.rows[0].count}`);
    console.log(`💊 Treatments: ${treatments.rows[0].count}`);
    console.log('🎉 Neon database is 100% active and connected!');
  } catch (err) {
    console.error('❌ WebSocket Neon connection error:', err);
  } finally {
    await pool.end();
  }
}

testWebSocketNeon();
