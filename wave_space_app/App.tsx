import React from 'react';
import {StatusBar} from 'expo-status-bar';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProviders} from './src/context/AppProviders';
import {RootNavigator} from './src/navigation/RootNavigator';
import {colors} from './src/theme/colors';

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1, backgroundColor: colors.background}}>
      <SafeAreaProvider>
        <AppProviders>
          <StatusBar style="light" />
          <RootNavigator />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
