import type {WalletBalance} from '@/types/wallet';

export const mockWalletBalance: WalletBalance = {
  onchainConfirmedSats: 250000,
  onchainPendingSats: 0,
  lightningBalanceSats: 1500000,
  inboundLiquiditySats: 3500000,
  outboundLiquiditySats: 1500000,
  totalBalanceSats: 1750000,
};

export const MOCK_BTC_PRICE_USD = 97500;

export const MOCK_MNEMONIC = [
  'abandon',
  'ability',
  'able',
  'about',
  'above',
  'absent',
  'absorb',
  'abstract',
  'absurd',
  'abuse',
  'access',
  'accident',
];
