import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import {Header} from '@components/common/Header';
import {Card} from '@components/common/Card';
import {Button} from '@components/common/Button';
import {Input} from '@components/common/Input';
import {BottomSheet} from '@components/common/BottomSheet';
import {CopyableText} from '@components/common/CopyableText';
import {useWallet} from '@context/WalletContext';
import {useSettings} from '@context/SettingsContext';
import {colors, spacing, typography, borderRadius} from '@theme/index';
import {formatAmount, satsToFiat} from '@utils/formatters';
import {parseBitcoinDestination} from '@utils/bitcoin';
import type {FeeSpeed} from '@/types/wallet';
import type {HomeStackParamList} from '@/types/navigation';

const FEE_OPTIONS: {key: FeeSpeed; label: string; rate: number; time: string}[] = [
  {key: 'low', label: 'Low', rate: 1, time: '~60 min'},
  {key: 'medium', label: 'Medium', rate: 5, time: '~30 min'},
  {key: 'high', label: 'High', rate: 20, time: '~10 min'},
];

export function WithdrawScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList, 'Withdraw'>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'Withdraw'>>();
  const insets = useSafeAreaInsets();
  const {state, withdrawOnchain, estimateWithdrawalFee, validateWithdrawalAddress} = useWallet();
  const {state: settings} = useSettings();
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedFee, setSelectedFee] = useState<FeeSpeed>('medium');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estimatedFeeSats, setEstimatedFeeSats] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const [lastTxid, setLastTxid] = useState<string | null>(null);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);

  const amountSats = parseInt(amount || '0', 10);
  const feeOption = FEE_OPTIONS.find(f => f.key === selectedFee)!;
  const fallbackEstimatedFee = feeOption.rate * 250;
  const estimatedFee = estimatedFeeSats ?? fallbackEstimatedFee;
  const normalizedAddress = useMemo(() => {
    const parsed = parseBitcoinDestination(address);
    return parsed?.normalizedAddress ?? address.trim();
  }, [address]);
  const lowerAddress = normalizedAddress.toLowerCase();
  const canWithdraw = normalizedAddress.length > 0 && isAddressValid && amountSats > 0;
  const networkMismatchWarning = useMemo(() => {
    if (!isAddressValid || lowerAddress.length === 0) return null;
    const isTestnetAddress =
      lowerAddress.startsWith('tb1') ||
      lowerAddress.startsWith('m') ||
      lowerAddress.startsWith('n') ||
      lowerAddress.startsWith('2');
    if (isTestnetAddress) {
      return 'This looks like a testnet address. This wallet only sends on Bitcoin mainnet.';
    }
    return null;
  }, [isAddressValid, lowerAddress]);

  useEffect(() => {
    const scannedInput = route.params?.scannedPayload ?? route.params?.scannedAddress;
    if (scannedInput) {
      const parsed = parseBitcoinDestination(scannedInput);
      if (parsed) {
        setAddress(parsed.normalizedAddress);
        if (parsed.amountSats && parsed.amountSats > 0) {
          setAmount(String(parsed.amountSats));
        }
      } else {
        setAddress(scannedInput.trim());
      }
    }
  }, [route.params?.scannedAddress, route.params?.scannedPayload]);

  useEffect(() => {
    if (!normalizedAddress) {
      setIsAddressValid(false);
      setValidationLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setValidationLoading(true);
      try {
        const valid = await validateWithdrawalAddress(normalizedAddress);
        if (!cancelled) {
          setIsAddressValid(valid);
        }
      } catch {
        if (!cancelled) {
          setIsAddressValid(false);
        }
      } finally {
        if (!cancelled) {
          setValidationLoading(false);
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedAddress, validateWithdrawalAddress]);

  useEffect(() => {
    if (!canWithdraw) {
      setEstimatedFeeSats(null);
      setFeeLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setFeeLoading(true);
      try {
        const fee = await estimateWithdrawalFee(normalizedAddress, amountSats, feeOption.rate);
        if (!cancelled) {
          setEstimatedFeeSats(fee);
        }
      } catch {
        if (!cancelled) {
          setEstimatedFeeSats(fallbackEstimatedFee);
        }
      } finally {
        if (!cancelled) {
          setFeeLoading(false);
        }
      }
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amountSats, canWithdraw, estimateWithdrawalFee, fallbackEstimatedFee, feeOption.rate, normalizedAddress]);

  const handleConfirmWithdraw = async () => {
    setLoading(true);
    try {
      const txid = await withdrawOnchain(normalizedAddress, amountSats, feeOption.rate);
      setShowConfirm(false);
      setLastTxid(txid);
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not complete this withdrawal.';
      Alert.alert('Withdrawal failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteAddress = async () => {
    const value = await Clipboard.getStringAsync();
    if (value) {
      const parsed = parseBitcoinDestination(value);
      if (parsed) {
        setAddress(parsed.normalizedAddress);
        if (parsed.amountSats && parsed.amountSats > 0) {
          setAmount(String(parsed.amountSats));
        }
      } else {
        setAddress(value.trim());
      }
    }
  };

  const handleOpenExplorer = async () => {
    if (!lastTxid) return;
    const base = 'https://mempool.space/tx/';
    await Linking.openURL(`${base}${lastTxid}`);
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="Withdraw to External Wallet"
        onClose={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + spacing.xl},
        ]}
        keyboardShouldPersistTaps="handled">
        <Card variant="outline" padding="md">
          <Text style={styles.infoText}>
            This will send funds from your Lightning wallet to an external
            Bitcoin address. On-chain transactions have higher fees and are
            slower than Lightning.
          </Text>
        </Card>

        <Input
          label="DESTINATION BITCOIN ADDRESS"
          placeholder="bc1q..."
          value={normalizedAddress}
          onChangeText={setAddress}
          autoCapitalize="none"
          error={
            normalizedAddress.length > 0 && !validationLoading && !isAddressValid
              ? 'Invalid address format'
              : undefined
          }
        />
        <View style={styles.inputActions}>
          <Button
            title="Paste"
            variant="secondary"
            size="sm"
            icon="clipboard-outline"
            fullWidth={false}
            onPress={handlePasteAddress}
          />
          <Button
            title="Scan QR"
            variant="secondary"
            size="sm"
            icon="scan-outline"
            fullWidth={false}
            onPress={() => navigation.navigate('QRScanner', {returnScreen: 'Withdraw'})}
          />
        </View>
        {networkMismatchWarning ? (
          <Text style={styles.networkWarning}>{networkMismatchWarning}</Text>
        ) : null}

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
          <Text style={styles.fiatConversion}>
            {'\u2248'} {satsToFiat(amountSats)}
          </Text>
        </View>

        <View>
          <Text style={styles.label}>FEE PRIORITY</Text>
          <View style={styles.feeRow}>
            {FEE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.feeOption,
                  selectedFee === opt.key && styles.feeOptionActive,
                ]}
                onPress={() => setSelectedFee(opt.key)}>
                <Text style={styles.feeLabel}>{opt.label}</Text>
                <Text style={styles.feeRate}>
                  ~{formatAmount(opt.rate * 250, settings.displayUnit)}
                </Text>
                <Text style={styles.feeTime}>{opt.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Card>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>
              {formatAmount(amountSats, settings.displayUnit)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>On-chain Fee</Text>
            <Text style={styles.detailValue}>
              {feeLoading
                ? 'Estimating...'
                : `~${formatAmount(estimatedFee, settings.displayUnit)}`}
            </Text>
          </View>
          <View style={[styles.detailRow, {borderBottomWidth: 0}]}>
            <Text style={styles.detailLabel}>Total Deducted</Text>
            <Text style={[styles.detailValue, {color: colors.primary, fontWeight: '700'}]}>
              {formatAmount(amountSats + estimatedFee, settings.displayUnit)}
            </Text>
          </View>
        </Card>

        <Card variant="outline" padding="md">
          <Text style={[styles.warningText]}>
            Withdrawals are irreversible. Please verify the destination address
            carefully.
          </Text>
        </Card>

        <Button
          title="Review Withdrawal"
          onPress={() => setShowConfirm(true)}
          disabled={!canWithdraw}
        />
      </ScrollView>

      <BottomSheet
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}>
        <Text style={styles.sheetTitle}>Confirm Withdrawal</Text>
        <View style={styles.sheetDetail}>
          <Text style={styles.detailLabel}>To</Text>
          <Text style={[styles.detailValue, {fontSize: 12}]} numberOfLines={1}>
            {normalizedAddress}
          </Text>
        </View>
        <View style={styles.sheetDetail}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>
            {formatAmount(amountSats, settings.displayUnit)}
          </Text>
        </View>
        <View style={styles.sheetDetail}>
          <Text style={styles.detailLabel}>Fee ({feeOption.label})</Text>
          <Text style={styles.detailValue}>
            ~{formatAmount(estimatedFee, settings.displayUnit)}
          </Text>
        </View>
        <View style={styles.sheetDetail}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={[styles.detailValue, {color: colors.primary}]}>
            {formatAmount(amountSats + estimatedFee, settings.displayUnit)}
          </Text>
        </View>
        <View style={{gap: spacing.sm, marginTop: spacing.lg}}>
          <Button
            title="Confirm Withdrawal"
            onPress={handleConfirmWithdraw}
            loading={loading}
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setShowConfirm(false)}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          navigation.goBack();
        }}>
        <Text style={styles.sheetTitle}>Withdrawal Submitted</Text>
        <Text style={styles.successText}>
          Your on-chain withdrawal has been broadcast successfully.
        </Text>
        {lastTxid ? <CopyableText label="Transaction ID" text={lastTxid} /> : null}
        <View style={{gap: spacing.sm, marginTop: spacing.lg}}>
          <Button
            title="View on Explorer"
            variant="outline"
            onPress={handleOpenExplorer}
            disabled={!lastTxid}
          />
          <Button
            title="Done"
            onPress={() => {
              setShowSuccess(false);
              navigation.goBack();
            }}
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
  networkWarning: {
    ...typography.bodySmall,
    color: colors.warning,
    marginTop: -spacing.sm,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  fiatConversion: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  feeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  feeOption: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 4,
  },
  feeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  feeLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  feeRate: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  feeTime: {
    ...typography.bodySmall,
    color: colors.textTertiary,
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
  infoText: {
    ...typography.bodySmall,
    color: colors.info,
    lineHeight: 18,
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
  successText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
