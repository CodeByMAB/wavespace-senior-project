import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { WalletProvider } from './src/context/WalletContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { NonProductionBanner } from './src/components/common/NonProductionBanner';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NonProductionBanner />
      <AuthProvider>
        <SettingsProvider>
          <WalletProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </WalletProvider>
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
