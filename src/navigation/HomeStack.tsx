import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@theme/colors';
import DashboardScreen from '@screens/home/DashboardScreen';
import { SendScreen } from '@screens/send/SendScreen';
import { ReceiveScreen } from '@screens/receive/ReceiveScreen';
import { WithdrawScreen } from '@screens/withdraw/WithdrawScreen';
import { QRScannerScreen } from '@screens/scanner/QRScannerScreen';
import { ChannelListScreen } from '@screens/channels/ChannelListScreen';
import { ChannelDetailScreen } from '@screens/channels/ChannelDetailScreen';
import { TransactionDetailScreen } from '@screens/transactions/TransactionDetailScreen';
import type { Channel, Transaction } from '@/types/wallet';

export type HomeStackParamList = {
  Dashboard: undefined;
  Send:
    | {
        prefillInvoice?: string;
        prefillAddress?: string;
        paymentType?: string;
      }
    | undefined;
  Receive: undefined;
  Withdraw: { scannedAddress?: string; scannedPayload?: string } | undefined;
  QRScanner: { returnScreen: 'Send' | 'Withdraw' };
  ChannelList: undefined;
  ChannelDetail: { channel: Channel };
  TransactionDetail: { transaction: Transaction };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Send" component={SendScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Receive" component={ReceiveScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="ChannelList" component={ChannelListScreen} />
      <Stack.Screen name="ChannelDetail" component={ChannelDetailScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </Stack.Navigator>
  );
}
