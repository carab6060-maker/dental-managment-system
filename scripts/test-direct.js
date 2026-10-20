const { neon } = require('@neondatabase/serverless');

async function test() {
  const url = 'postgresql://neondb_owner:npg_iabStVkHd71T@ep-blue-sunset-b5mp00gl.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';
  console.log('Connecting to Neon Direct HTTP...');
  const sql = neon(url);
  try {
    const res = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`;
    console.log('SUCCESS! Tables:', res.map(t => t.table_name).join(', '));
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}

test();
