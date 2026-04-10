import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import {Header} from '@components/common/Header';
import {Card} from '@components/common/Card';
import {Button} from '@components/common/Button';
import {Input} from '@components/common/Input';
import {BottomSheet} from '@components/common/BottomSheet';
import {useWallet} from '@context/WalletContext';
import {useSettings} from '@context/SettingsContext';
import {colors, spacing, typography, borderRadius} from '@theme/index';
import {formatAmount, satsToFiat} from '@utils/formatters';
import {detectPaymentType, type PaymentType as AppPaymentType} from '@utils/bitcoin';
import type {HomeStackParamList} from '@/types/navigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Send'>;
type SendRoute = RouteProp<HomeStackParamList, 'Send'>;

export function SendScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<SendRoute>();
  const insets = useSafeAreaInsets();
  const {sendPayment, estimateLightningSendFee} = useWallet();
  const {state: settings} = useSettings();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<'sats' | 'btc'>('sats');
  const [feeEstimateSats, setFeeEstimateSats] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);

  useEffect(() => {
    const p = route.params;
    if (p?.prefillInvoice) {
      setRecipient(p.prefillInvoice);
    } else if (p?.prefillAddress) {
      setRecipient(p.prefillAddress);
    }
  }, [route.params?.prefillInvoice, route.params?.prefillAddress]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text?.trim()) {
        setRecipient(text.trim());
      }
    } catch {
      Alert.alert('Paste failed', 'Could not read from the clipboard.');
    }
  }, []);

  const amountSats =
    unit === 'sats'
      ? parseInt(amount || '0', 10)
      : Math.round(parseFloat(amount || '0') * 100_000_000);

  const canSend = recipient.length > 0 && amountSats > 0;

  const paymentTypeHint = useMemo((): AppPaymentType | undefined => {
    const detected = detectPaymentType(recipient);
    if (detected.type !== 'unknown') return detected.type;
    return route.params?.paymentType;
  }, [recipient, route.params?.paymentType]);

  useEffect(() => {
    if (!canSend) {
      setFeeEstimateSats(null);
      setFeeLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        setFeeLoading(true);
        try {
          const fee = await estimateLightningSendFee(recipient, amountSats, paymentTypeHint);
          if (!cancelled) {
            setFeeEstimateSats(fee);
          }
        } finally {
          if (!cancelled) {
            setFeeLoading(false);
          }
        }
      })();
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [recipient, amountSats, canSend, estimateLightningSendFee, paymentTypeHint]);

  const handleConfirmSend = async () => {
    setLoading(true);
    try {
      const detected = detectPaymentType(recipient);
      const paymentTypeHint =
        detected.type !== 'unknown'
          ? detected.type
          : route.params?.paymentType;
      await sendPayment(recipient, amountSats, paymentTypeHint);
      setShowConfirm(false);
      Alert.alert('Payment Sent', 'Your Lightning payment was successful.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send payment. Please try again.';
      Alert.alert('Payment Failed', message);
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
            onPress={handlePaste}
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
            <Text style={styles.detailLabel}>Network fee</Text>
            <View style={styles.feeValueWrap}>
              {feeLoading ? (
                <ActivityIndicator size="small" color={colors.textTertiary} />
              ) : (
                <Text style={styles.detailValue}>
                  {feeEstimateSats !== null
                    ? formatAmount(feeEstimateSats, settings.displayUnit)
                    : '—'}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.detailRow, {borderBottomWidth: 0}]}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={[styles.detailValue, {fontWeight: '700'}]}>
              {feeLoading
                ? '…'
                : feeEstimateSats !== null
                  ? formatAmount(amountSats + feeEstimateSats, settings.displayUnit)
                  : `${formatAmount(amountSats, settings.displayUnit)} + fees`}
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
          <Text style={styles.detailValue}>
            {formatAmount(amountSats, settings.displayUnit)}
          </Text>
        </View>
        <View style={styles.sheetDetail}>
          <Text style={styles.detailLabel}>Network fee</Text>
          {feeLoading ? (
            <ActivityIndicator size="small" color={colors.textTertiary} />
          ) : (
            <Text style={styles.detailValue}>
              {feeEstimateSats !== null
                ? formatAmount(feeEstimateSats, settings.displayUnit)
                : '—'}
            </Text>
          )}
        </View>
        <View style={styles.sheetDetail}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={[styles.detailValue, {color: colors.primary}]}>
            {feeLoading
              ? '…'
              : feeEstimateSats !== null
                ? formatAmount(amountSats + feeEstimateSats, settings.displayUnit)
                : `${formatAmount(amountSats, settings.displayUnit)} + fees`}
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
  feeValueWrap: {
    minHeight: 22,
    justifyContent: 'center',
    alignItems: 'flex-end',
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
