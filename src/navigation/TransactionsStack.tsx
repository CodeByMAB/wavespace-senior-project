import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@theme/colors';
import { TransactionHistoryScreen } from '@screens/transactions/TransactionHistoryScreen';
import { TransactionDetailScreen } from '@screens/transactions/TransactionDetailScreen';
import type { Transaction } from '@/types/wallet';

export type TransactionsStackParamList = {
  TransactionHistory: undefined;
  TransactionDetail: { transaction: Transaction };
};

const Stack = createNativeStackNavigator<TransactionsStackParamList>();

export function TransactionsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </Stack.Navigator>
  );
}
