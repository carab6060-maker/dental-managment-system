const { Client } = require('pg');

async function updateRoles() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_iabStVkHd71T@ep-blue-sunset-b5mp00gl-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  // Update superadmin and admin to have superadmin role
  await client.query(`
    UPDATE users 
    SET role = 'superadmin' 
    WHERE username IN ('superadmin', 'admin', 'carab') 
       OR email IN ('superadmin@dental.com', 'admin@dental.com', 'carab6060@gmail.com');
  `);

  // Ensure 'carab' user also exists with same password hash as superadmin
  const superadminUser = await client.query(`SELECT password_hash FROM users WHERE username = 'superadmin' LIMIT 1;`);
  if (superadminUser.rows.length > 0) {
    const hash = superadminUser.rows[0].password_hash;
    await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active)
      VALUES ('carab', 'carab@dental.com', $1, 'carab', 'superadmin', true)
      ON CONFLICT (username) DO UPDATE SET role = 'superadmin';
    `, [hash]);
  }

  const res = await client.query('SELECT id, username, email, role FROM users;');
  console.log('✅ Updated users:', res.rows);
  await client.end();
}

updateRoles().catch(console.error);
