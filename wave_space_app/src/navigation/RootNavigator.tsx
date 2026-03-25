import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {useAuth} from '@context/AuthContext';
import {useWallet} from '@context/WalletContext';
import type {RootStackParamList} from '@/types/navigation';
import {OnboardingStack} from './OnboardingStack';
import {PinEntryScreen} from '@screens/auth/PinEntryScreen';
import {MainTabNavigator} from './MainTabNavigator';
import {colors} from '@theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};

export function RootNavigator() {
  const {state: authState} = useAuth();
  const {state: walletState} = useWallet();

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!walletState.isInitialized ? (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        ) : !authState.isAuthenticated ? (
          <Stack.Screen name="Auth" component={PinEntryScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
