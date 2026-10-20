import { neon } from '@neondatabase/serverless';

export function isNeonConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return !!(
    url &&
    url.startsWith('postgres') &&
    !url.includes('placeholder') &&
    !url.includes('your_')
  );
}

export function getNeonSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }
  return neon(connectionString);
}
