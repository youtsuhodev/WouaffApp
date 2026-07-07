import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    const rootDir = resolve(__dirname, '../../');
    const srcMigrations = resolve(rootDir, 'src/migrations');
    const distMigrations = resolve(__dirname, '../migrations');
    const migrationsDir = existsSync(distMigrations) ? distMigrations : srcMigrations;

    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sqlPath = resolve(migrationsDir, file);
      const sql = readFileSync(sqlPath, 'utf8');
      const statements = sql.split(';').filter(s => s.trim().length > 0);
      for (const stmt of statements) {
        try {
          await connection.execute(stmt);
        } catch (err: any) {
          if (err?.code === 'ER_UNSUPPORTED_PS') {
            await connection.query(stmt);
          } else {
            throw err;
          }
        }
      }
      console.log(`[MIGRATE] ${file} exécuté`);
    }
  } finally {
    connection.release();
  }
}
