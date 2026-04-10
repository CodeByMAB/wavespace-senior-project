import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ASYNC_KEYS } from '@constants/storage';

const hoisted = vi.hoisted(() => {
  const mockSdk = {
    disconnect: vi.fn(),
    prepareSendPayment: vi.fn(),
    listPayments: vi.fn().mockResolvedValue({ payments: [] }),
    getInfo: vi.fn().mockResolvedValue({
      identityPubkey: '02x',
      balanceSats: 0n,
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    parse: vi.fn(),
    receivePayment: vi.fn(),
    sendPayment: vi.fn(),
    prepareLnurlPay: vi.fn(),
    lnurlPay: vi.fn(),
  };
  const getItem = vi.fn();
  return { mockSdk, getItem };
});

vi.mock('@breeztech/breez-sdk-spark-react-native', () => {
  const Network = { Mainnet: 'Mainnet', Regtest: 'Regtest' };
  const PaymentStatus = { Completed: 'C', Pending: 'P', Failed: 'F' };
  const PaymentType = { Receive: 'R', Send: 'S' };
  const PaymentDetails_Tags = {};
  const OnchainConfirmationSpeed = {};
  const SendPaymentMethod_Tags = { BitcoinAddress: 'BA' };
  class SeedMnemonic {
    constructor(_o: unknown) {}
  }
  const SdkError = {
    instanceOf: () => false,
    Generic: { hasInner: () => false, getInner: () => [] as string[] },
    NetworkError: { hasInner: () => false, getInner: () => [] as string[] },
    StorageError: { hasInner: () => false, getInner: () => [] as string[] },
    InvalidInput: { hasInner: () => false, getInner: () => [] as string[] },
    SparkError: { hasInner: () => false, getInner: () => [] as string[] },
  };
  return {
    connect: vi.fn(async () => hoisted.mockSdk),
    defaultConfig: vi.fn((n: unknown) => ({ network: n })),
    Seed: { Mnemonic: SeedMnemonic },
    Network,
    OnchainConfirmationSpeed,
    PaymentStatus,
    PaymentType,
    ListPaymentsRequest: { create: vi.fn((x?: unknown) => x ?? {}) },
    PaymentDetails_Tags,
    PrepareSendPaymentRequest: { create: vi.fn((x?: unknown) => x ?? {}) },
    PrepareLnurlPayRequest: { create: vi.fn((x?: unknown) => x ?? {}) },
    LnurlPayRequest: { create: vi.fn((x?: unknown) => x ?? {}) },
    InputType: {},
    ReceivePaymentMethod: { Bolt11Invoice: { new: vi.fn(() => ({})) } },
    ReceivePaymentRequest: { create: vi.fn((x?: unknown) => x ?? {}) },
    SendPaymentMethod_Tags,
    SendPaymentOptions: { BitcoinAddress: { new: vi.fn(() => ({})) } },
    SendPaymentRequest: { create: vi.fn((x?: unknown) => x ?? {}) },
    SdkError,
    GetInfoRequest: { create: vi.fn((x?: unknown) => x ?? {}) },
  };
});

vi.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { breezApiKey: 'integration-key' } } },
}));

vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///tmp/doc/',
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: (...args: unknown[]) => hoisted.getItem(...args),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('@services/secureStorageService', () => ({
  getMnemonic: vi.fn().mockResolvedValue(
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  ),
  getPassphrase: vi.fn().mockResolvedValue(null),
}));

import {
  Network,
  connect,
  defaultConfig,
} from '@breeztech/breez-sdk-spark-react-native';
import { disconnectWallet, initializeWallet } from '@services/walletService';

describe('integration: SDK init and AsyncStorage network', () => {
  beforeEach(() => {
    vi.stubGlobal('__DEV__', false);
    vi.clearAllMocks();
    hoisted.getItem.mockImplementation((key: string) =>
      key === ASYNC_KEYS.NETWORK_SELECTION
        ? Promise.resolve('mainnet')
        : Promise.resolve(null),
    );
  });

  afterEach(async () => {
    await disconnectWallet();
    vi.unstubAllGlobals();
  });

  it('passes Mainnet to defaultConfig when mainnet is persisted', async () => {
    await initializeWallet();
    expect(defaultConfig).toHaveBeenCalledWith(Network.Mainnet);
    expect(connect).toHaveBeenCalled();
  });

  it('uses Regtest when AsyncStorage.getItem throws', async () => {
    hoisted.getItem.mockRejectedValue(new Error('unavailable'));
    await initializeWallet();
    expect(defaultConfig).toHaveBeenCalledWith(Network.Regtest);
  });
});
