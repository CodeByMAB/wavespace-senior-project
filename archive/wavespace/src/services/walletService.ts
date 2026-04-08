import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  connect,
  defaultConfig,
  Seed,
  Network,
  PaymentStatus,
  PaymentType,
  ListPaymentsRequest,
  type BreezSdkInterface,
  type EventListener,
  type GetInfoResponse,
  GetInfoRequest,
} from '@breeztech/breez-sdk-spark-react-native';
import { documentDirectory } from 'expo-file-system/legacy';
import { getMnemonic, getPassphrase } from './secureStorageService';
import { ASYNC_KEYS } from '../constants/storage';

let sdkInstance: BreezSdkInterface | null = null;

// ─── Node State ──────────────────────────────────────────────────────────────

export interface NodeState {
  identityPubkey: string;
  balanceSats: bigint;
  pendingReceiveSats: bigint;
  pendingSendSats: bigint;
  /** Unix timestamp (ms) of the last Synced event, or null if not yet synced. */
  lastSyncedAt: number | null;
  network: 'mainnet' | 'testnet';
}

// ─── Error Mapping ───────────────────────────────────────────────────────────

/**
 * Translates raw SDK exceptions into plain-language messages safe to show in
 * the UI. Technical details are kept out of the returned string.
 */
export function mapSdkError(err: unknown, operation: string): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('no wallet') || msg.includes('mnemonic')) {
      return 'No wallet found. Please set up your wallet first.';
    }
    if (msg.includes('not initialized') || msg.includes('not connected')) {
      return 'Wallet is not connected. Please try again.';
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'Connection timed out. Please check your network and try again.';
    }
    if (msg.includes('authentication') || msg.includes('unauthorized')) {
      return 'Authentication failed. Please re-authenticate.';
    }
    if (msg.includes('insufficient') || msg.includes('balance')) {
      return 'Insufficient balance for this operation.';
    }
    if (msg.includes('network') || msg.includes('connect')) {
      return 'Network error. Please check your connection and try again.';
    }
  }
  return `Unable to complete ${operation}. Please try again.`;
}

// ─── Structured Logging ──────────────────────────────────────────────────────

export interface WalletLogEntry {
  timestamp: string;
  operation: string;
  attempt?: number;
  context?: Record<string, unknown>;
  errorType?: string;
  errorMessage?: string;
}

/**
 * Emits a structured log entry for wallet operations. Keeps technical details
 * in the log while surfacing only user-friendly messages in the UI.
 */
export function logWalletOperation(params: {
  operation: string;
  attempt?: number;
  error?: unknown;
  context?: Record<string, unknown>;
}): void {
  const { operation, attempt, error, context } = params;
  const entry: WalletLogEntry = {
    timestamp: new Date().toISOString(),
    operation,
  };
  if (attempt !== undefined) entry.attempt = attempt;
  if (context) entry.context = context;
  if (error instanceof Error) {
    entry.errorType = error.constructor.name;
    entry.errorMessage = error.message;
  } else if (error !== undefined) {
    entry.errorType = typeof error;
  }

  if (__DEV__) {
    const serialized = JSON.stringify(entry);
    if (error !== undefined) {
      console.warn('[WalletService]', serialized);
    } else {
      console.log('[WalletService]', serialized);
    }
  }
}

// ─── Network Resolution ──────────────────────────────────────────────────────

/**
 * Reads the persisted network selection and maps it to a Breez SDK Network
 * value. Falls back to Mainnet for unknown or missing values.
 */
async function resolveNetwork(): Promise<Network> {
  try {
    const stored = await AsyncStorage.getItem(ASYNC_KEYS.NETWORK_SELECTION);
    if (stored === 'testnet') return Network.Regtest;
    if (stored === 'mainnet') return Network.Mainnet;
    // Unknown or missing value — safe default
    return Network.Mainnet;
  } catch {
    return Network.Mainnet;
  }
}

// ─── SDK Lifecycle ───────────────────────────────────────────────────────────

/**
 * Returns the active Breez SDK instance, or null if the wallet has not been
 * initialized yet.
 */
export function getWalletInstance(): BreezSdkInterface | null {
  return sdkInstance;
}

/**
 * Derives wallet keys from the stored mnemonic + passphrase and connects to
 * the Breez Spark network on the persisted network selection, starting the
 * initial balance/history sync.
 *
 * @throws if the mnemonic is missing or SDK connection fails.
 */
export async function initializeWallet(): Promise<BreezSdkInterface> {
  if (sdkInstance) {
    return sdkInstance;
  }

  const mnemonic = await getMnemonic();
  if (!mnemonic) {
    throw new Error('No wallet found. Please create or restore a wallet first.');
  }

  const passphrase = await getPassphrase();

  const seed = new Seed.Mnemonic({
    mnemonic,
    passphrase: passphrase ?? undefined,
  });

  const network = await resolveNetwork();
  const config = defaultConfig(network);

  const docDir = (documentDirectory ?? '').replace(/^file:\/\//, '');
  const storageDir = `${docDir}breez-sdk`;

  sdkInstance = await connect({ config, seed, storageDir });

  logWalletOperation({
    operation: 'initializeWallet',
    context: { network: network === Network.Regtest ? 'testnet' : 'mainnet' },
  });

  return sdkInstance;
}

/**
 * Disconnects the active SDK instance and clears the cached reference.
 * Call on wallet reset or app lock.
 */
export async function disconnectWallet(): Promise<void> {
  if (sdkInstance) {
    try {
      await sdkInstance.disconnect();
    } catch {
      // Ignore disconnect errors during cleanup
    }
    sdkInstance = null;
  }
}

/**
 * Registers an event listener on the active SDK instance.
 * @returns The listener ID, used to deregister later.
 * @throws if the SDK has not been initialized.
 */
export async function registerEventListener(listener: EventListener): Promise<string> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }
  return sdkInstance.addEventListener(listener);
}

/**
 * Removes a previously registered event listener by ID.
 */
export async function removeEventListener(id: string): Promise<void> {
  if (!sdkInstance) {
    return;
  }
  await sdkInstance.removeEventListener(id);
}

/**
 * Fetches the current wallet info (including balance) from the SDK.
 * @throws if the SDK has not been initialized.
 */
export async function getWalletInfo(): Promise<GetInfoResponse> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }
  return sdkInstance.getInfo(GetInfoRequest.create({ ensureSynced: undefined }));
}

/**
 * Fetches a composite node-state snapshot: identity, balance, and inbound/
 * outbound pending amounts derived from pending payments.
 *
 * @throws if the SDK has not been initialized.
 */
export async function getNodeState(): Promise<Omit<NodeState, 'lastSyncedAt'>> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }

  const [info, pendingResponse, networkRaw] = await Promise.all([
    sdkInstance.getInfo(GetInfoRequest.create({ ensureSynced: undefined })),
    sdkInstance.listPayments(
      ListPaymentsRequest.create({ statusFilter: [PaymentStatus.Pending] }),
    ),
    AsyncStorage.getItem(ASYNC_KEYS.NETWORK_SELECTION).catch(() => null),
  ]);

  let pendingReceiveSats = BigInt(0);
  let pendingSendSats = BigInt(0);
  for (const payment of pendingResponse.payments) {
    if (payment.paymentType === PaymentType.Receive) {
      pendingReceiveSats += payment.amount;
    } else {
      pendingSendSats += payment.amount;
    }
  }

  return {
    identityPubkey: info.identityPubkey,
    balanceSats: info.balanceSats,
    pendingReceiveSats,
    pendingSendSats,
    network: networkRaw === 'testnet' ? 'testnet' : 'mainnet',
  };
}
