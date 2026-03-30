export type DisplayUnit = 'BTC' | 'mBTC' | 'sats';
export type NetworkType = 'mainnet' | 'testnet';
export type FeeRate = 'slow' | 'medium' | 'fast';

export interface WalletSettings {
  displayUnit: DisplayUnit;
  autoLockTimeout: number; // seconds; 0 = never
  biometricEnabled: boolean;
  pinHash: string;
  defaultFeeRate: FeeRate;
  network: NetworkType;
}

export interface Wallet {
  id: string;
  createdAt: number; // unix timestamp ms
  restoredAt?: number;
  settings: WalletSettings;
}
