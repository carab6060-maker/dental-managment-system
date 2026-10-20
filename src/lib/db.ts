import { Pool, neonConfig, QueryResult, QueryResultRow } from '@neondatabase/serverless';
import ws from 'ws';

// Route queries through WebSockets over HTTPS (port 443)
neonConfig.webSocketConstructor = ws;

let globalPool: Pool | null = null;

export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return !!(
    url &&
    url.startsWith('postgres') &&
    !url.includes('placeholder')
  );
}

export function getPool(): Pool {
  if (!globalPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }

    globalPool = new Pool({
      connectionString,
    });
  }
  return globalPool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}
