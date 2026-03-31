import type { SQLiteDatabase } from "expo-sqlite";
import type { SettlementSnapshot } from "../api/contracts";

const CACHE_TABLE = "app_cache";
const SETTLEMENT_CACHE_KEY = "settlement_snapshot";

interface CacheRow {
  value: string;
}

export async function initializeSettlementCache(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${CACHE_TABLE} (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export async function readCachedSettlementSnapshot(
  db: SQLiteDatabase,
): Promise<SettlementSnapshot | null> {
  const row = await db.getFirstAsync<CacheRow>(
    `SELECT value FROM ${CACHE_TABLE} WHERE key = ?`,
    SETTLEMENT_CACHE_KEY,
  );

  if (!row?.value) {
    return null;
  }

  return JSON.parse(row.value) as SettlementSnapshot;
}

export async function writeCachedSettlementSnapshot(
  db: SQLiteDatabase,
  snapshot: SettlementSnapshot,
): Promise<void> {
  await db.runAsync(
    `
      INSERT INTO ${CACHE_TABLE} (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `,
    SETTLEMENT_CACHE_KEY,
    JSON.stringify(snapshot),
    new Date().toISOString(),
  );
}
