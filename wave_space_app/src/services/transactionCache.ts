/**
 * SQLite-backed transaction cache.
 *
 * Stores transactions locally so the app loads fast and works offline.
 * Syncs from the Breez SDK service when online.
 */

import {getDatabase} from '@/database/db';
import {listPayments, listChannels} from '@/services/breezService';
import type {Transaction, Channel, TransactionType, TransactionStatus} from '@/types/wallet';

const PAGE_SIZE = 50;

// --- Transactions ---

export async function cacheTransaction(tx: Transaction): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO transactions
      (id, type, status, amount_sats, fee_sats, timestamp, description, payment_hash, preimage, destination, bolt11)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    tx.id,
    tx.type,
    tx.status,
    tx.amountSats,
    tx.feeSats,
    tx.timestamp,
    tx.description ?? null,
    tx.paymentHash ?? null,
    tx.preimage ?? null,
    tx.destination ?? null,
    tx.bolt11 ?? null,
  );
}

export async function cacheTransactions(txs: Transaction[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const tx of txs) {
      await db.runAsync(
        `INSERT OR REPLACE INTO transactions
          (id, type, status, amount_sats, fee_sats, timestamp, description, payment_hash, preimage, destination, bolt11)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        tx.id,
        tx.type,
        tx.status,
        tx.amountSats,
        tx.feeSats,
        tx.timestamp,
        tx.description ?? null,
        tx.paymentHash ?? null,
        tx.preimage ?? null,
        tx.destination ?? null,
        tx.bolt11 ?? null,
      );
    }
  });
}

export async function getTransactions(options?: {
  type?: TransactionType;
  status?: TransactionStatus;
  search?: string;
  page?: number;
}): Promise<Transaction[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.type) {
    conditions.push('type = ?');
    params.push(options.type);
  }
  if (options?.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }
  if (options?.search) {
    conditions.push('(description LIKE ? OR amount_sats = ?)');
    params.push(`%${options.search}%`);
    params.push(Number(options.search) || -1);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = options?.page ?? 0;
  const offset = page * PAGE_SIZE;

  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
    ...params,
    PAGE_SIZE,
    offset,
  );

  return rows.map(rowToTransaction);
}

export async function getRecentTransactions(limit = 5): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TransactionRow>(
    'SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?',
    limit,
  );
  return rows.map(rowToTransaction);
}

// --- Channels ---

export async function cacheChannels(channels: Channel[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM channels');
    for (const ch of channels) {
      await db.runAsync(
        `INSERT INTO channels
          (id, remote_pubkey, remote_alias, capacity_sats, local_balance_sats, remote_balance_sats, state, is_usable, short_channel_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ch.id,
        ch.remotePubkey,
        ch.remoteAlias ?? null,
        ch.capacitySats,
        ch.localBalanceSats,
        ch.remoteBalanceSats,
        ch.state,
        ch.isUsable ? 1 : 0,
        ch.shortChannelId ?? null,
      );
    }
  });
}

export async function getCachedChannels(): Promise<Channel[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ChannelRow>('SELECT * FROM channels');
  return rows.map(rowToChannel);
}

// --- Wallet State (key-value) ---

export async function setWalletValue(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO wallet_state (key, value) VALUES (?, ?)',
    key,
    value,
  );
}

export async function getWalletValue(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{value: string}>(
    'SELECT value FROM wallet_state WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

// --- Sync from Breez SDK ---

export async function syncFromSdk(): Promise<{
  transactions: Transaction[];
  channels: Channel[];
}> {
  const [transactions, channels] = await Promise.all([
    listPayments(),
    listChannels(),
  ]);

  await Promise.all([
    cacheTransactions(transactions),
    cacheChannels(channels),
  ]);

  return {transactions, channels};
}

// --- Row mapping helpers ---

interface TransactionRow {
  id: string;
  type: string;
  status: string;
  amount_sats: number;
  fee_sats: number;
  timestamp: number;
  description: string | null;
  payment_hash: string | null;
  preimage: string | null;
  destination: string | null;
  bolt11: string | null;
}

interface ChannelRow {
  id: string;
  remote_pubkey: string;
  remote_alias: string | null;
  capacity_sats: number;
  local_balance_sats: number;
  remote_balance_sats: number;
  state: string;
  is_usable: number;
  short_channel_id: string | null;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type as TransactionType,
    status: row.status as TransactionStatus,
    amountSats: row.amount_sats,
    feeSats: row.fee_sats,
    timestamp: row.timestamp,
    description: row.description ?? undefined,
    paymentHash: row.payment_hash ?? undefined,
    preimage: row.preimage ?? undefined,
    destination: row.destination ?? undefined,
    bolt11: row.bolt11 ?? undefined,
  };
}

function rowToChannel(row: ChannelRow): Channel {
  return {
    id: row.id,
    remotePubkey: row.remote_pubkey,
    remoteAlias: row.remote_alias ?? undefined,
    capacitySats: row.capacity_sats,
    localBalanceSats: row.local_balance_sats,
    remoteBalanceSats: row.remote_balance_sats,
    state: row.state as Channel['state'],
    isUsable: row.is_usable === 1,
    shortChannelId: row.short_channel_id ?? undefined,
  };
}
