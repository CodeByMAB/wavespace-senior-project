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
} from '@/types/wallet';
import { useAuthContext } from '@context/AuthContext';
import { useWallet as useWalletSdk } from '@hooks/useWallet';
import { disconnectWallet, type NodeState } from '@services/walletService';

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

  return {
    ...base,
    balance,
    transactions,
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
  /** Tears down the SDK, then reconnects so the next session uses the persisted network (e.g. after settings). */
  reconnectAfterNetworkChange: () => Promise<void>;
  sendPayment: (invoice: string, amountSats: number) => Promise<void>;
  createInvoice: (amountSats: number, description?: string) => Promise<string>;
  withdrawOnchain: (address: string, amountSats: number, feeRate: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function formatSats(amount: bigint): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return `${n.toLocaleString()} sats`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const [networkReconnectNonce, setNetworkReconnectNonce] = useState(0);

  const onPaymentEvent = useCallback((event: SdkEvent) => {
    switch (event.tag) {
      case SdkEvent_Tags.PaymentSucceeded: {
        const p = event.inner.payment;
        const isReceive = p.paymentType === PaymentType.Receive;
        Alert.alert(
          isReceive ? 'Payment received' : 'Payment sent',
          `${formatSats(p.amount)} ${isReceive ? 'received' : 'sent'} successfully.`,
        );
        break;
      }
      case SdkEvent_Tags.PaymentFailed: {
        const p = event.inner.payment;
        const isReceive = p.paymentType === PaymentType.Receive;
        Alert.alert(
          'Payment failed',
          `Could not complete ${isReceive ? 'incoming' : 'outgoing'} payment (${formatSats(p.amount)}).`,
        );
        break;
      }
      default:
        break;
    }
  }, []);

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
      }),
    [
      state,
      sdk.balanceSats,
      sdk.isConnected,
      sdk.isSynced,
      sdk.isLoading,
      sdk.nodeState,
      sdk.transactions,
    ]
  );

  const sendPayment = async (invoice: string, amountSats: number) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        id: `tx_${Date.now()}`,
        type: 'sent',
        status: 'completed',
        amountSats,
        feeSats: Math.floor(amountSats * 0.001),
        timestamp: Date.now() / 1000,
        description: 'Lightning payment',
        bolt11: invoice,
      },
    });
    await sdk.refreshNodeState();
    await sdk.refreshTransactions();
  };

  const createInvoice = async (amountSats: number, description?: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return `lnbc${amountSats}n1mock_invoice_${Date.now()}`;
  };

  const withdrawOnchain = async (address: string, amountSats: number, feeRate: number) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        id: `tx_${Date.now()}`,
        type: 'sent',
        status: 'pending',
        amountSats,
        feeSats: feeRate * 250,
        timestamp: Date.now() / 1000,
        description: 'On-chain withdrawal',
        destination: address,
      },
    });
  };

  return (
    <WalletContext.Provider
      value={{
        state: mergedState,
        dispatch,
        isLoading: sdk.isLoading,
        sdkError: sdk.error,
        reconnectAfterNetworkChange,
        sendPayment,
        createInvoice,
        withdrawOnchain,
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
