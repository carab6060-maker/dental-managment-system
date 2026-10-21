const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createPrimeDentalUser() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_iabStVkHd71T@ep-blue-sunset-b5mp00gl-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  // Find Prime Dental Clinic ID
  const clinicRes = await client.query(`SELECT id, name FROM clinics WHERE slug = 'prime-dental' LIMIT 1;`);
  if (clinicRes.rows.length === 0) {
    console.error('❌ Prime Dental Clinic not found');
    process.exit(1);
  }
  const primeClinicId = clinicRes.rows[0].id;
  console.log(`🏥 Found Prime Dental Clinic: ${primeClinicId}`);

  // Create or update dedicated user
  const username = 'primedental';
  const email = 'info@primedental.com';
  const rawPassword = 'prime123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const fullName = 'Prime Dental Administrator';

  await client.query(`
    INSERT INTO users (username, email, password_hash, full_name, role, clinic_id, is_active)
    VALUES ($1, $2, $3, $4, 'admin', $5, true)
    ON CONFLICT (username) DO UPDATE SET 
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      full_name = EXCLUDED.full_name,
      role = 'admin',
      clinic_id = EXCLUDED.clinic_id,
      is_active = true;
  `, [username, email, passwordHash, fullName, primeClinicId]);

  console.log('✅ Created dedicated user for Prime Dental Clinic:');
  console.log(`   Username: ${username}`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${rawPassword}`);
  console.log(`   Role:     admin`);
  console.log(`   Clinic:   Prime Dental Clinic (${primeClinicId})`);

  // Verify all users
  const allUsers = await client.query(`
    SELECT u.id, u.username, u.email, u.role, c.name as clinic_name 
    FROM users u 
    LEFT JOIN clinics c ON u.clinic_id = c.id
    ORDER BY u.created_at ASC;
  `);
  console.log('📋 All system users:');
  allUsers.rows.forEach(u => {
    console.log(`   - ${u.username} (${u.email}) [${u.role}] -> ${u.clinic_name || 'All Clinics (Superadmin)'}`);
  });

  await client.end();
}

createPrimeDentalUser().catch(console.error);
