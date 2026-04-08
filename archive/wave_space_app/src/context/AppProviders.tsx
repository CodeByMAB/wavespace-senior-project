import React, {ReactNode} from 'react';
import {WalletProvider} from './WalletContext';
import {AuthProvider} from './AuthContext';
import {SettingsProvider} from './SettingsContext';

export function AppProviders({children}: {children: ReactNode}) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <WalletProvider>{children}</WalletProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
