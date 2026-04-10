import type { Transaction } from './wallet';
import type { PaymentType } from '@/utils/bitcoin';

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
  RestoreEncryptedBackup: undefined;
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
  Send:
    | {
        prefillInvoice?: string;
        prefillAddress?: string;
        paymentType?: PaymentType;
      }
    | undefined;
  Receive: undefined;
  Withdraw: { scannedAddress?: string; scannedPayload?: string } | undefined;
  QRScanner: { returnScreen: 'Send' | 'Withdraw' };
  TransactionDetail: { transaction: Transaction };
};

export type TransactionsStackParamList = {
  TransactionHistory: undefined;
  TransactionDetail: { transaction: Transaction };
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  DisplayUnits: undefined;
  SecuritySettings: undefined;
  ChangePIN: undefined;
  BackupExport: undefined;
  About: undefined;
};
