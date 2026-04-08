import React from 'react';
import {ScrollView, View, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {BalanceCard} from '@components/home/BalanceCard';
import {QuickActions} from '@components/home/QuickActions';
import {LiquidityBar} from '@components/home/LiquidityBar';
import {RecentTransactions} from '@components/home/RecentTransactions';
import {useWallet} from '@context/WalletContext';
import {colors, spacing} from '@theme/index';
import type {HomeStackParamList} from '@/types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Dashboard'>;

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {state} = useWallet();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.sm,
        paddingBottom: insets.bottom + spacing.xxl,
      }}
      showsVerticalScrollIndicator={false}>
      <BalanceCard />

      <QuickActions
        onSend={() => navigation.navigate('Send')}
        onReceive={() => navigation.navigate('Receive')}
        onWithdraw={() => navigation.navigate('Withdraw')}
        onScan={() => navigation.navigate('QRScanner', {returnScreen: 'Send'})}
      />

      <View style={styles.spacer} />

      <LiquidityBar />

      <RecentTransactions
        transactions={state.transactions}
        onSeeAll={() => {
          const parent = navigation.getParent();
          if (parent) {
            parent.navigate('TransactionsTab');
          }
        }}
        onTransactionPress={tx =>
          navigation.navigate('TransactionDetail', {transaction: tx})
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  spacer: {
    height: spacing.sm,
  },
});
