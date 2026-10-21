const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

async function inspectAndSetup() {
  const connectionString = getDatabaseUrl();
  console.log('Connecting via pg Client to Neon...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database successfully!');

    // 1. Inspect users table columns
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);
    console.log('Current users columns:', cols.rows.map(r => r.column_name));

    // 2. Add username column if missing
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;
    `);
    console.log('✅ Ensured username column exists on users table.');

    // 3. Inspect existing users
    const existing = await client.query(`SELECT id, email, username, full_name, role, is_active FROM users;`);
    console.log('Current users in DB:', existing.rows);

    // 4. Create or update Super Admin
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Super Admin record: username 'superadmin', email 'superadmin@dental.com'
    const superAdminRes = await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (email) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = true
      RETURNING id, username, email, full_name, role;
    `, ['superadmin', 'superadmin@dental.com', passwordHash, 'Super Administrator', 'admin']);

    console.log('✅ Super Admin created/updated:', superAdminRes.rows[0]);

    // Also update existing 'admin@dental.com' if present so username is 'admin' and password is valid 'admin123'
    await client.query(`
      UPDATE users 
      SET username = 'admin', password_hash = $1, full_name = 'System Administrator', role = 'admin', is_active = true
      WHERE email = 'admin@dental.com';
    `, [passwordHash]);

    console.log('✅ Admin (admin@dental.com) updated with username: admin and password: ' + password);

    const finalUsers = await client.query(`SELECT id, username, email, full_name, role, is_active FROM users;`);
    console.log('Final users in DB:');
    finalUsers.rows.forEach(u => {
      console.log(` - ID: ${u.id} | Username: ${u.username} | Email: ${u.email} | Name: ${u.full_name} | Role: ${u.role}`);
    });

  } catch (err) {
    console.error('Error during superadmin setup:', err);
  } finally {
    await client.end();
  }
}

inspectAndSetup();
