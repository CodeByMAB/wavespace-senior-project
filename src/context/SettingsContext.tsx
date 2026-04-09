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
}

type SettingsAction =
  | {type: 'SET_DISPLAY_UNIT'; payload: DisplayUnit}
  | {type: 'SET_NETWORK'; payload: Network}
  | {type: 'TOGGLE_BIOMETRICS'}
  | {type: 'TOGGLE_HIDE_BALANCE'};

const initialSettings: SettingsState = {
  displayUnit: 'sats',
  network: 'testnet',
  biometricsEnabled: false,
  hideBalance: false,
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
    default:
      return state;
  }
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
    if (action.type === 'SET_NETWORK') {
      AsyncStorage.setItem(ASYNC_KEYS.NETWORK_SELECTION, action.payload).catch(
        () => {},
      );
    }
    rawDispatch(action);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ASYNC_KEYS.NETWORK_SELECTION);
        if (cancelled) return;
        if (raw === null || raw === '') {
          await AsyncStorage.setItem(ASYNC_KEYS.NETWORK_SELECTION, 'testnet');
          if (!cancelled) {
            rawDispatch({type: 'SET_NETWORK', payload: 'testnet'});
          }
          return;
        }
        const network: Network = raw === 'mainnet' ? 'mainnet' : 'testnet';
        rawDispatch({type: 'SET_NETWORK', payload: network});
      } catch {
        if (!cancelled) {
          await AsyncStorage.setItem(ASYNC_KEYS.NETWORK_SELECTION, 'testnet').catch(
            () => {},
          );
          rawDispatch({type: 'SET_NETWORK', payload: 'testnet'});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SettingsContext.Provider value={{state, dispatch}}>
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
