import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ASYNC_KEYS} from '@constants/storage';
import type {DisplayUnit, Network} from '@/types/wallet';

interface SettingsState {
  displayUnit: DisplayUnit;
  network: Network;
  biometricsEnabled: boolean;
  hideBalance: boolean;
  /** Seconds until lock after background; `0` = never. */
  autoLockTimeout: number;
  /** Warn when balance exceeds the app-defined large-balance threshold. */
  securityAlertLargeBalance: boolean;
  /** Warn when there are unconfirmed / pending inbound or outbound funds. */
  securityAlertUnconfirmedTx: boolean;
}

type SettingsAction =
  | {type: 'SET_DISPLAY_UNIT'; payload: DisplayUnit}
  | {type: 'SET_NETWORK'; payload: Network}
  | {type: 'TOGGLE_BIOMETRICS'}
  | {type: 'TOGGLE_HIDE_BALANCE'}
  | {type: 'SET_AUTO_LOCK_TIMEOUT'; payload: number}
  | {type: 'SET_SECURITY_ALERT_LARGE_BALANCE'; payload: boolean}
  | {type: 'SET_SECURITY_ALERT_UNCONFIRMED_TX'; payload: boolean};

const initialSettings: SettingsState = {
  displayUnit: 'sats',
  network: 'mainnet',
  biometricsEnabled: false,
  hideBalance: false,
  autoLockTimeout: 0,
  securityAlertLargeBalance: true,
  securityAlertUnconfirmedTx: true,
};

function settingsReducer(
  state: SettingsState,
  action: SettingsAction,
): SettingsState {
  switch (action.type) {
    case 'SET_DISPLAY_UNIT':
      return {...state, displayUnit: action.payload};
    case 'SET_NETWORK':
      return {...state, network: action.payload};
    case 'TOGGLE_BIOMETRICS':
      return {...state, biometricsEnabled: !state.biometricsEnabled};
    case 'TOGGLE_HIDE_BALANCE':
      return {...state, hideBalance: !state.hideBalance};
    case 'SET_AUTO_LOCK_TIMEOUT':
      return {...state, autoLockTimeout: action.payload};
    case 'SET_SECURITY_ALERT_LARGE_BALANCE':
      return {...state, securityAlertLargeBalance: action.payload};
    case 'SET_SECURITY_ALERT_UNCONFIRMED_TX':
      return {...state, securityAlertUnconfirmedTx: action.payload};
    default:
      return state;
  }
}

function parseDisplayUnit(raw: string | null | undefined): DisplayUnit {
  if (raw === 'btc' || raw === 'sats') {
    return raw;
  }
  // Legacy combined display; migrate to sats.
  if (raw === 'both') {
    return 'sats';
  }
  return 'sats';
}

function parseBoolPref(raw: string | null | undefined, defaultValue: boolean): boolean {
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return defaultValue;
}

interface SettingsContextType {
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({children}: {children: ReactNode}) {
  const [state, rawDispatch] = useReducer(settingsReducer, initialSettings);

  const dispatch = useCallback((action: SettingsAction) => {
    if (action.type === 'SET_AUTO_LOCK_TIMEOUT') {
      AsyncStorage.setItem(
        ASYNC_KEYS.AUTO_LOCK_TIMEOUT,
        String(action.payload),
      ).catch(() => {});
    }
    if (action.type === 'SET_DISPLAY_UNIT') {
      AsyncStorage.setItem(ASYNC_KEYS.DISPLAY_UNIT, action.payload).catch(
        () => {},
      );
    }
    if (action.type === 'SET_SECURITY_ALERT_LARGE_BALANCE') {
      AsyncStorage.setItem(
        ASYNC_KEYS.SECURITY_ALERT_LARGE_BALANCE,
        action.payload ? 'true' : 'false',
      ).catch(() => {});
    }
    if (action.type === 'SET_SECURITY_ALERT_UNCONFIRMED_TX') {
      AsyncStorage.setItem(
        ASYNC_KEYS.SECURITY_ALERT_UNCONFIRMED_TX,
        action.payload ? 'true' : 'false',
      ).catch(() => {});
    }
    rawDispatch(action);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ASYNC_KEYS.NETWORK_SELECTION);
        if (cancelled) return;
        if (raw !== 'mainnet') {
          await AsyncStorage.setItem(ASYNC_KEYS.NETWORK_SELECTION, 'mainnet');
        }
        if (!cancelled) {
          rawDispatch({type: 'SET_NETWORK', payload: 'mainnet'});
        }

        const lockRaw = await AsyncStorage.getItem(ASYNC_KEYS.AUTO_LOCK_TIMEOUT);
        if (!cancelled && lockRaw != null && lockRaw !== '') {
          const n = parseInt(lockRaw, 10);
          if (Number.isFinite(n) && n >= 0) {
            rawDispatch({type: 'SET_AUTO_LOCK_TIMEOUT', payload: n});
          }
        }

        const unitRaw = await AsyncStorage.getItem(ASYNC_KEYS.DISPLAY_UNIT);
        if (!cancelled) {
          const unit = parseDisplayUnit(unitRaw);
          rawDispatch({
            type: 'SET_DISPLAY_UNIT',
            payload: unit,
          });
          if (unitRaw === 'both') {
            AsyncStorage.setItem(ASYNC_KEYS.DISPLAY_UNIT, unit).catch(() => {});
          }
        }

        const largeBalRaw = await AsyncStorage.getItem(
          ASYNC_KEYS.SECURITY_ALERT_LARGE_BALANCE,
        );
        const unconfRaw = await AsyncStorage.getItem(
          ASYNC_KEYS.SECURITY_ALERT_UNCONFIRMED_TX,
        );
        if (!cancelled) {
          if (largeBalRaw != null && largeBalRaw !== '') {
            rawDispatch({
              type: 'SET_SECURITY_ALERT_LARGE_BALANCE',
              payload: parseBoolPref(largeBalRaw, initialSettings.securityAlertLargeBalance),
            });
          }
          if (unconfRaw != null && unconfRaw !== '') {
            rawDispatch({
              type: 'SET_SECURITY_ALERT_UNCONFIRMED_TX',
              payload: parseBoolPref(unconfRaw, initialSettings.securityAlertUnconfirmedTx),
            });
          }
        }
      } catch {
        if (!cancelled) {
          await AsyncStorage.setItem(ASYNC_KEYS.NETWORK_SELECTION, 'mainnet').catch(
            () => {},
          );
          rawDispatch({type: 'SET_NETWORK', payload: 'mainnet'});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SettingsContext.Provider
      value={{state, dispatch}}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
