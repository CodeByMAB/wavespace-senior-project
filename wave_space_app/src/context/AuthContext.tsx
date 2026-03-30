import React, {createContext, useContext, useReducer, ReactNode} from 'react';

interface AuthState {
  isAuthenticated: boolean;
  hasPin: boolean;
  hasBiometrics: boolean;
  pin: string | null;
}

type AuthAction =
  | {type: 'SET_PIN'; payload: string}
  | {type: 'ENABLE_BIOMETRICS'}
  | {type: 'AUTHENTICATE'}
  | {type: 'LOCK'}
  | {type: 'RESET'};

const initialAuthState: AuthState = {
  isAuthenticated: false,
  hasPin: false,
  hasBiometrics: false,
  pin: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_PIN':
      return {
        ...state,
        hasPin: true,
        pin: action.payload,
        isAuthenticated: true,
      };
    case 'ENABLE_BIOMETRICS':
      return {...state, hasBiometrics: true};
    case 'AUTHENTICATE':
      return {...state, isAuthenticated: true};
    case 'LOCK':
      return {...state, isAuthenticated: false};
    case 'RESET':
      return initialAuthState;
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  verifyPin: (entered: string) => boolean;
  authenticateWithBiometrics: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const verifyPin = (entered: string): boolean => {
    return entered === state.pin;
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    return true;
  };

  return (
    <AuthContext.Provider
      value={{state, dispatch, verifyPin, authenticateWithBiometrics}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
