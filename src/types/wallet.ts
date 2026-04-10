// --- Display / unit types ---
export type DisplayUnit = 'sats' | 'btc';
/** Bitcoin mainnet only; testnet is not supported. */
export type Network = 'mainnet';
export type FeeRate = 'slow' | 'medium' | 'fast';
export type FeeSpeed = 'low' | 'medium' | 'high';

// --- Transaction types ---
export type TransactionType =
  | 'sent'
  | 'received'
  | 'pending_send'
  | 'pending_receive'
  | 'withdrawal'
  | 'pending_withdrawal';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'expired';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amountSats: number;
  feeSats: number;
  timestamp: number;
  description?: string;
  paymentHash?: string;
  preimage?: string;
  destination?: string;
  bolt11?: string;
  txid?: string;
  confirmations?: number;
  confirmationTarget?: 0 | 1 | 6;
}

// --- Channel types ---
export type ChannelState =
  | 'active'
  | 'inactive'
  | 'pending_open'
  | 'pending_close'
  | 'closed';

export interface Channel {
  id: string;
  remotePubkey: string;
  remoteAlias?: string;
  capacitySats: number;
  localBalanceSats: number;
  remoteBalanceSats: number;
  state: ChannelState;
  isUsable: boolean;
  shortChannelId?: string;
  /** BOLT-style funding outpoint `txid:vout` when known. */
  channelPoint?: string;
  /** On-chain funding transaction id when known. */
  fundingTxid?: string;
  /** When the channel was first opened / became usable (epoch ms), if known. */
  openedAtMs?: number;
  /** Total completed outbound Lightning volume for this channel (sats), when tracked. */
  totalSentSats?: number;
  /** Total completed inbound Lightning volume for this channel (sats), when tracked. */
  totalReceivedSats?: number;
}

/** UI state while monitoring inbound liquidity / optimization after confirming a receive invoice. */
export type ReceiveChannelOpeningState =
  | { status: 'idle' }
  | {
      status: 'opening';
      message: string;
      currentRound: number;
      totalRounds: number;
      isOptimizing: boolean;
    }
  | { status: 'failed'; message: string };

// --- Balance ---
export interface WalletBalance {
  onchainConfirmedSats: number;
  onchainPendingSats: number;
  lightningBalanceSats: number;
  inboundLiquiditySats: number;
  outboundLiquiditySats: number;
  totalBalanceSats: number;
}

// --- Full wallet state (used by WalletContext) ---
export interface WalletState {
  isInitialized: boolean;
  isUnlocked: boolean;
  balance: WalletBalance;
  transactions: Transaction[];
  channels: Channel[];
  network: Network;
  displayUnit: DisplayUnit;
  nodeId: string;
  isSyncing: boolean;
}

// --- Settings ---
export interface WalletSettings {
  displayUnit: DisplayUnit;
  autoLockTimeout: number; // seconds; 0 = never
  biometricEnabled: boolean;
  pinHash: string;
  defaultFeeRate: FeeRate;
  network: Network;
}

export interface Wallet {
  id: string;
  createdAt: number; // unix timestamp ms
  restoredAt?: number;
  settings: WalletSettings;
}

export interface FeeEstimate {
  low: number;
  medium: number;
  high: number;
}
