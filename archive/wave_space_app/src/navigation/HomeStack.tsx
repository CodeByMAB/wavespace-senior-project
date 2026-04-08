import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '@/types/navigation';
import {DashboardScreen} from '@screens/home/DashboardScreen';
import {SendScreen} from '@screens/send/SendScreen';
import {ReceiveScreen} from '@screens/receive/ReceiveScreen';
import {WithdrawScreen} from '@screens/withdraw/WithdrawScreen';
import {QRScannerScreen} from '@screens/scanner/QRScannerScreen';
import {ChannelListScreen} from '@screens/channels/ChannelListScreen';
import {TransactionDetailScreen} from '@screens/transactions/TransactionDetailScreen';
import {colors} from '@theme/colors';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background},
      }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen
        name="Send"
        component={SendScreen}
        options={{presentation: 'modal'}}
      />
      <Stack.Screen
        name="Receive"
        component={ReceiveScreen}
        options={{presentation: 'modal'}}
      />
      <Stack.Screen
        name="Withdraw"
        component={WithdrawScreen}
        options={{presentation: 'modal'}}
      />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{presentation: 'fullScreenModal'}}
      />
      <Stack.Screen name="ChannelList" component={ChannelListScreen} />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
      />
    </Stack.Navigator>
  );
}
