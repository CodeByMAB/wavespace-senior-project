import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  ReactNode,
} from 'react';
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
import type { NodeState } from '@services/walletService';

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
  };

  const isSyncing = sdk.isLoading || (sdk.isConnected && !sdk.isSynced);

  return {
    ...base,
    balance,
    isInitialized: sdk.isConnected,
    isSyncing,
    nodeId: ns?.identityPubkey ?? base.nodeId,
    network: (ns?.network as Network) ?? base.network,
  };
}

interface WalletContextType {
  state: WalletState;
  dispatch: React.Dispatch<WalletAction>;
  isLoading: boolean;
  sdkError: string | null;
  sendPayment: (invoice: string, amountSats: number) => Promise<void>;
  createInvoice: (amountSats: number, description?: string) => Promise<string>;
  withdrawOnchain: (address: string, amountSats: number, feeRate: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const sdk = useWalletSdk(isAuthenticated);
  const [state, dispatch] = useReducer(walletReducer, initialState);

  const mergedState = useMemo(
    () =>
      mergeSdkIntoWalletState(state, {
        balanceSats: sdk.balanceSats,
        isConnected: sdk.isConnected,
        isSynced: sdk.isSynced,
        isLoading: sdk.isLoading,
        nodeState: sdk.nodeState,
      }),
    [state, sdk.balanceSats, sdk.isConnected, sdk.isSynced, sdk.isLoading, sdk.nodeState]
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
