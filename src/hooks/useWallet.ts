import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type SdkEvent,
  SdkEvent_Tags,
  type EventListener,
} from '@breeztech/breez-sdk-spark-react-native';
import {
  initializeWallet,
  disconnectWallet,
  registerEventListener,
  removeEventListener,
  getNodeState,
  listTransactions,
  mapSdkError,
  logWalletOperation,
  type NodeState,
} from '@services/walletService';
import { ASYNC_KEYS, nodeStateCacheKey } from '@constants/storage';
import type { Transaction } from '@/types/wallet';

async function readPersistedNetwork(): Promise<'mainnet' | 'testnet'> {
  try {
    const raw = await AsyncStorage.getItem(ASYNC_KEYS.NETWORK_SELECTION);
    return raw === 'mainnet' ? 'mainnet' : 'testnet';
  } catch {
    return 'testnet';
  }
}

interface WalletState {
  balanceSats: bigint | null;
  isConnected: boolean;
  isSynced: boolean;
  isLoading: boolean;
  error: string | null;
  nodeState: NodeState | null;
}

const INITIAL_STATE: WalletState = {
  balanceSats: null,
  isConnected: false,
  isSynced: false,
  isLoading: false,
  error: null,
  nodeState: null,
};

const RETRY_DELAYS_MS = [1000, 2000, 4000];

export function useWallet(
  isAuthenticated: boolean,
  networkReconnectNonce = 0,
  onPaymentEvent?: (event: SdkEvent) => void
) {
  const [state, setState] = useState<WalletState>(INITIAL_STATE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appStateNonce, setAppStateNonce] = useState(0);
  const listenerIdRef = useRef<string | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const onPaymentEventRef = useRef(onPaymentEvent);
  onPaymentEventRef.current = onPaymentEvent;

  /**
   * Generation counter. Incremented whenever a cleanup or a new connect
   * starts. Every async step captures its own session token and bails out
   * if the token no longer matches the current counter, preventing stale
   * mutations from landing after a newer session has taken over.
   */
  const sessionRef = useRef<number>(0);

  /**
   * Promise that resolves once the most-recent cleanup (listener removal +
   * SDK disconnect) has finished. New connect calls await this so that
   * initializeWallet() never races with an in-flight disconnect.
   */
  const cleanupPromiseRef = useRef<Promise<void>>(Promise.resolve());

  const refreshTransactions = useCallback(async () => {
    try {
      const txs = await listTransactions();
      setTransactions(txs);
    } catch (err) {
      logWalletOperation({ operation: 'listTransactions', error: err });
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      const ns = await getNodeState();
      setState((prev) => ({ ...prev, balanceSats: ns.balanceSats }));
    } catch (err) {
      logWalletOperation({ operation: 'refreshBalance', error: err });
      // Non-fatal: balance will be refreshed on next event
    }
  }, []);

  const refreshNodeState = useCallback(async (syncedAt?: number) => {
    try {
      const ns = await getNodeState();
      setState((prev) => ({
        ...prev,
        balanceSats: ns.balanceSats,
        nodeState: {
          ...ns,
          lastSyncedAt: syncedAt ?? prev.nodeState?.lastSyncedAt ?? null,
        },
      }));

      // Persist for offline/restart bootstrap — BigInt is not JSON-serializable
      const toCache = {
        ...ns,
        lastSyncedAt: syncedAt ?? null,
        balanceSats: ns.balanceSats.toString(),
        pendingReceiveSats: ns.pendingReceiveSats.toString(),
        pendingSendSats: ns.pendingSendSats.toString(),
        inboundLiquiditySats: ns.inboundLiquiditySats.toString(),
        outboundLiquiditySats: ns.outboundLiquiditySats.toString(),
      };
      const cacheKey = nodeStateCacheKey(ns.network);
      AsyncStorage.setItem(cacheKey, JSON.stringify(toCache)).catch(() => {});
    } catch (err) {
      logWalletOperation({ operation: 'refreshNodeState', error: err });
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (next === 'background' || next === 'inactive') {
        sessionRef.current++;
        setState(INITIAL_STATE);
        setTransactions([]);
        const id = listenerIdRef.current;
        listenerIdRef.current = null;
        cleanupPromiseRef.current = (async () => {
          if (id) {
            try {
              await removeEventListener(id);
            } catch {
              // ignore
            }
          }
          await disconnectWallet();
        })();
      } else if (
        next === 'active' &&
        isAuthenticated &&
        (prev === 'background' || prev === 'inactive')
      ) {
        setAppStateNonce((n) => n + 1);
      }
    });
    return () => sub.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Capture this session's token before any async work.
    const session = ++sessionRef.current;

    async function connect() {
      // Serialize with the previous cleanup: do not call initializeWallet()
      // until any in-flight disconnect has fully resolved.
      await cleanupPromiseRef.current;

      if (session !== sessionRef.current) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Bootstrap UI with the last-known node state for the *persisted* network only.
      try {
        const persistedNet = await readPersistedNetwork();
        if (session !== sessionRef.current) return;
        const cached = await AsyncStorage.getItem(nodeStateCacheKey(persistedNet));
        if (cached && session === sessionRef.current) {
          const parsed = JSON.parse(cached) as Record<string, string | null>;
          const cachedNetwork = (parsed.network as NodeState['network']) ?? 'testnet';
          if (cachedNetwork === persistedNet) {
            setState((prev) => ({
              ...prev,
              nodeState: {
                identityPubkey: parsed.identityPubkey as string,
                network: cachedNetwork,
                balanceSats: BigInt(parsed.balanceSats ?? '0'),
                pendingReceiveSats: BigInt(parsed.pendingReceiveSats ?? '0'),
                pendingSendSats: BigInt(parsed.pendingSendSats ?? '0'),
                inboundLiquiditySats: BigInt(parsed.inboundLiquiditySats ?? '0'),
                outboundLiquiditySats: BigInt(parsed.outboundLiquiditySats ?? '0'),
                lastSyncedAt: parsed.lastSyncedAt ? Number(parsed.lastSyncedAt) : null,
              },
            }));
          }
        }
      } catch {
        // Stale cache read failure is non-fatal
      }

      let lastError: unknown;
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        if (session !== sessionRef.current) return;

        try {
          await initializeWallet();
          break;
        } catch (err) {
          lastError = err;
          logWalletOperation({ operation: 'initializeWallet', attempt, error: err });
          if (attempt < RETRY_DELAYS_MS.length) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
          } else {
            if (session === sessionRef.current) {
              setState((prev) => ({
                ...prev,
                isLoading: false,
                error: mapSdkError(lastError, 'wallet connection'),
              }));
            }
            return;
          }
        }
      }

      if (session !== sessionRef.current) return;

      setState((prev) => ({ ...prev, isConnected: true }));

      async function pullTransactionsFromSdk() {
        try {
          const txs = await listTransactions();
          if (session === sessionRef.current) {
            setTransactions(txs);
          }
        } catch (err) {
          logWalletOperation({ operation: 'listTransactions', error: err });
        }
      }

      async function loadTransactions() {
        try {
          const txs = await listTransactions();
          if (session !== sessionRef.current) return;
          setTransactions(txs);
          return txs;
        } catch (err) {
          logWalletOperation({ operation: 'loadTransactions', error: err });
        }
      }

      // Fetch full node state after successful connection.
      try {
        await refreshNodeState();
        await loadTransactions();
      } catch (err) {
        logWalletOperation({ operation: 'initialNodeState', error: err });
      }

      if (session !== sessionRef.current) return;

      setState((prev) => ({ ...prev, isLoading: false }));

      /**
       * FR-SDK-002 / channel-adjacent updates: Spark exposes no explicit ChannelOpen /
       * ChannelClose event tags. We treat Synced, Optimization, and payment/deposit
       * events as the signals to refresh balances, liquidity proxies, and history —
       * the same data users need after channel capacity changes.
       */
      const listener: EventListener = {
        async onEvent(event: SdkEvent) {
          switch (event.tag) {
            case SdkEvent_Tags.Synced:
              setState((prev) => ({ ...prev, isSynced: true }));
              await refreshNodeState(Date.now());
              await pullTransactionsFromSdk();
              break;
            case SdkEvent_Tags.PaymentSucceeded:
            case SdkEvent_Tags.ClaimedDeposits:
              await refreshNodeState();
              await pullTransactionsFromSdk();
              onPaymentEventRef.current?.(event);
              break;
            case SdkEvent_Tags.PaymentPending:
            case SdkEvent_Tags.PaymentFailed:
            case SdkEvent_Tags.UnclaimedDeposits:
              await refreshNodeState();
              await pullTransactionsFromSdk();
              onPaymentEventRef.current?.(event);
              break;
            case SdkEvent_Tags.Optimization:
              await refreshNodeState();
              await pullTransactionsFromSdk();
              break;
            default:
              break;
          }
        },
      };

      try {
        const id = await registerEventListener(listener);
        if (session === sessionRef.current) {
          listenerIdRef.current = id;
        } else {
          removeEventListener(id).catch(() => {});
        }
      } catch (err) {
        logWalletOperation({ operation: 'registerEventListener', error: err });
        // Non-fatal: live events won't fire but balance can still be fetched
      }
    }

    connect();

    return () => {
      // Invalidate the current session so that all pending post-await
      // mutations in connect() become no-ops.
      sessionRef.current++;
      const cleanupSession = sessionRef.current;

      // Signal disconnected to the UI synchronously before async teardown.
      setState(INITIAL_STATE);
      setTransactions([]);

      const id = listenerIdRef.current;
      listenerIdRef.current = null;

      const cleanup = async () => {
        if (id) {
          try {
            await removeEventListener(id);
          } catch {
            // Ignore cleanup errors
          }
        }
        // Only tear down the SDK if no newer connect() session has taken
        // ownership.  If a new session is active it will either reuse the
        // existing SDK instance or wait for this cleanup before reinitializing.
        if (cleanupSession === sessionRef.current) {
          await disconnectWallet();
        }
      };

      cleanupPromiseRef.current = cleanup();
    };
  }, [
    isAuthenticated,
    networkReconnectNonce,
    appStateNonce,
    refreshBalance,
    refreshNodeState,
  ]);

  return {
    ...state,
    transactions,
    refreshBalance,
    refreshNodeState,
    refreshTransactions,
  };
}
