import type { Channel, Transaction } from './wallet';

export type RootStackParamList = {
  Onboarding: undefined;
  Unlock: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  CreateWallet: undefined;
  MnemonicDisplay: { mnemonic: string };
  MnemonicConfirm: { mnemonic: string };
  RestoreWallet: undefined;
  PinSetup: undefined;
  BiometricSetup: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  TransactionsTab: undefined;
  SettingsTab: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  Send: { prefillInvoice?: string } | undefined;
  Receive: undefined;
  Withdraw: { scannedAddress?: string; scannedPayload?: string } | undefined;
  QRScanner: { returnScreen: 'Send' | 'Withdraw' };
  ChannelList: undefined;
  ChannelDetail: { channel: Channel };
  TransactionDetail: { transaction: Transaction };
};

export type TransactionsStackParamList = {
  TransactionHistory: undefined;
  TransactionDetail: { transaction: Transaction };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  NetworkSelection: undefined;
  DisplayUnits: undefined;
  SecuritySettings: undefined;
  ChangePIN: undefined;
  BackupExport: undefined;
  About: undefined;
};
