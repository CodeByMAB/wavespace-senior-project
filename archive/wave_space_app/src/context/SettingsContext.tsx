import React, {createContext, useContext, useReducer, ReactNode} from 'react';
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
  const [state, dispatch] = useReducer(settingsReducer, initialSettings);
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
