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

async function runMigration() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL not found in .env.local or environment.');
    process.exit(1);
  }

  console.log('🔄 Connecting to Neon PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database successfully!');

    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⏳ Running schema migration (tables, indexes, triggers, seed data)...');
    await client.query(schemaSql);

    console.log('✅ Neon Database migration completed successfully!');
    console.log('🎉 All tables, triggers, and sample dental treatments are now live in Neon.');

    // Quick verification
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('📋 Public tables in Neon database:');
    res.rows.forEach(r => console.log('   - ' + r.table_name));

    const userCount = await client.query('SELECT count(*) FROM users;');
    const trtCount = await client.query('SELECT count(*) FROM treatments;');
    console.log(`👤 Users seeded: ${userCount.rows[0].count}`);
    console.log(`💊 Treatments seeded: ${trtCount.rows[0].count}`);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
