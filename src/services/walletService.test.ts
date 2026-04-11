import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => {
  const prepareSendPayment = vi.fn();
  const mockSdk = {
    disconnect: vi.fn(),
    prepareSendPayment,
    listPayments: vi.fn(),
    getInfo: vi.fn(),
    addEventListener: vi.fn().mockResolvedValue('listener-id'),
    removeEventListener: vi.fn(),
    parse: vi.fn(),
    receivePayment: vi.fn(),
    sendPayment: vi.fn(),
    prepareLnurlPay: vi.fn(),
    lnurlPay: vi.fn(),
  };
  return { prepareSendPayment, mockSdk };
});

vi.mock('@breeztech/breez-sdk-spark-react-native', () => {
  const PaymentStatus = {
    Completed: 'Completed',
    Pending: 'Pending',
    Failed: 'Failed',
  };
  const PaymentType = { Receive: 'Receive', Send: 'Send' };
  const PaymentDetails_Tags = {
    Withdraw: 'Withdraw',
    Lightning: 'Lightning',
    Spark: 'Spark',
    Token: 'Token',
  };
  const Network = { Mainnet: 'Mainnet', Regtest: 'Regtest' };
  const OnchainConfirmationSpeed = {
    Slow: 'Slow',
    Medium: 'Medium',
    Fast: 'Fast',
  };
  const SendPaymentMethod_Tags = {
    BitcoinAddress: 'BitcoinAddress',
    Bolt11Invoice: 'Bolt11Invoice',
    SparkAddress: 'SparkAddress',
    SparkInvoice: 'SparkInvoice',
  };

  const SdkError = {
    instanceOf: (e: unknown) =>
      typeof e === 'object' && e !== null && '__sdkInner' in (e as object),
    Generic: {
      hasInner: (e: unknown) =>
        (e as { __sdkKind?: string })?.__sdkKind === 'generic',
      getInner: (e: unknown) => [(e as { __sdkInner: string }).__sdkInner],
    },
    NetworkError: {
      hasInner: (e: unknown) =>
        (e as { __sdkKind?: string })?.__sdkKind === 'network',
      getInner: (e: unknown) => [(e as { __sdkInner: string }).__sdkInner],
    },
    StorageError: {
      hasInner: (e: unknown) =>
        (e as { __sdkKind?: string })?.__sdkKind === 'storage',
      getInner: (e: unknown) => [(e as { __sdkInner: string }).__sdkInner],
    },
    InvalidInput: {
      hasInner: (e: unknown) =>
        (e as { __sdkKind?: string })?.__sdkKind === 'invalid',
      getInner: (e: unknown) => [(e as { __sdkInner: string }).__sdkInner],
    },
    SparkError: {
      hasInner: (e: unknown) =>
        (e as { __sdkKind?: string })?.__sdkKind === 'spark',
      getInner: (e: unknown) => [(e as { __sdkInner: string }).__sdkInner],
    },
  };

  class SeedMnemonic {
    constructor(_opts: unknown) {}
  }

  const InputType = {
    LnurlPay: {
      instanceOf: (p: unknown) =>
        typeof p === 'object' &&
        p !== null &&
        (p as { __shape?: string }).__shape === 'lnurlpay',
    },
    LightningAddress: {
      instanceOf: (p: unknown) =>
        typeof p === 'object' &&
        p !== null &&
        (p as { __shape?: string }).__shape === 'lnaddr',
    },
    Bolt11Invoice: {
      instanceOf: (p: unknown) =>
        typeof p === 'object' &&
        p !== null &&
        (p as { __shape?: string }).__shape === 'bolt11',
    },
  };

  return {
    connect: vi.fn(async () => hoisted.mockSdk),
    defaultConfig: vi.fn(() => ({})),
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
    InputType,
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
  default: {
    expoConfig: { extra: { breezApiKey: 'test-breez-key' } },
  },
}));

vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///tmp/doc/',
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue('mainnet'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('./secureStorageService', () => ({
  getMnemonic: vi.fn().mockResolvedValue(
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  ),
  getPassphrase: vi.fn().mockResolvedValue(null),
}));

import {
  OnchainConfirmationSpeed,
  PaymentDetails_Tags,
  PaymentStatus,
  PaymentType,
  SendPaymentMethod_Tags,
} from '@breeztech/breez-sdk-spark-react-native';
import type {
  EventListener,
  Payment,
} from '@breeztech/breez-sdk-spark-react-native';
import {
  createLightningInvoice,
  disconnectWallet,
  estimateLightningSendFee,
  estimateWithdrawalFee,
  executeWithdrawal,
  getChannels,
  getNodeState,
  getWalletInfo,
  getWalletInstance,
  initializeWallet,
  listTransactions,
  listTransactionsPage,
  logWalletOperation,
  mapFeeRateToConfirmationSpeed,
  mapPaymentToTransaction,
  mapSdkError,
  registerEventListener,
  removeEventListener,
  sendLightningPayment,
  sendLightningPaymentResolved,
  validateWithdrawalAddress,
  walletInitFailureIsNonRetriable,
} from './walletService';

function paymentBase(): Payment {
  return {
    id: 'p1',
    amount: 1000n,
    fees: 5n,
    timestamp: 1_700_000_000n,
    paymentType: PaymentType.Receive,
    status: PaymentStatus.Completed,
    details: undefined,
  } as Payment;
}

describe('walletService', () => {
  beforeEach(() => {
    vi.stubGlobal('__DEV__', false);
    hoisted.prepareSendPayment.mockReset();
    hoisted.prepareSendPayment.mockResolvedValue({
      paymentMethod: {
        tag: SendPaymentMethod_Tags.BitcoinAddress,
        inner: {
          feeQuote: {
            speedSlow: { userFeeSat: 10n },
            speedMedium: { userFeeSat: 20n },
            speedFast: { userFeeSat: 30n },
          },
        },
      },
    });

    hoisted.mockSdk.listPayments.mockImplementation(
      async (req: { statusFilter?: string[] } | undefined) => {
        if (req?.statusFilter?.includes('Pending')) {
          return {
            payments: [
              {
                ...paymentBase(),
                id: 'pend',
                paymentType: PaymentType.Receive,
                status: PaymentStatus.Pending,
                amount: 50n,
              } as Payment,
            ],
          };
        }
        return {
          payments: [
            {
              ...paymentBase(),
              id: 'done1',
              paymentType: PaymentType.Receive,
              status: PaymentStatus.Completed,
              amount: 200n,
            } as Payment,
          ],
        };
      },
    );
    hoisted.mockSdk.getInfo.mockResolvedValue({
      identityPubkey: '02abc',
      balanceSats: 10_000n,
    });
    hoisted.mockSdk.receivePayment.mockResolvedValue({
      paymentRequest: 'lnbc1invoice',
      fee: 3n,
    });
    hoisted.mockSdk.sendPayment.mockResolvedValue({
      payment: {
        id: 'sent1',
        amount: 100n,
        fees: 1n,
        timestamp: 1n,
        paymentType: PaymentType.Send,
        status: PaymentStatus.Completed,
        details: {
          tag: PaymentDetails_Tags.Withdraw,
          inner: { txId: 'onchain-tx' },
        },
      } as Payment,
    });
    hoisted.mockSdk.prepareLnurlPay.mockResolvedValue({});
    hoisted.mockSdk.lnurlPay.mockResolvedValue({
      payment: {
        ...paymentBase(),
        id: 'lnurl-pay',
        paymentType: PaymentType.Send,
      } as Payment,
    });
    hoisted.mockSdk.parse.mockReset();
    hoisted.mockSdk.disconnect.mockClear();
    hoisted.mockSdk.removeEventListener.mockClear();
  });

  afterEach(async () => {
    await disconnectWallet();
    vi.unstubAllGlobals();
  });

  describe('walletInitFailureIsNonRetriable', () => {
    it('is true for missing API key and no-wallet errors', () => {
      expect(walletInitFailureIsNonRetriable(new Error('Breez API key is not configured.'))).toBe(
        true,
      );
      expect(
        walletInitFailureIsNonRetriable(new Error('No wallet found. Please create or restore first.')),
      ).toBe(true);
      expect(walletInitFailureIsNonRetriable(new Error('network timeout'))).toBe(false);
    });
  });

  describe('mapSdkError', () => {
    it('maps Generic SDK inner mentioning API key', () => {
      const err = { __sdkKind: 'generic', __sdkInner: 'Unauthorized API key' };
      expect(mapSdkError(err, 'op')).toBe(
        'Breez API key is missing or not accepted. Set EXPO_PUBLIC_BREEZ_API_KEY or BREEZ_API_KEY and rebuild.',
      );
    });

    it('maps StorageError inner mentioning sqlite', () => {
      const err = { __sdkKind: 'storage', __sdkInner: 'sqlite database locked' };
      expect(mapSdkError(err, 'op')).toBe(
        'Wallet storage failed. Try restarting the app or freeing device storage.',
      );
    });

    it('returns raw inner in __DEV__ when SdkError has no friendly mapping', () => {
      vi.stubGlobal('__DEV__', true);
      const err = { __sdkKind: 'generic', __sdkInner: 'Some technical detail' };
      expect(mapSdkError(err, 'op')).toBe('Some technical detail');
    });

    it('maps NetworkError inner in __DEV__', () => {
      vi.stubGlobal('__DEV__', true);
      const err = { __sdkKind: 'network', __sdkInner: 'socket closed' };
      expect(mapSdkError(err, 'op')).toBe('socket closed');
    });

    it('maps Error timeout message', () => {
      expect(
        mapSdkError(new Error('Request timed out'), 'op'),
      ).toBe('Connection timed out. Please check your network and try again.');
    });

    it('maps insufficient balance Error', () => {
      expect(
        mapSdkError(new Error('Insufficient balance'), 'op'),
      ).toBe('Insufficient balance for this operation.');
    });

    it('maps network-related Error', () => {
      expect(
        mapSdkError(new Error('Network connect failed'), 'op'),
      ).toBe('Network error. Please check your connection and try again.');
    });

    it('maps no wallet Error', () => {
      expect(
        mapSdkError(new Error('no wallet mnemonic'), 'op'),
      ).toBe('No wallet found. Please set up your wallet first.');
    });

    it('maps not connected Error', () => {
      expect(
        mapSdkError(new Error('not connected'), 'op'),
      ).toBe('Wallet is not connected. Please try again.');
    });

    it('maps invalid invoice Error', () => {
      expect(
        mapSdkError(new Error('missing an invoice string'), 'op'),
      ).toBe(
        'Invoice creation failed because the wallet returned an invalid invoice.',
      );
    });

    it('falls back to generic message for unknown errors', () => {
      expect(mapSdkError(new Error('weird'), 'send')).toBe(
        'Unable to complete send. Please try again.',
      );
    });
  });

  describe('logWalletOperation', () => {
    it('does not throw', () => {
      expect(() =>
        logWalletOperation({ operation: 'testOp' }),
      ).not.toThrow();
    });

    it('in __DEV__ logs success to console.log', () => {
      vi.stubGlobal('__DEV__', true);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logWalletOperation({ operation: 'ok' });
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it('in __DEV__ logs errors to console.warn', () => {
      vi.stubGlobal('__DEV__', true);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logWalletOperation({
        operation: 'bad',
        error: new Error('x'),
      });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('mapPaymentToTransaction', () => {
    const base = paymentBase();

    it('maps Receive completed to received', () => {
      const payment = {
        ...base,
        paymentType: PaymentType.Receive,
        status: PaymentStatus.Completed,
        details: undefined,
      } as Payment;
      const tx = mapPaymentToTransaction(payment);
      expect(tx.type).toBe('received');
      expect(tx.status).toBe('completed');
      expect(tx.amountSats).toBe(1000);
      expect(tx.feeSats).toBe(5);
      expect(tx.timestamp).toBe(1_700_000_000);
      expect(tx.description).toBeUndefined();
      expect(tx.bolt11).toBeUndefined();
      expect(tx.txid).toBeUndefined();
    });

    it('maps Send completed to sent', () => {
      const payment = {
        ...base,
        paymentType: PaymentType.Send,
        status: PaymentStatus.Completed,
        details: undefined,
      } as Payment;
      const tx = mapPaymentToTransaction(payment);
      expect(tx.type).toBe('sent');
      expect(tx.status).toBe('completed');
    });

    it('maps Failed status', () => {
      const payment = {
        ...base,
        paymentType: PaymentType.Send,
        status: PaymentStatus.Failed,
      } as Payment;
      expect(mapPaymentToTransaction(payment).status).toBe('failed');
    });

    it('maps Lightning details', () => {
      const payment = {
        ...base,
        paymentType: PaymentType.Receive,
        status: PaymentStatus.Completed,
        details: {
          tag: PaymentDetails_Tags.Lightning,
          inner: { description: 'coffee', invoice: 'lnbc1x' },
        },
      } as unknown as Payment;
      const tx = mapPaymentToTransaction(payment);
      expect(tx.description).toBe('coffee');
      expect(tx.bolt11).toBe('lnbc1x');
    });

    it('maps Spark invoice details', () => {
      const payment = {
        ...base,
        details: {
          tag: PaymentDetails_Tags.Spark,
          inner: {
            invoiceDetails: { description: 'spark', invoice: 'lnbc1s' },
          },
        },
      } as unknown as Payment;
      const tx = mapPaymentToTransaction(payment);
      expect(tx.description).toBe('spark');
      expect(tx.bolt11).toBe('lnbc1s');
    });

    it('maps Token invoice details', () => {
      const payment = {
        ...base,
        details: {
          tag: PaymentDetails_Tags.Token,
          inner: {
            invoiceDetails: { description: 'token', invoice: 'lnbc1t' },
          },
        },
      } as unknown as Payment;
      const tx = mapPaymentToTransaction(payment);
      expect(tx.description).toBe('token');
      expect(tx.bolt11).toBe('lnbc1t');
    });

    it('maps Withdraw Pending to pending_withdrawal', () => {
      const payment = {
        ...base,
        paymentType: PaymentType.Send,
        status: PaymentStatus.Pending,
        details: {
          tag: PaymentDetails_Tags.Withdraw,
          inner: { txId: 'txw', confirmations: 0 },
        },
      } as unknown as Payment;
      const tx = mapPaymentToTransaction(payment);
      expect(tx.type).toBe('pending_withdrawal');
      expect(tx.status).toBe('pending');
      expect(tx.description).toBe('On-chain withdrawal');
      expect(tx.txid).toBe('txw');
    });

    it('maps Withdraw Completed to withdrawal with destination address', () => {
      const payment = {
        ...base,
        paymentType: PaymentType.Send,
        status: PaymentStatus.Completed,
        details: {
          tag: PaymentDetails_Tags.Withdraw,
          inner: {
            txId: 'txdone',
            confirmations: 6,
            address: 'bc1qdest',
          },
        },
      } as unknown as Payment;
      const tx = mapPaymentToTransaction(payment);
      expect(tx.type).toBe('withdrawal');
      expect(tx.destination).toBe('bc1qdest');
      expect(tx.confirmationTarget).toBe(6);
    });

    it('maps Withdraw with destinationAddress field', () => {
      const payment = {
        ...base,
        paymentType: PaymentType.Send,
        status: PaymentStatus.Completed,
        details: {
          tag: PaymentDetails_Tags.Withdraw,
          inner: {
            txId: 't2',
            confirmations: 1,
            destinationAddress: 'tb1qxx',
          },
        },
      } as unknown as Payment;
      expect(mapPaymentToTransaction(payment).destination).toBe('tb1qxx');
    });
  });

  describe('mapFeeRateToConfirmationSpeed', () => {
    it('maps sat/vB tiers to Slow, Medium, Fast', () => {
      expect(mapFeeRateToConfirmationSpeed(1)).toBe(
        OnchainConfirmationSpeed.Slow,
      );
      expect(mapFeeRateToConfirmationSpeed(2)).toBe(
        OnchainConfirmationSpeed.Slow,
      );
      expect(mapFeeRateToConfirmationSpeed(10)).toBe(
        OnchainConfirmationSpeed.Medium,
      );
      expect(mapFeeRateToConfirmationSpeed(11)).toBe(
        OnchainConfirmationSpeed.Fast,
      );
    });
  });

  describe('listTransactionsPage', () => {
    it('slices mapped transactions by cursor and limit', async () => {
      await initializeWallet();
      const payments = ['a', 'b', 'c'].map((id, i) => ({
        ...paymentBase(),
        id,
        amount: BigInt(i + 1),
        timestamp: BigInt(i + 1),
      })) as Payment[];
      hoisted.mockSdk.listPayments.mockResolvedValue({ payments });
      const page = await listTransactionsPage({ cursor: '0', limit: 2 });
      expect(page.transactions.map((t) => t.id)).toEqual(['a', 'b']);
      expect(page.nextCursor).toBe('2');
      const page2 = await listTransactionsPage({ cursor: '2', limit: 2 });
      expect(page2.transactions.map((t) => t.id)).toEqual(['c']);
      expect(page2.nextCursor).toBeNull();
    });
  });

  describe('estimateWithdrawalFee', () => {
    it('selects fee quote tier from sat/vB', async () => {
      await initializeWallet();
      await expect(
        estimateWithdrawalFee('bc1qtest', 1000, 1),
      ).resolves.toBe(10);
      await expect(
        estimateWithdrawalFee('bc1qtest', 1000, 5),
      ).resolves.toBe(20);
      await expect(
        estimateWithdrawalFee('bc1qtest', 1000, 15),
      ).resolves.toBe(30);
    });
  });

  describe('lifecycle (mocked SDK)', () => {
    it('getWalletInstance is null before init', () => {
      expect(getWalletInstance()).toBeNull();
    });

    it('initializeWallet returns cached instance on second call', async () => {
      const a = await initializeWallet();
      const b = await initializeWallet();
      expect(a).toBe(b);
    });

    it('disconnectWallet skips disconnect when never initialized', async () => {
      await disconnectWallet();
      expect(hoisted.mockSdk.disconnect).not.toHaveBeenCalled();
    });

    it('disconnectWallet calls SDK disconnect after init', async () => {
      await initializeWallet();
      await disconnectWallet();
      expect(hoisted.mockSdk.disconnect).toHaveBeenCalled();
    });

    it('registerEventListener throws when not initialized', async () => {
      await expect(
        registerEventListener((() => {}) as unknown as EventListener),
      ).rejects.toThrow(
        'Wallet not initialized',
      );
    });

    it('registerEventListener and removeEventListener when initialized', async () => {
      await initializeWallet();
      const id = await registerEventListener(
        (() => {}) as unknown as EventListener,
      );
      expect(id).toBe('listener-id');
      await removeEventListener(id);
      expect(hoisted.mockSdk.removeEventListener).toHaveBeenCalledWith(id);
    });

    it('removeEventListener is no-op when not initialized', async () => {
      await removeEventListener('x');
      expect(hoisted.mockSdk.removeEventListener).not.toHaveBeenCalled();
    });

    it('getWalletInfo proxies getInfo', async () => {
      await initializeWallet();
      const info = await getWalletInfo();
      expect(info.identityPubkey).toBe('02abc');
      expect(hoisted.mockSdk.getInfo).toHaveBeenCalled();
    });

    it('getNodeState aggregates pending', async () => {
      await initializeWallet();
      const ns = await getNodeState();
      expect(ns.balanceSats).toBe(10_000n);
      expect(ns.pendingReceiveSats).toBe(50n);
    });

    it('listTransactions maps payments', async () => {
      await initializeWallet();
      const txs = await listTransactions();
      expect(txs.length).toBe(1);
      expect(txs[0].id).toBe('done1');
    });

    it('listTransactions throws when not initialized', async () => {
      await expect(listTransactions()).rejects.toThrow('not initialized');
    });

    it('getChannels returns aggregate row when SDK has no listChannels', async () => {
      await initializeWallet();
      const ch = await getChannels();
      expect(ch.length).toBe(1);
      expect(ch[0].id).toBe('spark-aggregate');
    });

    it('validateWithdrawalAddress returns false on prepare failure', async () => {
      await initializeWallet();
      hoisted.prepareSendPayment.mockRejectedValueOnce(new Error('bad addr'));
      await expect(validateWithdrawalAddress('bad')).resolves.toBe(false);
    });

    it('validateWithdrawalAddress returns true on prepare success', async () => {
      await initializeWallet();
      await expect(validateWithdrawalAddress('bc1qok')).resolves.toBe(true);
    });

    it('executeWithdrawal returns withdraw txId', async () => {
      await initializeWallet();
      const txid = await executeWithdrawal('bc1q', 500, 1);
      expect(txid).toBe('onchain-tx');
    });

    it('executeWithdrawal returns payment id when not withdraw details', async () => {
      await initializeWallet();
      hoisted.mockSdk.sendPayment.mockResolvedValueOnce({
        payment: {
          id: 'pay-only',
          amount: 1n,
          fees: 0n,
          timestamp: 1n,
          paymentType: PaymentType.Send,
          status: PaymentStatus.Completed,
          details: undefined,
        } as Payment,
      });
      const id = await executeWithdrawal('bc1q', 500, 1);
      expect(id).toBe('pay-only');
    });

    it('sendLightningPayment returns payment from sendPayment', async () => {
      await initializeWallet();
      hoisted.prepareSendPayment.mockResolvedValueOnce({
        paymentMethod: { tag: 'Lightning', inner: {} },
      });
      const pay = await sendLightningPayment('lnbc1mini', 99);
      expect(pay.id).toBe('sent1');
    });

    it('createLightningInvoice returns request and fee', async () => {
      await initializeWallet();
      const inv = await createLightningInvoice(1000, 'memo');
      expect(inv.paymentRequest).toBe('lnbc1invoice');
      expect(inv.feeSats).toBe(3);
    });

    it('createLightningInvoice parses numeric fee', async () => {
      await initializeWallet();
      hoisted.mockSdk.receivePayment.mockResolvedValueOnce({
        paymentRequest: 'lnbc1fee',
        fee: 4.9,
      });
      const inv = await createLightningInvoice(1);
      expect(inv.feeSats).toBe(4);
    });

    it('createLightningInvoice rejects blank paymentRequest from SDK', async () => {
      await initializeWallet();
      hoisted.mockSdk.receivePayment.mockResolvedValueOnce({
        paymentRequest: '   ',
        fee: 0n,
      });
      await expect(createLightningInvoice(10)).rejects.toThrow(
        'invalid invoice',
      );
    });

    it('createLightningInvoice maps SDK failure to friendly error', async () => {
      await initializeWallet();
      hoisted.mockSdk.receivePayment.mockRejectedValueOnce(
        new Error('receive failed'),
      );
      await expect(createLightningInvoice(10)).rejects.toThrow();
    });

    it('estimateLightningSendFee sums lightning and spark fees for BOLT11 quote', async () => {
      await initializeWallet();
      hoisted.prepareSendPayment.mockResolvedValueOnce({
        paymentMethod: {
          tag: SendPaymentMethod_Tags.Bolt11Invoice,
          inner: {
            lightningFeeSats: 4n,
            sparkTransferFeeSats: 6n,
          },
        },
      });
      const fee = await estimateLightningSendFee('lnbc1testinvoice', 500);
      expect(fee).toBe(10);
    });

    it('estimateLightningSendFee uses prepareLnurlPay for LNURL after parse', async () => {
      await initializeWallet();
      hoisted.mockSdk.parse.mockResolvedValueOnce({
        __shape: 'lnurlpay',
        inner: [{}],
      });
      hoisted.mockSdk.prepareLnurlPay.mockResolvedValueOnce({
        feeSats: 14n,
      });
      const fee = await estimateLightningSendFee(
        'lnurl1dp68gurn8ghj7mrw9euxjun0d3shqunzw9kxz7r0d9hxuctdv9kzgetrv9h8',
        200,
      );
      expect(fee).toBe(14);
      expect(hoisted.mockSdk.prepareLnurlPay).toHaveBeenCalled();
    });

    it('estimateLightningSendFee returns null for on-chain address', async () => {
      await initializeWallet();
      const fee = await estimateLightningSendFee(
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
        1000,
      );
      expect(fee).toBeNull();
    });

    it('getChannels returns SDK channels when listChannels is available', async () => {
      await initializeWallet();
      (
        hoisted.mockSdk as unknown as {
          listChannels: ReturnType<typeof vi.fn>;
        }
      ).listChannels = vi.fn().mockResolvedValue({
        channels: [
          {
            id: 'real-ch',
            remotePubkey: '02peer',
            capacitySats: 1_000_000,
            localBalanceSats: 500_000,
            remoteBalanceSats: 500_000,
            state: 'active',
          },
        ],
      });
      const ch = await getChannels();
      expect(ch).toHaveLength(1);
      expect(ch[0].id).toBe('real-ch');
      delete (hoisted.mockSdk as unknown as { listChannels?: unknown })
        .listChannels;
    });

    it('getChannels propagates wrapped error when listPayments fails', async () => {
      await initializeWallet();
      (
        hoisted.mockSdk as unknown as {
          listChannels: ReturnType<typeof vi.fn>;
        }
      ).listChannels = vi.fn().mockResolvedValue({ channels: [] });
      hoisted.mockSdk.listPayments.mockRejectedValueOnce(new Error('db error'));
      await expect(getChannels()).rejects.toThrow();
      delete (hoisted.mockSdk as unknown as { listChannels?: unknown })
        .listChannels;
    });

    it('getChannels aggregate uses pending_open when inbound pending only', async () => {
      await initializeWallet();
      hoisted.mockSdk.getInfo.mockResolvedValue({
        identityPubkey: '02z',
        balanceSats: 0n,
      });
      hoisted.mockSdk.listPayments.mockImplementation(
        async (req: { statusFilter?: string[] } | undefined) => {
          if (req?.statusFilter?.includes('Pending')) {
            return {
              payments: [
                {
                  ...paymentBase(),
                  id: 'pr',
                  paymentType: PaymentType.Receive,
                  status: PaymentStatus.Pending,
                  amount: 99n,
                } as Payment,
              ],
            };
          }
          return { payments: [] as Payment[] };
        },
      );
      const ch = await getChannels();
      expect(ch[0].state).toBe('pending_open');
    });

    it('sendLightningPaymentResolved uses BOLT11 detection without parse', async () => {
      await initializeWallet();
      hoisted.prepareSendPayment.mockResolvedValueOnce({
        paymentMethod: { tag: 'Lightning', inner: {} },
      });
      const pay = await sendLightningPaymentResolved('lnbc1qxxx', 50);
      expect(pay.id).toBe('sent1');
    });

    it('sendLightningPaymentResolved parses LNURL', async () => {
      await initializeWallet();
      hoisted.mockSdk.parse.mockResolvedValue({
        __shape: 'lnurlpay',
        inner: [{}],
      });
      const pay = await sendLightningPaymentResolved('lnurl1dp...', 100);
      expect(pay.id).toBe('lnurl-pay');
    });

    it('sendLightningPaymentResolved parses Lightning address', async () => {
      await initializeWallet();
      hoisted.mockSdk.parse.mockResolvedValue({
        __shape: 'lnaddr',
        inner: [{ payRequest: {} }],
      });
      const pay = await sendLightningPaymentResolved('user@wallet.com', 100);
      expect(pay.id).toBe('lnurl-pay');
    });

    it('sendLightningPaymentResolved parses Bolt11 from parse after LNURL-detected input', async () => {
      await initializeWallet();
      hoisted.mockSdk.parse.mockResolvedValue({
        __shape: 'bolt11',
        inner: [{ invoice: { bolt11: 'lnbc1parsed' } }],
      });
      hoisted.prepareSendPayment.mockResolvedValueOnce({
        paymentMethod: { tag: 'Lightning', inner: {} },
      });
      const pay = await sendLightningPaymentResolved('lnurl1dummypayload', 10);
      expect(pay.id).toBe('sent1');
    });

    it('sendLightningPaymentResolved rejects bitcoin address', async () => {
      await initializeWallet();
      await expect(
        sendLightningPaymentResolved('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 100),
      ).rejects.toThrow('Withdraw instead');
    });

    it('sendLightningPaymentResolved rejects empty input', async () => {
      await expect(sendLightningPaymentResolved('  ', 1)).rejects.toThrow(
        'Enter a recipient',
      );
    });

    it('sendLightningPaymentResolved rejects unknown format', async () => {
      await expect(sendLightningPaymentResolved('???', 1)).rejects.toThrow(
        'Unrecognized payment format',
      );
    });

    it('sendLightningPaymentResolved rejects unsupported parse result', async () => {
      await initializeWallet();
      hoisted.mockSdk.parse.mockResolvedValue({ __shape: 'other' });
      await expect(
        sendLightningPaymentResolved('lnurl1dp', 1),
      ).rejects.toThrow('not supported for Send');
    });
  });
});
