import dotenv from 'dotenv';
import { createPool } from 'mysql2/promise';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wouaff',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

(pool as any).on?.('error', (err: Error) => {
  console.error('[DB POOL ERROR]', err.message);
});

export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const sanitized = params?.map((p) => (p === undefined ? null : p));
  try {
    const [rows] = await pool.execute(sql, sanitized);
    return rows as T;
  } catch (err: any) {
    /* Retry once on connection loss */
    if (err?.code === 'ECONNRESET' || err?.code === 'PROTOCOL_CONNECTION_LOST') {
      console.warn('[DB] Connection lost, retrying...');
      const [rows] = await pool.execute(sql, sanitized);
      return rows as T;
    }
    throw err;
  }
}

export async function getOne<T>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T[]>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export default pool;
