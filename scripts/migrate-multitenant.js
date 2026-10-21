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

async function migrateMultiTenant() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  console.log('🔄 Connecting to Neon PostgreSQL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    console.log('⏳ Running multi-tenant schema upgrade...');

    // 1. Create clinics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clinics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        logo_url TEXT,
        status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
        subscription_plan VARCHAR(50) DEFAULT 'pro',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Table "clinics" ready.');

    // 2. Insert primary clinic
    await client.query(`
      INSERT INTO clinics (name, slug, email, phone, address, city, status, subscription_plan)
      VALUES ('Prime Dental Clinic', 'prime-dental', 'contact@primedental.com', '+252 61 0000000', 'Main Street, Km4', 'Mogadishu', 'active', 'enterprise')
      ON CONFLICT (slug) DO NOTHING;
    `);
    console.log('✅ Default clinic "Prime Dental Clinic" ensured.');

    // 3. Update users table: allow role 'superadmin' and add clinic_id
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('superadmin', 'admin', 'doctor', 'receptionist'));
      ALTER TABLE users ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
    `);
    console.log('✅ "users" table updated with role check and clinic_id.');

    // Ensure carab is superadmin
    await client.query(`
      UPDATE users SET role = 'superadmin' WHERE username = 'carab' OR email = 'carab6060@gmail.com';
    `);
    console.log('✅ User "carab" confirmed as superadmin.');

    // 4. Add clinic_id to all tenant tables
    const tenantTables = ['patients', 'doctors', 'treatments', 'appointments', 'invoices', 'payments'];
    for (const table of tenantTables) {
      await client.query(`
        ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_${table}_clinic ON ${table}(clinic_id);
      `);
      console.log(`✅ Added clinic_id and index to table "${table}".`);
    }

    // 5. Backfill all existing rows to the default clinic
    await client.query(`
      DO $$
      DECLARE
        v_clinic_id UUID;
      BEGIN
        SELECT id INTO v_clinic_id FROM clinics WHERE slug = 'prime-dental' LIMIT 1;
        IF v_clinic_id IS NOT NULL THEN
          UPDATE patients SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
          UPDATE doctors SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
          UPDATE treatments SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
          UPDATE appointments SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
          UPDATE invoices SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
          UPDATE payments SET clinic_id = v_clinic_id WHERE clinic_id IS NULL;
          UPDATE users SET clinic_id = v_clinic_id WHERE clinic_id IS NULL AND role != 'superadmin';
        END IF;
      END $$;
    `);
    console.log('✅ Existing records backfilled with default clinic ID.');

    // Verify clinics list
    const res = await client.query('SELECT id, name, slug, status FROM clinics;');
    console.log('🏥 Active Clinics in Database:');
    res.rows.forEach(c => console.log(`   - [${c.id}] ${c.name} (${c.slug}) - ${c.status}`));

    console.log('🎉 Multi-tenant database migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateMultiTenant();
