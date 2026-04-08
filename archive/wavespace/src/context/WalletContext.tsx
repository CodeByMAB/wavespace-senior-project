import React, { createContext, useContext } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useAuthContext } from './AuthContext';

type WalletContextValue = ReturnType<typeof useWallet>;

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const wallet = useWallet(isAuthenticated);
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return ctx;
}
