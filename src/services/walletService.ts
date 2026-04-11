import Constants from 'expo-constants';
import {
  connect,
  defaultConfig,
  Seed,
  Network,
  OnchainConfirmationSpeed,
  PaymentStatus,
  PaymentType,
  ListPaymentsRequest,
  PaymentDetails_Tags,
  PrepareSendPaymentRequest,
  PrepareLnurlPayRequest,
  LnurlPayRequest,
  InputType,
  ReceivePaymentMethod,
  ReceivePaymentRequest,
  SendPaymentMethod_Tags,
  SendPaymentOptions,
  SendPaymentRequest,
  SdkError,
  type BreezSdkInterface,
  type EventListener,
  type GetInfoResponse,
  type Config,
  type Payment,
  type LnurlPayRequestDetails,
  GetInfoRequest,
} from '@breeztech/breez-sdk-spark-react-native';
import type { Channel, ChannelState, Transaction } from '@/types/wallet';

/** Result of creating a BOLT11 receive request, including LSP/service fee from the SDK. */
export interface LightningInvoiceResult {
  paymentRequest: string;
  feeSats: number;
}
import { documentDirectory } from 'expo-file-system/legacy';
import { getMnemonic, getPassphrase } from './secureStorageService';
import { detectPaymentType, type PaymentType as AppPaymentType } from '@utils/bitcoin';

let sdkInstance: BreezSdkInterface | null = null;
let loggedBreezKeyDiagnostics = false;
/** Serialized concurrent `initializeWallet()` calls onto one in-flight connect. */
let initializeWalletInFlight: Promise<BreezSdkInterface> | null = null;
/**
 * Set by `disconnectWallet()` while teardown runs. When true, an in-flight
 * `initializeWallet()` must not publish the connected SDK to `sdkInstance` and
 * must disconnect any instance that finished `connect()` after teardown was requested.
 */
let walletTeardownIntent = false;

function breezApiKeyLengthDiagnostics(): {
  extraBreezApiKeyLen: number;
  expoPublicBreezApiKeyLen: number;
  resolvedBreezApiKeyLen: number;
} {
  const extra = Constants.expoConfig?.extra as { breezApiKey?: string } | undefined;
  const fromExtra = typeof extra?.breezApiKey === 'string' ? extra.breezApiKey.trim() : '';
  const fromPublic =
    typeof process.env.EXPO_PUBLIC_BREEZ_API_KEY === 'string'
      ? process.env.EXPO_PUBLIC_BREEZ_API_KEY.trim()
      : '';
  const extraBreezApiKeyLen = fromExtra.length;
  const expoPublicBreezApiKeyLen = fromPublic.length;
  const resolved = fromExtra || fromPublic;
  return {
    extraBreezApiKeyLen,
    expoPublicBreezApiKeyLen,
    resolvedBreezApiKeyLen: resolved.length,
  };
}

/** __DEV__ only: logs key source lengths (never the secret) to verify EAS embed vs EXPO_PUBLIC bundle. */
function logBreezKeyDiagnosticsOnce(): void {
  if (!__DEV__ || loggedBreezKeyDiagnostics) return;
  loggedBreezKeyDiagnostics = true;
  const d = breezApiKeyLengthDiagnostics();
  console.log(
    '[WalletService] Breez API key lengths (extra = app config / native binary, expoPublic = Metro bundle, resolved = value passed to SDK):',
    {
      extraBreezApiKeyLen: d.extraBreezApiKeyLen,
      expoPublicBreezApiKeyLen: d.expoPublicBreezApiKeyLen,
      resolvedBreezApiKeyLen: d.resolvedBreezApiKeyLen,
    },
  );
}

/**
 * True when reconnect/backoff will not fix the failure (missing config or no wallet on device).
 */
export function walletInitFailureIsNonRetriable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return m.includes('breez api key') || m.includes('no wallet found');
}

function resolveBreezApiKey(): string {
  const extra = Constants.expoConfig?.extra as { breezApiKey?: string } | undefined;
  const fromExtra = typeof extra?.breezApiKey === 'string' ? extra.breezApiKey.trim() : '';
  const fromPublic =
    typeof process.env.EXPO_PUBLIC_BREEZ_API_KEY === 'string'
      ? process.env.EXPO_PUBLIC_BREEZ_API_KEY.trim()
      : '';
  const key = fromExtra || fromPublic;
  if (!key) {
    throw new Error(
      'Breez API key is not configured. Set a non-empty EXPO_PUBLIC_BREEZ_API_KEY in `.env` (or BREEZ_API_KEY for native embed), then run `npm run start:dev`. For EAS builds use `eas secret:create --name BREEZ_API_KEY ...` and rebuild.',
    );
  }
  return key;
}

function buildSdkConfig(network: Network): Config {
  const base = defaultConfig(network);
  return { ...base, apiKey: resolveBreezApiKey() };
}

// ─── Node State ──────────────────────────────────────────────────────────────

export interface NodeState {
  identityPubkey: string;
  balanceSats: bigint;
  pendingReceiveSats: bigint;
  pendingSendSats: bigint;
  /** Best-effort inbound liquidity proxy until channel APIs exist (see Channel Management ticket). */
  inboundLiquiditySats: bigint;
  /** Spendable Lightning balance as effective outbound capacity in the Spark model. */
  outboundLiquiditySats: bigint;
  /** Unix timestamp (ms) of the last Synced event, or null if not yet synced. */
  lastSyncedAt: number | null;
  network: 'mainnet';
}

/** Network of the active SDK session. Cleared on disconnect. */
let connectedSessionNetwork: NodeState['network'] | null = null;

// ─── Error Mapping ───────────────────────────────────────────────────────────

/**
 * Translates raw SDK exceptions into plain-language messages safe to show in
 * the UI. Technical details are kept out of the returned string.
 */
function sdkErrorDetail(err: unknown): string | undefined {
  if (!SdkError.instanceOf(err)) return undefined;
  if (SdkError.Generic.hasInner(err)) {
    return SdkError.Generic.getInner(err)[0];
  }
  if (SdkError.NetworkError.hasInner(err)) {
    return SdkError.NetworkError.getInner(err)[0];
  }
  if (SdkError.StorageError.hasInner(err)) {
    return SdkError.StorageError.getInner(err)[0];
  }
  if (SdkError.InvalidInput.hasInner(err)) {
    return SdkError.InvalidInput.getInner(err)[0];
  }
  if (SdkError.SparkError.hasInner(err)) {
    return SdkError.SparkError.getInner(err)[0];
  }
  return undefined;
}

export function mapSdkError(err: unknown, operation: string): string {
  const inner = sdkErrorDetail(err);
  if (inner) {
    const lower = inner.toLowerCase();
    if (
      lower.includes('api') &&
      (lower.includes('key') || lower.includes('auth') || lower.includes('unauthorized'))
    ) {
      return 'Breez API key is missing or not accepted. Set EXPO_PUBLIC_BREEZ_API_KEY or BREEZ_API_KEY and rebuild.';
    }
    if (lower.includes('storage') || lower.includes('database') || lower.includes('sqlite')) {
      return 'Wallet storage failed. Try restarting the app or freeing device storage.';
    }
    if (__DEV__) {
      return inner;
    }
  }

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('breez api key')) {
      return err.message;
    }
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
    if (msg.includes('missing an invoice string') || msg.includes('invalid invoice')) {
      return 'Invoice creation failed because the wallet returned an invalid invoice.';
    }
    if (msg.includes('document directory') || msg.includes('storage is not ready')) {
      return err.message;
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

export interface TransactionPage {
  transactions: Transaction[];
  nextCursor: string | null;
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
  /** When true, `__DEV__` uses `console.log` instead of `console.warn` (expected onboarding / config gaps). */
  expectedFailure?: boolean;
}): void {
  const { operation, attempt, error, context, expectedFailure } = params;
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
      if (expectedFailure) {
        console.log('[WalletService]', serialized);
      } else {
        console.warn('[WalletService]', serialized);
      }
    } else {
      console.log('[WalletService]', serialized);
    }
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
 * the Breez Spark network on Bitcoin mainnet, starting the
 * initial balance/history sync.
 *
 * @throws if the mnemonic is missing or SDK connection fails.
 */
export async function initializeWallet(): Promise<BreezSdkInterface> {
  if (sdkInstance) {
    return sdkInstance;
  }
  if (initializeWalletInFlight) {
    return initializeWalletInFlight;
  }

  initializeWalletInFlight = (async (): Promise<BreezSdkInterface> => {
    try {
      logBreezKeyDiagnosticsOnce();

      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        throw new Error('No wallet found. Please create or restore a wallet first.');
      }

      if (walletTeardownIntent) {
        throw new Error('Wallet disconnected during initialization.');
      }

      const passphrase = await getPassphrase();

      const seed = new Seed.Mnemonic({
        mnemonic,
        passphrase: passphrase ?? undefined,
      });

      const config = buildSdkConfig(Network.Mainnet);

      const docDir = (documentDirectory ?? '').replace(/^file:\/\//, '');
      if (!docDir) {
        throw new Error(
          'App storage is not available (document directory missing). Use an iOS/Android development build with expo-file-system.',
        );
      }
      const storageDir = `${docDir}breez-sdk`;

      if (walletTeardownIntent) {
        throw new Error('Wallet disconnected during initialization.');
      }

      const connected = await connect({ config, seed, storageDir });

      if (walletTeardownIntent) {
        try {
          await connected.disconnect();
        } catch {
          // Ignore disconnect errors during teardown
        }
        connectedSessionNetwork = null;
        throw new Error('Wallet disconnected during initialization.');
      }

      sdkInstance = connected;
      connectedSessionNetwork = 'mainnet';

      logWalletOperation({
        operation: 'initializeWallet',
        context: { network: connectedSessionNetwork },
      });

      return sdkInstance;
    } finally {
      initializeWalletInFlight = null;
    }
  })();

  return initializeWalletInFlight;
}

async function disconnectCurrentSdkInstance(): Promise<void> {
  if (!sdkInstance) return;
  try {
    await sdkInstance.disconnect();
  } catch {
    // Ignore disconnect errors during cleanup
  }
  sdkInstance = null;
  connectedSessionNetwork = null;
}

/**
 * Disconnects the active SDK instance and clears the cached reference.
 * Call on wallet reset or app lock.
 */
export async function disconnectWallet(): Promise<void> {
  walletTeardownIntent = true;
  try {
    await disconnectCurrentSdkInstance();

    if (initializeWalletInFlight) {
      try {
        await initializeWalletInFlight;
      } catch {
        // Init rejects when teardown wins over a pending connect; ignore
      }
    }

    await disconnectCurrentSdkInstance();
  } finally {
    walletTeardownIntent = false;
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

  const [info, pendingResponse] = await Promise.all([
    sdkInstance.getInfo(GetInfoRequest.create({ ensureSynced: undefined })),
    sdkInstance.listPayments(
      ListPaymentsRequest.create({ statusFilter: [PaymentStatus.Pending] }),
    ),
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
    inboundLiquiditySats: pendingReceiveSats,
    outboundLiquiditySats: info.balanceSats,
    network: connectedSessionNetwork ?? 'mainnet',
  };
}

function paymentTimestampMs(timestamp: bigint): number {
  const t = Number(timestamp);
  if (!Number.isFinite(t)) return Date.now();
  return t > 10_000_000_000 ? t : t * 1000;
}

/**
 * Best-effort mapping when the runtime exposes a `listChannels`-style API.
 * Unknown shapes are skipped so we never fabricate channel rows.
 */
function mapUnknownSdkChannel(raw: unknown): Channel | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id =
    typeof r.id === 'string'
      ? r.id
      : typeof r.channelId === 'string'
        ? r.channelId
        : typeof r.channel_id === 'string'
          ? r.channel_id
          : null;
  if (!id) return null;
  const remotePubkey =
    typeof r.remotePubkey === 'string'
      ? r.remotePubkey
      : typeof r.remote_pubkey === 'string'
        ? r.remote_pubkey
        : typeof r.counterparty === 'string'
          ? r.counterparty
          : '';
  const readNum = (v: unknown): number => {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
    if (typeof v === 'bigint') return Number(v);
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    }
    return 0;
  };
  const capacitySats = readNum(r.capacitySats ?? r.capacity_sat ?? r.capacity);
  const localBalanceSats = readNum(r.localBalanceSats ?? r.local_balance_sat ?? r.localBalance);
  const remoteBalanceSats = readNum(r.remoteBalanceSats ?? r.remote_balance_sat ?? r.remoteBalance);
  const shortChannelId =
    typeof r.shortChannelId === 'string'
      ? r.shortChannelId
      : typeof r.short_channel_id === 'string'
        ? r.short_channel_id
        : undefined;
  const channelPoint =
    typeof r.channelPoint === 'string'
      ? r.channelPoint
      : typeof r.channel_point === 'string'
        ? r.channel_point
        : undefined;
  const fundingTxid =
    typeof r.fundingTxid === 'string'
      ? r.fundingTxid
      : typeof r.funding_txid === 'string'
        ? r.funding_txid
        : typeof r.fundingTxId === 'string'
          ? r.fundingTxId
          : undefined;
  const openedAtMs =
    typeof r.openedAtMs === 'number'
      ? r.openedAtMs
      : typeof r.opened_at_ms === 'number'
        ? r.opened_at_ms
        : undefined;
  const totalSentSats = readNum(r.totalSentSats ?? r.total_sent_sats);
  const totalReceivedSats = readNum(r.totalReceivedSats ?? r.total_received_sats);
  const stateRaw =
    typeof r.state === 'string' ? r.state.toLowerCase().replace(/-/g, '_') : '';
  let state: ChannelState = 'inactive';
  let isUsable = false;
  switch (stateRaw) {
    case 'active':
    case 'channel_normal':
      state = 'active';
      isUsable = true;
      break;
    case 'inactive':
    case 'offline':
      state = 'inactive';
      break;
    case 'pending_open':
    case 'opening':
      state = 'pending_open';
      break;
    case 'pending_close':
    case 'closing':
      state = 'pending_close';
      break;
    case 'closed':
      state = 'closed';
      break;
    default:
      if (localBalanceSats > 0 || remoteBalanceSats > 0) {
        state = 'active';
        isUsable = true;
      }
  }
  return {
    id,
    remotePubkey,
    remoteAlias: typeof r.remoteAlias === 'string' ? r.remoteAlias : undefined,
    capacitySats,
    localBalanceSats,
    remoteBalanceSats,
    state,
    isUsable,
    shortChannelId,
    channelPoint,
    fundingTxid,
    openedAtMs: openedAtMs || undefined,
    totalSentSats: totalSentSats || undefined,
    totalReceivedSats: totalReceivedSats || undefined,
  };
}

async function tryListSdkChannels(): Promise<Channel[]> {
  const inst = sdkInstance as unknown as {
    listChannels?: (req?: unknown) => Promise<{ channels?: unknown[] } | unknown[]>;
  };
  if (typeof inst.listChannels !== 'function') return [];
  try {
    const res = await inst.listChannels();
    const list = Array.isArray(res) ? res : res?.channels;
    if (!Array.isArray(list)) return [];
    const out: Channel[] = [];
    for (const raw of list) {
      const c = mapUnknownSdkChannel(raw);
      if (c) out.push(c);
    }
    return out;
  } catch (err) {
    logWalletOperation({ operation: 'tryListSdkChannels', error: err });
    return [];
  }
}

/**
 * Lists Lightning channels: prefers real SDK channel records when the runtime
 * exposes them; otherwise derives a single Spark aggregate row only when there
 * is meaningful liquidity or Lightning activity (never an always-on fake row).
 */
export async function getChannels(): Promise<Channel[]> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }
  try {
    const fromSdk = await tryListSdkChannels();
    if (fromSdk.length > 0) return fromSdk;

    const [ns, paymentsRes] = await Promise.all([
      getNodeState(),
      sdkInstance.listPayments(ListPaymentsRequest.create({})),
    ]);

    let totalSentSats = 0;
    let totalReceivedSats = 0;
    let openedAtMs: number | undefined;

    for (const p of paymentsRes.payments) {
      if (p.status !== PaymentStatus.Completed) continue;
      if (p.paymentType === PaymentType.Receive) {
        totalReceivedSats += Number(p.amount);
        const ms = paymentTimestampMs(p.timestamp);
        openedAtMs = openedAtMs === undefined ? ms : Math.min(openedAtMs, ms);
      } else if (p.paymentType === PaymentType.Send) {
        totalSentSats += Number(p.amount);
      }
    }

    const balance = ns.balanceSats;
    const pendingR = ns.pendingReceiveSats;
    const pendingS = ns.pendingSendSats;
    const hasMeaningfulActivity =
      balance > 0n ||
      pendingR > 0n ||
      pendingS > 0n ||
      totalReceivedSats > 0 ||
      totalSentSats > 0;

    if (!hasMeaningfulActivity) return [];

    const localBalanceSats = Number(balance);
    const remoteBalanceSats = Number(ns.inboundLiquiditySats);
    const capacitySats = localBalanceSats + remoteBalanceSats;

    let state: ChannelState;
    let isUsable: boolean;
    if (pendingR > 0n) {
      state = 'pending_open';
      isUsable = false;
    } else if (balance > 0n) {
      state = 'active';
      isUsable = true;
    } else if (pendingS > 0n) {
      state = 'pending_close';
      isUsable = false;
    } else {
      state = 'closed';
      isUsable = false;
    }

    return [
      {
        id: 'spark-aggregate',
        remotePubkey: ns.identityPubkey || 'spark-network',
        remoteAlias: 'Spark liquidity',
        capacitySats,
        localBalanceSats,
        remoteBalanceSats,
        state,
        isUsable,
        shortChannelId: undefined,
        channelPoint: undefined,
        fundingTxid: undefined,
        openedAtMs,
        totalSentSats: totalSentSats > 0 ? totalSentSats : undefined,
        totalReceivedSats: totalReceivedSats > 0 ? totalReceivedSats : undefined,
      },
    ];
  } catch (err) {
    logWalletOperation({ operation: 'getChannels', error: err });
    throw new Error(mapSdkError(err, 'list channels'));
  }
}

function mapPaymentStatus(status: PaymentStatus): Transaction['status'] {
  switch (status) {
    case PaymentStatus.Completed:
      return 'completed';
    case PaymentStatus.Pending:
      return 'pending';
    case PaymentStatus.Failed:
      return 'failed';
    default:
      return 'pending';
  }
}

function readWithdrawConfirmations(details: unknown): number {
  if (!details || typeof details !== 'object') return 0;
  const candidate = details as Record<string, unknown>;
  const raw =
    candidate.confirmations ??
    candidate.confirmationCount ??
    candidate.numConfirmations ??
    0;
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function confirmationTargetFor(confirmations: number): 0 | 1 | 6 {
  if (confirmations >= 6) return 6;
  if (confirmations >= 1) return 1;
  return 0;
}

export function mapPaymentToTransaction(payment: Payment): Transaction {
  const d = payment.details;
  const isWithdraw = d?.tag === PaymentDetails_Tags.Withdraw;
  const type: Transaction['type'] = isWithdraw
    ? payment.status === PaymentStatus.Pending
      ? 'pending_withdrawal'
      : 'withdrawal'
    : payment.paymentType === PaymentType.Receive
      ? 'received'
      : 'sent';

  let description: string | undefined;
  let bolt11: string | undefined;
  if (d) {
    if (d.tag === PaymentDetails_Tags.Lightning) {
      description = d.inner.description;
      bolt11 = d.inner.invoice;
    } else if (d.tag === PaymentDetails_Tags.Spark && d.inner.invoiceDetails) {
      description = d.inner.invoiceDetails.description;
      bolt11 = d.inner.invoiceDetails.invoice;
    } else if (d.tag === PaymentDetails_Tags.Token && d.inner.invoiceDetails) {
      description = d.inner.invoiceDetails.description;
      bolt11 = d.inner.invoiceDetails.invoice;
    } else if (d.tag === PaymentDetails_Tags.Withdraw) {
      description = 'On-chain withdrawal';
    }
  }

  const withdrawTxid = d?.tag === PaymentDetails_Tags.Withdraw ? d.inner.txId : undefined;
  const withdrawDetails =
    d?.tag === PaymentDetails_Tags.Withdraw
      ? (d.inner as unknown as Record<string, unknown>)
      : undefined;
  const withdrawDestination =
    typeof withdrawDetails?.address === 'string'
      ? withdrawDetails.address
      : typeof withdrawDetails?.destinationAddress === 'string'
        ? withdrawDetails.destinationAddress
        : typeof withdrawDetails?.destination === 'string'
          ? withdrawDetails.destination
          : undefined;
  const confirmations =
    d?.tag === PaymentDetails_Tags.Withdraw
      ? readWithdrawConfirmations(d.inner)
      : undefined;

  return {
    id: payment.id,
    type,
    status: mapPaymentStatus(payment.status),
    amountSats: Number(payment.amount),
    feeSats: Number(payment.fees),
    timestamp: Number(payment.timestamp),
    description,
    destination: withdrawDestination,
    bolt11,
    txid: withdrawTxid,
    confirmations,
    confirmationTarget: isWithdraw ? confirmationTargetFor(confirmations ?? 0) : undefined,
  };
}

/**
 * Lists all payments from the SDK and maps them to app {@link Transaction} rows.
 */
export async function listTransactions(): Promise<Transaction[]> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }
  try {
    const res = await sdkInstance.listPayments(ListPaymentsRequest.create({}));
    return res.payments.map(mapPaymentToTransaction);
  } catch (err) {
    throw new Error(mapSdkError(err, 'list transactions'));
  }
}

export async function listTransactionsPage(params?: {
  cursor?: string | null;
  limit?: number;
}): Promise<TransactionPage> {
  const limit = params?.limit ?? 50;
  const startIndex = Number.parseInt(params?.cursor ?? '0', 10);
  const safeStartIndex =
    Number.isFinite(startIndex) && startIndex >= 0 ? startIndex : 0;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 50;

  const transactions = await listTransactions();
  const page = transactions.slice(safeStartIndex, safeStartIndex + safeLimit);
  const nextIndex = safeStartIndex + page.length;
  return {
    transactions: page,
    nextCursor: nextIndex < transactions.length ? String(nextIndex) : null,
  };
}

export function mapFeeRateToConfirmationSpeed(satPerVbyte: number): OnchainConfirmationSpeed {
  if (satPerVbyte <= 2) return OnchainConfirmationSpeed.Slow;
  if (satPerVbyte <= 10) return OnchainConfirmationSpeed.Medium;
  return OnchainConfirmationSpeed.Fast;
}

function readQuotedFeeSats(prepareResponse: Awaited<ReturnType<BreezSdkInterface['prepareSendPayment']>>, satPerVbyte: number): number {
  if (prepareResponse.paymentMethod.tag !== SendPaymentMethod_Tags.BitcoinAddress) {
    throw new Error('Payment request is not an on-chain Bitcoin address.');
  }

  const quote = prepareResponse.paymentMethod.inner.feeQuote;
  const speed = mapFeeRateToConfirmationSpeed(satPerVbyte);
  if (speed === OnchainConfirmationSpeed.Slow) return Number(quote.speedSlow.userFeeSat);
  if (speed === OnchainConfirmationSpeed.Medium) return Number(quote.speedMedium.userFeeSat);
  return Number(quote.speedFast.userFeeSat);
}

/**
 * Sum of Lightning + Spark transfer fees from a prepare-send quote (BOLT11 / Spark invoice paths).
 */
function feeSatsFromPrepareSendLightning(
  response: Awaited<ReturnType<BreezSdkInterface['prepareSendPayment']>>,
): number {
  const pm = response.paymentMethod;
  if (pm.tag === SendPaymentMethod_Tags.Bolt11Invoice) {
    const ln = Number(pm.inner.lightningFeeSats);
    const spark =
      pm.inner.sparkTransferFeeSats !== undefined && pm.inner.sparkTransferFeeSats !== null
        ? Number(pm.inner.sparkTransferFeeSats)
        : 0;
    const sum = (Number.isFinite(ln) ? ln : 0) + (Number.isFinite(spark) ? spark : 0);
    return Math.max(0, Math.floor(sum));
  }
  if (pm.tag === SendPaymentMethod_Tags.SparkAddress) {
    return Math.max(0, Math.floor(Number(pm.inner.fee)));
  }
  if (pm.tag === SendPaymentMethod_Tags.SparkInvoice) {
    return Math.max(0, Math.floor(Number(pm.inner.fee)));
  }
  return 0;
}

/**
 * Returns the wallet SDK fee quote for a Lightning send, or null if the input is not a supported
 * Lightning destination or the quote cannot be fetched.
 */
export async function estimateLightningSendFee(
  rawInput: string,
  amountSats: number,
  hintType?: AppPaymentType,
): Promise<number | null> {
  if (!sdkInstance) {
    return null;
  }

  const trimmed = rawInput.trim();
  if (!trimmed || !Number.isFinite(amountSats) || amountSats <= 0) {
    return null;
  }

  const detected = detectPaymentType(trimmed);
  const kind: AppPaymentType =
    detected.type !== 'unknown'
      ? detected.type
      : hintType && hintType !== 'unknown'
        ? hintType
        : 'unknown';

  if (kind === 'bitcoin_address' || kind === 'unknown') {
    return null;
  }

  const amountArg = BigInt(Math.floor(amountSats));

  try {
    if (kind === 'lightning_invoice') {
      const payReq = detected.normalizedValue || trimmed;
      const prepareResponse = await sdkInstance.prepareSendPayment(
        PrepareSendPaymentRequest.create({
          paymentRequest: payReq,
          amount: amountArg,
          tokenIdentifier: undefined,
          conversionOptions: undefined,
          feePolicy: undefined,
        }),
      );
      return feeSatsFromPrepareSendLightning(prepareResponse);
    }

    let parsed;
    try {
      parsed = await sdkInstance.parse(trimmed);
    } catch {
      return null;
    }

    if (InputType.LnurlPay.instanceOf(parsed)) {
      const prep = await sdkInstance.prepareLnurlPay(
        PrepareLnurlPayRequest.create({
          amountSats: amountArg,
          payRequest: parsed.inner[0],
          comment: undefined,
          validateSuccessActionUrl: undefined,
          conversionOptions: undefined,
          feePolicy: undefined,
        }),
      );
      const lnurlFee = Number(prep.feeSats);
      if (!Number.isFinite(lnurlFee)) return null;
      return Math.max(0, Math.floor(lnurlFee));
    }

    if (InputType.LightningAddress.instanceOf(parsed)) {
      const prep = await sdkInstance.prepareLnurlPay(
        PrepareLnurlPayRequest.create({
          amountSats: amountArg,
          payRequest: parsed.inner[0].payRequest,
          comment: undefined,
          validateSuccessActionUrl: undefined,
          conversionOptions: undefined,
          feePolicy: undefined,
        }),
      );
      const addrFee = Number(prep.feeSats);
      if (!Number.isFinite(addrFee)) return null;
      return Math.max(0, Math.floor(addrFee));
    }

    if (InputType.Bolt11Invoice.instanceOf(parsed)) {
      const prepareResponse = await sdkInstance.prepareSendPayment(
        PrepareSendPaymentRequest.create({
          paymentRequest: parsed.inner[0].invoice.bolt11,
          amount: amountArg,
          tokenIdentifier: undefined,
          conversionOptions: undefined,
          feePolicy: undefined,
        }),
      );
      return feeSatsFromPrepareSendLightning(prepareResponse);
    }

    return null;
  } catch {
    return null;
  }
}

export async function estimateWithdrawalFee(
  address: string,
  amountSats: number,
  satPerVbyte: number
): Promise<number> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }

  try {
    const prepareResponse = await sdkInstance.prepareSendPayment(
      PrepareSendPaymentRequest.create({
        paymentRequest: address,
        amount: BigInt(amountSats),
        tokenIdentifier: undefined,
        conversionOptions: undefined,
        feePolicy: undefined,
      })
    );

    return readQuotedFeeSats(prepareResponse, satPerVbyte);
  } catch (err) {
    throw new Error(mapSdkError(err, 'estimate withdrawal fee'));
  }
}

export async function validateWithdrawalAddress(address: string): Promise<boolean> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }

  try {
    await sdkInstance.prepareSendPayment(
      PrepareSendPaymentRequest.create({
        paymentRequest: address,
        amount: BigInt(1),
        tokenIdentifier: undefined,
        conversionOptions: undefined,
        feePolicy: undefined,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export async function executeWithdrawal(
  address: string,
  amountSats: number,
  satPerVbyte: number
): Promise<string> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }

  try {
    const confirmationSpeed = mapFeeRateToConfirmationSpeed(satPerVbyte);
    const prepareResponse = await sdkInstance.prepareSendPayment(
      PrepareSendPaymentRequest.create({
        paymentRequest: address,
        amount: BigInt(amountSats),
        tokenIdentifier: undefined,
        conversionOptions: undefined,
        feePolicy: undefined,
      })
    );

    const sendResponse = await sdkInstance.sendPayment(
      SendPaymentRequest.create({
        prepareResponse,
        options: SendPaymentOptions.BitcoinAddress.new({ confirmationSpeed }),
        idempotencyKey: undefined,
      })
    );

    if (
      sendResponse.payment.details &&
      sendResponse.payment.details.tag === PaymentDetails_Tags.Withdraw
    ) {
      return sendResponse.payment.details.inner.txId;
    }

    return sendResponse.payment.id;
  } catch (err) {
    throw new Error(mapSdkError(err, 'withdrawal'));
  }
}

export async function sendLightningPayment(
  invoice: string,
  amountSats?: number,
): Promise<Payment> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }

  try {
    const prepareResponse = await sdkInstance.prepareSendPayment(
      PrepareSendPaymentRequest.create({
        paymentRequest: invoice,
        amount: amountSats ? BigInt(amountSats) : undefined,
        tokenIdentifier: undefined,
        conversionOptions: undefined,
        feePolicy: undefined,
      }),
    );

    const sendResponse = await sdkInstance.sendPayment(
      SendPaymentRequest.create({
        prepareResponse,
        options: undefined,
        idempotencyKey: undefined,
      }),
    );

    return sendResponse.payment;
  } catch (err) {
    throw new Error(mapSdkError(err, 'send lightning payment'));
  }
}

async function sendLnurlPayWithDetails(
  payRequest: LnurlPayRequestDetails,
  amountSats: number,
): Promise<Payment> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }

  try {
    const prepareResponse = await sdkInstance.prepareLnurlPay(
      PrepareLnurlPayRequest.create({
        amountSats: BigInt(amountSats),
        payRequest,
        comment: undefined,
        validateSuccessActionUrl: undefined,
        conversionOptions: undefined,
        feePolicy: undefined,
      }),
    );

    const lnPayResponse = await sdkInstance.lnurlPay(
      LnurlPayRequest.create({
        prepareResponse,
        idempotencyKey: undefined,
      }),
    );

    return lnPayResponse.payment;
  } catch (err) {
    throw new Error(mapSdkError(err, 'send LNURL payment'));
  }
}

/**
 * Sends a Lightning payment using the appropriate SDK path: BOLT11 for invoices,
 * {@link BreezSdkInterface.parse} + LNURL-pay for LNURL and Lightning addresses.
 */
export async function sendLightningPaymentResolved(
  rawInput: string,
  amountSats: number,
  hintType?: AppPaymentType,
): Promise<Payment> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Enter a recipient, invoice, or payment link.');
  }

  const detected = detectPaymentType(trimmed);
  const kind: AppPaymentType =
    detected.type !== 'unknown'
      ? detected.type
      : hintType && hintType !== 'unknown'
        ? hintType
        : 'unknown';

  if (kind === 'bitcoin_address') {
    throw new Error('Bitcoin on-chain addresses cannot be sent from this screen. Use Withdraw instead.');
  }

  if (kind === 'unknown') {
    throw new Error(
      'Unrecognized payment format. Use a Lightning invoice (BOLT11), an LNURL-pay link, or a Lightning address.',
    );
  }

  if (kind === 'lightning_invoice') {
    const payReq = detected.normalizedValue || trimmed;
    return sendLightningPayment(payReq, amountSats);
  }

  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }

  let parsed;
  try {
    parsed = await sdkInstance.parse(trimmed);
  } catch (err) {
    throw new Error(mapSdkError(err, 'resolve payment'));
  }

  if (InputType.LnurlPay.instanceOf(parsed)) {
    return sendLnurlPayWithDetails(parsed.inner[0], amountSats);
  }

  if (InputType.LightningAddress.instanceOf(parsed)) {
    return sendLnurlPayWithDetails(parsed.inner[0].payRequest, amountSats);
  }

  if (InputType.Bolt11Invoice.instanceOf(parsed)) {
    return sendLightningPayment(parsed.inner[0].invoice.bolt11, amountSats);
  }

  throw new Error(
    'This payment type is not supported for Send. Use a Lightning invoice, LNURL-pay, or Lightning address.',
  );
}

export async function createLightningInvoice(
  amountSats: number,
  description?: string,
): Promise<LightningInvoiceResult> {
  if (!sdkInstance) {
    throw new Error('Wallet not initialized. Call initializeWallet() first.');
  }

  const amountSatsSafe =
    Number.isFinite(amountSats) && amountSats > 0 ? BigInt(Math.floor(amountSats)) : undefined;

  try {
    const response = await sdkInstance.receivePayment(
      ReceivePaymentRequest.create({
        paymentMethod: ReceivePaymentMethod.Bolt11Invoice.new({
          description: description ?? '',
          amountSats: amountSatsSafe,
          expirySecs: undefined,
          paymentHash: undefined,
        }),
      }),
    );

    const pr = response.paymentRequest?.trim();
    if (!pr) {
      throw new Error('Invoice response from wallet SDK was missing an invoice string.');
    }
    const feeRaw = response.fee;
    const feeSats =
      typeof feeRaw === 'bigint'
        ? Number(feeRaw)
        : typeof feeRaw === 'number' && Number.isFinite(feeRaw)
          ? Math.max(0, Math.floor(feeRaw))
          : 0;
    return { paymentRequest: pr, feeSats };
  } catch (err) {
    throw new Error(mapSdkError(err, 'create invoice'));
  }
}
