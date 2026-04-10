import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Alert } from 'react-native';
import {
  type SdkEvent,
  SdkEvent_Tags,
  PaymentType,
} from '@breeztech/breez-sdk-spark-react-native';
import type {
  WalletState,
  WalletBalance,
  Transaction,
  Channel,
  DisplayUnit,
  Network,
  ReceiveChannelOpeningState,
} from '@/types/wallet';
import { useAuthContext } from '@context/AuthContext';
import { useSettings } from '@context/SettingsContext';
import { useWallet as useWalletSdk } from '@hooks/useWallet';
import { formatAmount } from '@utils/formatters';
import {
  createLightningInvoice,
  disconnectWallet,
  estimateWithdrawalFee as estimateWithdrawalFeeService,
  executeWithdrawal,
  mapPaymentToTransaction,
  sendLightningPaymentResolved,
  validateWithdrawalAddress as validateWithdrawalAddressService,
  type TransactionPage,
  type NodeState,
  type LightningInvoiceResult,
} from '@services/walletService';
import type { PaymentType as AppPaymentType } from '@utils/bitcoin';

type WalletAction =
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_UNLOCKED'; payload: boolean }
  | { type: 'SET_BALANCE'; payload: WalletBalance }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SET_CHANNELS'; payload: Channel[] }
  | { type: 'SET_DISPLAY_UNIT'; payload: DisplayUnit }
  | { type: 'SET_NETWORK'; payload: Network }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'RESET_WALLET' };

const emptyBalance: WalletBalance = {
  onchainConfirmedSats: 0,
  onchainPendingSats: 0,
  lightningBalanceSats: 0,
  inboundLiquiditySats: 0,
  outboundLiquiditySats: 0,
  totalBalanceSats: 0,
};

const initialState: WalletState = {
  isInitialized: false,
  isUnlocked: false,
  balance: emptyBalance,
  transactions: [],
  channels: [],
  network: 'testnet',
  displayUnit: 'sats',
  nodeId: '',
  blockHeight: 0,
  isSyncing: false,
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_UNLOCKED':
      return { ...state, isUnlocked: action.payload };
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'SET_CHANNELS':
      return { ...state, channels: action.payload };
    case 'SET_DISPLAY_UNIT':
      return { ...state, displayUnit: action.payload };
    case 'SET_NETWORK':
      return { ...state, network: action.payload };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.payload };
    case 'RESET_WALLET':
      return initialState;
    default:
      return state;
  }
}

function mergeSdkIntoWalletState(
  base: WalletState,
  sdk: {
    balanceSats: bigint | null;
    isConnected: boolean;
    isSynced: boolean;
    isLoading: boolean;
    nodeState: NodeState | null;
    transactions: Transaction[];
    channels: Channel[];
    /** When true, SDK channel fetch has completed at least once; empty arrays are authoritative. */
    channelsHydrated: boolean;
  }
): WalletState {
  const ns = sdk.nodeState;
  let lightning = base.balance.lightningBalanceSats;
  let total = base.balance.totalBalanceSats;
  let onchainPending = base.balance.onchainPendingSats;

  if (ns) {
    lightning = Number(ns.balanceSats);
    total = Number(ns.balanceSats);
    onchainPending = Number(ns.pendingReceiveSats);
  } else if (sdk.balanceSats != null) {
    const n = Number(sdk.balanceSats);
    lightning = n;
    total = n;
  }

  const balance: WalletBalance = {
    ...base.balance,
    lightningBalanceSats: lightning,
    totalBalanceSats: total,
    onchainPendingSats: onchainPending,
    ...(ns
      ? {
          inboundLiquiditySats: Number(ns.inboundLiquiditySats),
          outboundLiquiditySats: Number(ns.outboundLiquiditySats),
        }
      : {}),
  };

  const isSyncing = sdk.isLoading || (sdk.isConnected && !sdk.isSynced);

  const transactions =
    sdk.transactions.length > 0 ? sdk.transactions : base.transactions;

  const channels = sdk.channelsHydrated ? sdk.channels : base.channels;

  return {
    ...base,
    balance,
    transactions,
    channels,
    isInitialized: sdk.isConnected,
    isSyncing,
    nodeId: ns?.identityPubkey ?? base.nodeId,
    /** Reflects the active SDK session only (cached node state while offline). */
    network: (ns?.network as Network) ?? 'testnet',
  };
}

interface WalletContextType {
  state: WalletState;
  dispatch: React.Dispatch<WalletAction>;
  isLoading: boolean;
  sdkError: string | null;
  receiveChannelOpening: ReceiveChannelOpeningState;
  startReceiveChannelOpeningMonitor: () => void;
  stopReceiveChannelOpeningMonitor: () => void;
  /** Tears down the SDK, then reconnects so the next session uses the persisted network (e.g. after settings). */
  reconnectAfterNetworkChange: () => Promise<void>;
  sendPayment: (
    recipient: string,
    amountSats: number,
    paymentTypeHint?: AppPaymentType,
  ) => Promise<void>;
  createInvoice: (amountSats: number, description?: string) => Promise<LightningInvoiceResult>;
  withdrawOnchain: (address: string, amountSats: number, feeRate: number) => Promise<string>;
  estimateWithdrawalFee: (
    address: string,
    amountSats: number,
    satPerVbyte: number
  ) => Promise<number>;
  validateWithdrawalAddress: (address: string) => Promise<boolean>;
  refreshTransactions: () => Promise<void>;
  refreshNodeState: () => Promise<void>;
  refreshChannels: () => Promise<void>;
  fetchTransactionPage: (params?: {
    cursor?: string | null;
    limit?: number;
  }) => Promise<TransactionPage>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const { state: settings } = useSettings();
  const [networkReconnectNonce, setNetworkReconnectNonce] = useState(0);

  const onPaymentEvent = useCallback((event: SdkEvent) => {
    switch (event.tag) {
      case SdkEvent_Tags.PaymentSucceeded: {
        const p = event.inner.payment;
        const isReceive = p.paymentType === PaymentType.Receive;
        const amt = Number(p.amount);
        const amtLabel = Number.isFinite(amt)
          ? formatAmount(amt, settings.displayUnit)
          : String(p.amount);
        Alert.alert(
          isReceive ? 'Payment received' : 'Payment sent',
          `${amtLabel} ${isReceive ? 'received' : 'sent'} successfully.`,
        );
        break;
      }
      case SdkEvent_Tags.PaymentFailed: {
        const p = event.inner.payment;
        const isReceive = p.paymentType === PaymentType.Receive;
        const amt = Number(p.amount);
        const amtLabel = Number.isFinite(amt)
          ? formatAmount(amt, settings.displayUnit)
          : String(p.amount);
        Alert.alert(
          'Payment failed',
          `Could not complete ${isReceive ? 'incoming' : 'outgoing'} payment (${amtLabel}).`,
        );
        break;
      }
      default:
        break;
    }
  }, [settings.displayUnit]);

  const sdk = useWalletSdk(isAuthenticated, networkReconnectNonce, onPaymentEvent);
  const [state, dispatch] = useReducer(walletReducer, initialState);

  const reconnectAfterNetworkChange = useCallback(async () => {
    await disconnectWallet();
    setNetworkReconnectNonce((n) => n + 1);
  }, []);

  const mergedState = useMemo(
    () =>
      mergeSdkIntoWalletState(state, {
        balanceSats: sdk.balanceSats,
        isConnected: sdk.isConnected,
        isSynced: sdk.isSynced,
        isLoading: sdk.isLoading,
        nodeState: sdk.nodeState,
        transactions: sdk.transactions,
        channels: sdk.channels,
        channelsHydrated: sdk.channelsHydrated,
      }),
    [
      state,
      sdk.balanceSats,
      sdk.isConnected,
      sdk.isSynced,
      sdk.isLoading,
      sdk.nodeState,
      sdk.transactions,
      sdk.channels,
      sdk.channelsHydrated,
    ]
  );

  const sendPayment = async (
    recipient: string,
    amountSats: number,
    paymentTypeHint?: AppPaymentType,
  ) => {
    const payment = await sendLightningPaymentResolved(recipient, amountSats, paymentTypeHint);
    dispatch({ type: 'ADD_TRANSACTION', payload: mapPaymentToTransaction(payment) });
    await sdk.refreshNodeState();
    await sdk.refreshTransactions();
  };

  const createInvoice = async (
    amountSats: number,
    description?: string
  ): Promise<LightningInvoiceResult> => {
    return createLightningInvoice(amountSats, description);
  };

  const estimateWithdrawalFee = async (
    address: string,
    amountSats: number,
    satPerVbyte: number
  ) => {
    return estimateWithdrawalFeeService(address, amountSats, satPerVbyte);
  };

  const withdrawOnchain = async (address: string, amountSats: number, feeRate: number) => {
    const txid = await executeWithdrawal(address, amountSats, feeRate);
    await sdk.refreshNodeState();
    await sdk.refreshTransactions();
    return txid;
  };

  const validateWithdrawalAddress = async (address: string) => {
    return validateWithdrawalAddressService(address);
  };

  return (
    <WalletContext.Provider
      value={{
        state: mergedState,
        dispatch,
        isLoading: sdk.isLoading,
        sdkError: sdk.error,
        receiveChannelOpening: sdk.receiveChannelOpening,
        startReceiveChannelOpeningMonitor: sdk.startReceiveChannelOpeningMonitor,
        stopReceiveChannelOpeningMonitor: sdk.stopReceiveChannelOpeningMonitor,
        reconnectAfterNetworkChange,
        sendPayment,
        createInvoice,
        withdrawOnchain,
        estimateWithdrawalFee,
        validateWithdrawalAddress,
        refreshTransactions: sdk.refreshTransactions,
        refreshNodeState: sdk.refreshNodeState,
        refreshChannels: sdk.refreshChannels,
        fetchTransactionPage: sdk.fetchTransactionPage,
      }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
