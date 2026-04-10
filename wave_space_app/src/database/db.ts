import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('wavespace.db');
    await db.execAsync('PRAGMA journal_mode = WAL;');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      amount_sats INTEGER NOT NULL,
      fee_sats INTEGER NOT NULL DEFAULT 0,
      timestamp REAL NOT NULL,
      description TEXT,
      payment_hash TEXT,
      preimage TEXT,
      destination TEXT,
      bolt11 TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY NOT NULL,
      remote_pubkey TEXT NOT NULL,
      remote_alias TEXT,
      capacity_sats INTEGER NOT NULL,
      local_balance_sats INTEGER NOT NULL,
      remote_balance_sats INTEGER NOT NULL,
      state TEXT NOT NULL,
      is_usable INTEGER NOT NULL DEFAULT 0,
      short_channel_id TEXT
    );

    CREATE TABLE IF NOT EXISTS wallet_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
