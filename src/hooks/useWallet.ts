import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type SdkEvent,
  SdkEvent_Tags,
  type EventListener,
  PaymentType,
} from '@breeztech/breez-sdk-spark-react-native';
import {
  initializeWallet,
  walletInitFailureIsNonRetriable,
  disconnectWallet,
  registerEventListener,
  removeEventListener,
  getNodeState,
  getChannels,
  getWalletInstance,
  listTransactions,
  listTransactionsPage,
  mapSdkError,
  logWalletOperation,
  type NodeState,
} from '@services/walletService';
import { nodeStateCacheKey } from '@constants/storage';
import type { Channel, Transaction, ReceiveChannelOpeningState } from '@/types/wallet';
import { getBtcPriceUsd } from '@services/priceService';

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
  onPaymentEvent?: (event: SdkEvent) => void,
) {
  const [state, setState] = useState<WalletState>(INITIAL_STATE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsHydrated, setChannelsHydrated] = useState(false);
  const [receiveOpeningActive, setReceiveOpeningActive] = useState(false);
  const [receiveChannelOpening, setReceiveChannelOpening] =
    useState<ReceiveChannelOpeningState>({ status: 'idle' });
  const [appStateNonce, setAppStateNonce] = useState(0);
  const listenerIdRef = useRef<string | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const onPaymentEventRef = useRef(onPaymentEvent);
  onPaymentEventRef.current = onPaymentEvent;
  const receiveOpeningMonitorRef = useRef(false);

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

  const refreshChannels = useCallback(async () => {
    try {
      const list = await getChannels();
      setChannels(list);
    } catch (err) {
      logWalletOperation({ operation: 'getChannels', error: err });
    } finally {
      setChannelsHydrated(true);
    }
  }, []);

  const updateOpeningProgressFromSdk = useCallback(() => {
    if (!receiveOpeningMonitorRef.current) return;
    const inst = getWalletInstance();
    if (!inst) return;
    try {
      const p = inst.getLeafOptimizationProgress();
      const isOptimizing = p.isRunning;
      setReceiveChannelOpening({
        status: 'opening',
        message: isOptimizing
          ? 'Preparing to receive payments…'
          : 'Syncing with the network…',
        currentRound: p.currentRound,
        totalRounds: p.totalRounds,
        isOptimizing,
      });
    } catch {
      // Non-fatal: progress is best-effort
    }
  }, []);

  const startReceiveChannelOpeningMonitor = useCallback(() => {
    receiveOpeningMonitorRef.current = true;
    setReceiveOpeningActive(true);
    updateOpeningProgressFromSdk();
  }, [updateOpeningProgressFromSdk]);

  const stopReceiveChannelOpeningMonitor = useCallback(() => {
    receiveOpeningMonitorRef.current = false;
    setReceiveOpeningActive(false);
    setReceiveChannelOpening({ status: 'idle' });
  }, []);

  useEffect(() => {
    if (!receiveOpeningActive) return;
    const id = setInterval(updateOpeningProgressFromSdk, 2000);
    return () => clearInterval(id);
  }, [receiveOpeningActive, updateOpeningProgressFromSdk]);

  const fetchTransactionPage = useCallback(
    async (params?: {cursor?: string | null; limit?: number}) => {
      return listTransactionsPage(params);
    },
    [],
  );

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
        /**
         * Spark may not emit `Synced` on every session/network; once `getInfo` succeeds we have
         * a usable snapshot, so clear the endless “Syncing…” state.
         */
        isSynced: true,
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
      AsyncStorage.setItem(nodeStateCacheKey(), JSON.stringify(toCache)).catch(() => {});
    } catch (err) {
      logWalletOperation({ operation: 'refreshNodeState', error: err });
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      // Only tear down on true background. iOS uses `inactive` for Control Center,
      // app switcher, and other transitions — disconnecting there races with
      // `initializeWallet()` and surfaces "Wallet disconnected during initialization."
      if (next === 'background') {
        sessionRef.current++;
        setState(INITIAL_STATE);
        setTransactions([]);
        setChannels([]);
        setChannelsHydrated(false);
        receiveOpeningMonitorRef.current = false;
        setReceiveOpeningActive(false);
        setReceiveChannelOpening({ status: 'idle' });
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
      } else if (next === 'active' && isAuthenticated && prev === 'background') {
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
      setChannelsHydrated(false);

      // Bootstrap UI with the last-known mainnet node state when available.
      try {
        if (session !== sessionRef.current) return;
        const cached = await AsyncStorage.getItem(nodeStateCacheKey());
        if (cached && session === sessionRef.current) {
          const parsed = JSON.parse(cached) as Record<string, string | null>;
          const cachedNetwork = (parsed.network as NodeState['network']) ?? 'mainnet';
          if (cachedNetwork === 'mainnet') {
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
          logWalletOperation({
            operation: 'initializeWallet',
            attempt,
            error: err,
            expectedFailure: walletInitFailureIsNonRetriable(err),
          });
          if (walletInitFailureIsNonRetriable(err)) {
            if (session === sessionRef.current) {
              setState((prev) => ({
                ...prev,
                isLoading: false,
                error: mapSdkError(err, 'wallet connection'),
              }));
            }
            return;
          }
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
        await refreshChannels();
        await loadTransactions();
        await getBtcPriceUsd();
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
              await refreshChannels();
              await pullTransactionsFromSdk();
              await getBtcPriceUsd();
              break;
            case SdkEvent_Tags.PaymentSucceeded:
              await refreshNodeState();
              await refreshChannels();
              await pullTransactionsFromSdk();
              if (
                receiveOpeningMonitorRef.current &&
                event.inner.payment.paymentType === PaymentType.Receive
              ) {
                receiveOpeningMonitorRef.current = false;
                setReceiveOpeningActive(false);
                setReceiveChannelOpening({ status: 'idle' });
              }
              onPaymentEventRef.current?.(event);
              break;
            case SdkEvent_Tags.ClaimedDeposits:
              await refreshNodeState();
              await refreshChannels();
              await pullTransactionsFromSdk();
              onPaymentEventRef.current?.(event);
              break;
            case SdkEvent_Tags.PaymentPending:
              await refreshNodeState();
              await pullTransactionsFromSdk();
              onPaymentEventRef.current?.(event);
              break;
            case SdkEvent_Tags.PaymentFailed:
              await refreshNodeState();
              await pullTransactionsFromSdk();
              if (
                receiveOpeningMonitorRef.current &&
                event.inner.payment.paymentType === PaymentType.Receive
              ) {
                receiveOpeningMonitorRef.current = false;
                setReceiveOpeningActive(false);
                setReceiveChannelOpening({
                  status: 'failed',
                  message:
                    'This payment did not complete. You can create a new invoice and try again.',
                });
              }
              onPaymentEventRef.current?.(event);
              break;
            case SdkEvent_Tags.UnclaimedDeposits:
              await refreshNodeState();
              await pullTransactionsFromSdk();
              onPaymentEventRef.current?.(event);
              break;
            case SdkEvent_Tags.Optimization:
              await refreshNodeState();
              await refreshChannels();
              await pullTransactionsFromSdk();
              if (receiveOpeningMonitorRef.current) {
                updateOpeningProgressFromSdk();
              }
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
      setChannels([]);
      setChannelsHydrated(false);
      receiveOpeningMonitorRef.current = false;
      setReceiveOpeningActive(false);
      setReceiveChannelOpening({ status: 'idle' });

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
  }, [isAuthenticated, appStateNonce, refreshNodeState, refreshChannels, updateOpeningProgressFromSdk]);

  return {
    ...state,
    transactions,
    channels,
    channelsHydrated,
    receiveChannelOpening,
    startReceiveChannelOpeningMonitor,
    stopReceiveChannelOpeningMonitor,
    refreshBalance,
    refreshNodeState,
    refreshTransactions,
    refreshChannels,
    fetchTransactionPage,
  };
}
