import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '@/types/navigation';
import {WelcomeScreen} from '@screens/onboarding/WelcomeScreen';
import {CreateWalletScreen} from '@screens/onboarding/CreateWalletScreen';
import {RestoreWalletScreen} from '@screens/onboarding/RestoreWalletScreen';
import {PinSetupScreen} from '@screens/onboarding/PinSetupScreen';
import {BiometricSetupScreen} from '@screens/onboarding/BiometricSetupScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
      <Stack.Screen name="RestoreWallet" component={RestoreWalletScreen} />
      <Stack.Screen name="PinSetup" component={PinSetupScreen} />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
    </Stack.Navigator>
  );
}
