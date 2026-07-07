import { Storage } from '@google-cloud/storage';
import { getOne, query } from '../config/database.js';

interface CallRecord {
  id: string;
  callerUid: string;
  calleeUid: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: string;
  archivedAt?: number;
}

const ARCHIVE_AFTER_DAYS = 30;
const BUCKET_NAME = process.env.GCS_BUCKET || '';
const KEY_FILE = process.env.GCS_KEY_FILE || '';
const CREDENTIALS_JSON = process.env.GCS_CREDENTIALS || '';

let storage: Storage | null = null;
let bucket: ReturnType<Storage['bucket']> | null = null;
let initialized = false;

export function isColdStorageEnabled(): boolean {
  return initialized;
}

export async function initColdStorage(): Promise<void> {
  if (initialized) return;
  try {
    const opts: Record<string, unknown> = {};
    if (KEY_FILE) {
      opts.keyFilename = KEY_FILE;
    } else if (CREDENTIALS_JSON) {
      opts.credentials = JSON.parse(CREDENTIALS_JSON);
    } else {
      /* Fallback: ADC (Application Default Credentials) */
    }
    storage = new Storage(opts);
    bucket = storage.bucket(BUCKET_NAME);
    const [exists] = await bucket.exists();
    if (!exists) {
      console.log(`[COLD STORAGE] Creating bucket "${BUCKET_NAME}" (COLDLINE)...`);
      const [b] = await storage.createBucket(BUCKET_NAME, {
        storageClass: 'COLDLINE',
        location: 'EUROPE-WEST9',
      });
      bucket = storage.bucket(b.name);
    }
    initialized = true;
    console.log(`[COLD STORAGE] Init OK → gs://${BUCKET_NAME}`);
  } catch (err) {
    console.warn('[COLD STORAGE] GCS indisponible, fonctionnement sans stockage froid :', (err as Error).message);
    storage = null;
    bucket = null;
  }
}

function objectKey(id: string, date?: Date): string {
  const d = date || new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `calls/${y}/${m}/${y}-${m}-${day}-${id}.json`;
}

/* ── Save a call record directly to GCS (cold path) ── */
export async function saveCallRecord(
  id: string,
  callerUid: string,
  calleeUid: string,
  startTime: number,
  endTime: number,
  duration: number,
  status: string,
): Promise<boolean> {
  if (!initialized || !bucket) return false;
  try {
    const record: CallRecord = {
      id,
      callerUid,
      calleeUid,
      startTime,
      endTime,
      duration,
      status,
      archivedAt: Date.now(),
    };
    const key = objectKey(id, new Date(endTime));
    await bucket.file(key).save(JSON.stringify(record), {
      contentType: 'application/json',
      gzip: true,
      metadata: { storageClass: 'COLDLINE' },
    });
    return true;
  } catch (err) {
    console.error('[COLD STORAGE] saveCallRecord error:', (err as Error).message);
    return false;
  }
}

/* ── Batch archive old calls from MySQL → GCS ── */
export async function archiveOldCalls(): Promise<{ archived: number; failed: number }> {
  if (!initialized || !bucket) return { archived: 0, failed: 0 };
  const cutoff = Date.now() - ARCHIVE_AFTER_DAYS * 86400000;
  let archived = 0;
  let failed = 0;
  try {
    const rows = await query<CallRecord[]>('SELECT * FROM calls WHERE endTime < ? ORDER BY endTime ASC LIMIT 200', [
      cutoff,
    ]);
    for (const row of rows) {
      try {
        const record: CallRecord = { ...row, archivedAt: Date.now() };
        const key = objectKey(row.id, new Date(row.endTime));
        await bucket!.file(key).save(JSON.stringify(record), {
          contentType: 'application/json',
          gzip: true,
          metadata: { storageClass: 'COLDLINE' },
        });
        await query('DELETE FROM calls WHERE id = ?', [row.id]);
        archived++;
      } catch {
        failed++;
      }
    }
    if (archived > 0) console.log(`[COLD STORAGE] Archivés : ${archived}, échecs : ${failed}`);
  } catch (err) {
    console.error('[COLD STORAGE] archiveOldCalls error:', (err as Error).message);
  }
  return { archived, failed };
}

/* ── Retrieve a specific archived call by ID ── */
export async function getArchivedCall(id: string): Promise<CallRecord | null> {
  if (!initialized || !bucket) return null;
  try {
    /* Search across all date prefixes — try recent months first */
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now);
      d.setUTCMonth(d.getUTCMonth() - i);
      const key = objectKey(id, d);
      const [exists] = await bucket.file(key).exists();
      if (exists) {
        const [buf] = await bucket.file(key).download();
        return JSON.parse(buf.toString('utf-8')) as CallRecord;
      }
    }
    /* Broad prefix search as fallback */
    const [files] = await bucket.getFiles({ prefix: 'calls/' });
    const match = files.find((f) => f.name.endsWith(`-${id}.json`));
    if (match) {
      const [buf] = await match.download();
      return JSON.parse(buf.toString('utf-8')) as CallRecord;
    }
    return null;
  } catch {
    return null;
  }
}

/* ── Get all call records for a user (MySQL recent + GCS archived) ── */
export async function getUserCalls(uid: string, limit = 50): Promise<CallRecord[]> {
  const recent = await query<CallRecord[]>(
    'SELECT * FROM calls WHERE callerUid=? OR calleeUid=? ORDER BY endTime DESC LIMIT ?',
    [uid, uid, limit],
  );
  const result = [...recent];
  if (initialized && bucket) {
    try {
      const [files] = await bucket.getFiles({ prefix: 'calls/' });
      const userFiles = files.filter((f) => f.name.endsWith('.json'));
      const limitRemaining = Math.max(limit - result.length, 0);
      const batch = userFiles.slice(0, limitRemaining * 3);
      const parsed: CallRecord[] = [];
      for (const f of batch) {
        try {
          const [buf] = await f.download();
          const rec = JSON.parse(buf.toString('utf-8')) as CallRecord;
          if (rec.callerUid === uid || rec.calleeUid === uid) parsed.push(rec);
        } catch {
          /* skip */
        }
        if (parsed.length >= limitRemaining) break;
      }
      result.push(...parsed);
      result.sort((a, b) => b.endTime - a.endTime);
    } catch {
      /* GCS unavailable */
    }
  }
  return result.slice(0, limit);
}

export { ARCHIVE_AFTER_DAYS };
