// --- Display / unit types ---
export type DisplayUnit = 'sats' | 'btc';
export type Network = 'testnet' | 'mainnet';
export type FeeRate = 'slow' | 'medium' | 'fast';
export type FeeSpeed = 'low' | 'medium' | 'high';

// --- Transaction types ---
export type TransactionType = 'sent' | 'received' | 'pending_send' | 'pending_receive';
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
}

// --- Channel types ---
export type ChannelState = 'active' | 'inactive' | 'pending_open' | 'pending_close';

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
}

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
  blockHeight: number;
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
