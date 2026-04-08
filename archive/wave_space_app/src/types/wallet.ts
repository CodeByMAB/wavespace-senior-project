export type TransactionType =
  | 'sent'
  | 'received'
  | 'pending_send'
  | 'pending_receive';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'expired';
export type ChannelState =
  | 'active'
  | 'inactive'
  | 'pending_open'
  | 'pending_close';
export type FeeSpeed = 'low' | 'medium' | 'high';
export type DisplayUnit = 'sats' | 'btc';
export type Network = 'testnet' | 'mainnet';

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

export interface WalletBalance {
  onchainConfirmedSats: number;
  onchainPendingSats: number;
  lightningBalanceSats: number;
  inboundLiquiditySats: number;
  outboundLiquiditySats: number;
  totalBalanceSats: number;
}

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

export interface FeeEstimate {
  low: number;
  medium: number;
  high: number;
}
