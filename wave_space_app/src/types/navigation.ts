import type {Transaction} from './wallet';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  CreateWallet: undefined;
  RestoreWallet: undefined;
  PinSetup: undefined;
  BiometricSetup: undefined;
};

export type AuthStackParamList = {
  PinEntry: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  TransactionsTab: undefined;
  SettingsTab: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  Send: {prefillInvoice?: string} | undefined;
  Receive: undefined;
  Withdraw: undefined;
  QRScanner: {returnScreen: 'Send' | 'Withdraw'};
  ChannelList: undefined;
  TransactionDetail: {transaction: Transaction};
};

export type TransactionsStackParamList = {
  TransactionHistory: undefined;
  TransactionDetail: {transaction: Transaction};
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
};
