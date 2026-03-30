import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {Header} from '@components/common/Header';
import {Card} from '@components/common/Card';
import {Button} from '@components/common/Button';
import {Input} from '@components/common/Input';
import {BottomSheet} from '@components/common/BottomSheet';
import {useWallet} from '@context/WalletContext';
import {useSettings} from '@context/SettingsContext';
import {colors, spacing, typography, borderRadius} from '@theme/index';
import {formatSats, satsToFiat} from '@utils/formatters';
import type {HomeStackParamList} from '@/types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Send'>;

export function SendScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const {sendPayment} = useWallet();
  const {state: settings} = useSettings();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<'sats' | 'btc'>('sats');

  const amountSats =
    unit === 'sats'
      ? parseInt(amount || '0', 10)
      : Math.round(parseFloat(amount || '0') * 100_000_000);
  const estimatedFee = Math.max(1, Math.floor(amountSats * 0.001));

  const canSend = recipient.length > 0 && amountSats > 0;

  const handleConfirmSend = async () => {
    setLoading(true);
    try {
      await sendPayment(recipient, amountSats);
      setShowConfirm(false);
      Alert.alert('Payment Sent', 'Your Lightning payment was successful.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Send Payment" onClose={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + spacing.xl},
        ]}
        keyboardShouldPersistTaps="handled">
        <Input
          label="RECIPIENT"
          placeholder="Invoice, LNURL, or Lightning address"
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
        />
        <View style={styles.inputActions}>
          <Button
            title="Paste"
            variant="secondary"
            size="sm"
            icon="clipboard-outline"
            fullWidth={false}
            onPress={() => {}}
          />
          <Button
            title="Scan QR"
            variant="secondary"
            size="sm"
            icon="scan-outline"
            fullWidth={false}
            onPress={() =>
              navigation.navigate('QRScanner', {returnScreen: 'Send'})
            }
          />
        </View>

        <View>
          <Text style={styles.label}>AMOUNT</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <View style={styles.unitToggle}>
            <Button
              title="sats"
              variant={unit === 'sats' ? 'primary' : 'ghost'}
              size="sm"
              fullWidth={false}
              onPress={() => setUnit('sats')}
            />
            <Button
              title="BTC"
              variant={unit === 'btc' ? 'primary' : 'ghost'}
              size="sm"
              fullWidth={false}
              onPress={() => setUnit('btc')}
            />
          </View>
          <Text style={styles.fiatConversion}>
            {'\u2248'} {satsToFiat(amountSats)}
          </Text>
        </View>

        <Card>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Type</Text>
            <Text style={styles.detailValue}>Lightning</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Fee</Text>
            <Text style={styles.detailValue}>~{formatSats(estimatedFee)} sats</Text>
          </View>
          <View style={[styles.detailRow, {borderBottomWidth: 0}]}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={[styles.detailValue, {fontWeight: '700'}]}>
              {formatSats(amountSats + estimatedFee)} sats
            </Text>
          </View>
        </Card>

        <Card variant="outline" padding="md">
          <Text style={styles.warningText}>
            Lightning payments are instant and irreversible. Please verify the
            recipient before sending.
          </Text>
        </Card>

        <Button
          title="Review Payment"
          onPress={() => setShowConfirm(true)}
          disabled={!canSend}
        />
      </ScrollView>

      <BottomSheet
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}>
        <Text style={styles.sheetTitle}>Confirm Payment</Text>
        <View style={styles.sheetDetail}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>{formatSats(amountSats)} sats</Text>
        </View>
        <View style={styles.sheetDetail}>
          <Text style={styles.detailLabel}>Fee</Text>
          <Text style={styles.detailValue}>~{formatSats(estimatedFee)} sats</Text>
        </View>
        <View style={styles.sheetDetail}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={[styles.detailValue, {color: colors.primary}]}>
            {formatSats(amountSats + estimatedFee)} sats
          </Text>
        </View>
        <View style={{gap: spacing.sm, marginTop: spacing.lg}}>
          <Button
            title="Confirm & Send"
            onPress={handleConfirmSend}
            loading={loading}
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setShowConfirm(false)}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  unitToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fiatConversion: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.warning,
    lineHeight: 18,
  },
  sheetTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  sheetDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
