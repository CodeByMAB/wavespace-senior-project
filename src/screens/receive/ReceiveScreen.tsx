import React, {useState, useEffect, useRef} from 'react';
import {View, Text, TextInput, ScrollView, Share, StyleSheet, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import {Header} from '@components/common/Header';
import {Button} from '@components/common/Button';
import {Card} from '@components/common/Card';
import {ProgressBar} from '@components/common/ProgressBar';
import {useWallet} from '@context/WalletContext';
import {useSettings} from '@context/SettingsContext';
import {colors, spacing, typography, borderRadius} from '@theme/index';
import {formatAmount, satsToFiat} from '@utils/formatters';

export function ReceiveScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    createInvoice,
    receiveChannelOpening,
    startReceiveChannelOpeningMonitor,
    stopReceiveChannelOpeningMonitor,
  } = useWallet();
  const {state: settings} = useSettings();
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [invoice, setInvoice] = useState('');
  const [pendingInvoice, setPendingInvoice] = useState<{
    paymentRequest: string;
    feeSats: number;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(0);
  const [copied, setCopied] = useState(false);
  const openingFailAlertShown = useRef(false);

  const amountSats = parseInt(amount || '0', 10);

  useEffect(() => {
    if (expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expirySeconds]);

  useEffect(() => {
    if (receiveChannelOpening.status !== 'failed') {
      openingFailAlertShown.current = false;
      return;
    }
    if (openingFailAlertShown.current) return;
    openingFailAlertShown.current = true;
    Alert.alert('Opening issue', receiveChannelOpening.message, [
      {
        text: 'Retry',
        onPress: () => {
          stopReceiveChannelOpeningMonitor();
          setInvoice('');
          setPendingInvoice(null);
          setExpirySeconds(0);
        },
      },
      {
        text: 'OK',
        style: 'cancel',
        onPress: () => stopReceiveChannelOpeningMonitor(),
      },
    ]);
  }, [receiveChannelOpening, stopReceiveChannelOpeningMonitor]);

  useEffect(() => {
    return () => stopReceiveChannelOpeningMonitor();
  }, [stopReceiveChannelOpeningMonitor]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await createInvoice(amountSats, memo || undefined);
      if (!res.paymentRequest?.trim()) {
        throw new Error('Could not create a valid invoice. Please try again.');
      }
      setPendingInvoice({
        paymentRequest: res.paymentRequest.trim(),
        feeSats: res.feeSats,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to generate invoice. Please try again.';
      Alert.alert('Invoice Failed', message, [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Retry', onPress: () => void handleGenerate()},
      ]);
    } finally {
      setGenerating(false);
    }
  };

  const confirmPendingInvoice = () => {
    if (!pendingInvoice) return;
    setInvoice(pendingInvoice.paymentRequest);
    setPendingInvoice(null);
    setExpirySeconds(600);
    startReceiveChannelOpeningMonitor();
  };

  const cancelPendingInvoice = () => {
    setPendingInvoice(null);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({message: invoice});
  };

  const minutes = Math.floor(expirySeconds / 60);
  const seconds = expirySeconds % 60;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Receive Payment" onClose={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + spacing.xl},
        ]}
        keyboardShouldPersistTaps="handled">
        {!invoice && !pendingInvoice ? (
          <>
            <View>
              <Text style={styles.label}>AMOUNT (OPTIONAL)</Text>
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
              <Text style={styles.label}>MEMO (OPTIONAL)</Text>
              <TextInput
                style={styles.memoInput}
                placeholder="What is this payment for?"
                placeholderTextColor={colors.textTertiary}
                value={memo}
                onChangeText={setMemo}
              />
            </View>

            <Button
              title="Generate Invoice"
              onPress={handleGenerate}
              loading={generating}
              icon="flash-outline"
            />
          </>
        ) : pendingInvoice ? (
          <>
            <Card style={styles.qrCard}>
              <Text style={styles.feeTitle}>LSP service fee</Text>
              <Text style={styles.feeAmount}>
                {formatAmount(pendingInvoice.feeSats, settings.displayUnit)}
              </Text>
              <Text style={styles.feeBody}>
                Your liquidity provider may charge this fee to receive this payment and
                prepare inbound capacity. Confirm to show your invoice and QR code.
              </Text>
            </Card>
            <Button title="Confirm and show invoice" onPress={confirmPendingInvoice} icon="checkmark" />
            <Button
              title="Cancel"
              variant="outline"
              onPress={cancelPendingInvoice}
            />
          </>
        ) : (
          <>
            <Card style={styles.qrCard}>
              <Text style={styles.qrLabel}>Scan to Pay</Text>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={invoice.toUpperCase()}
                  size={200}
                  backgroundColor={colors.textPrimary}
                  color={colors.background}
                />
              </View>
              <Text style={styles.invoiceText} numberOfLines={2}>
                {invoice}
              </Text>
            </Card>

            <View style={styles.actionRow}>
              <Button
                title={copied ? 'Copied!' : 'Copy'}
                variant="secondary"
                icon={copied ? 'checkmark' : 'copy-outline'}
                fullWidth={false}
                onPress={handleCopy}
                style={{flex: 1}}
              />
              <Button
                title="Share"
                variant="secondary"
                icon="share-outline"
                fullWidth={false}
                onPress={handleShare}
                style={{flex: 1}}
              />
            </View>

            <Card variant="outline" padding="md">
              <Text style={styles.infoText}>
                Lightning invoices expire in {minutes}:{seconds.toString().padStart(2, '0')}.
                The payment will be received instantly.
              </Text>
            </Card>

            {receiveChannelOpening.status === 'opening' && (
              <Card variant="outline" padding="md">
                <Text style={styles.openingTitle}>Channel opening</Text>
                <Text style={styles.openingMessage}>{receiveChannelOpening.message}</Text>
                {receiveChannelOpening.totalRounds > 0 ? (
                  <View style={styles.openingBar}>
                    <ProgressBar
                      progress={
                        receiveChannelOpening.currentRound /
                        Math.max(1, receiveChannelOpening.totalRounds)
                      }
                      color={colors.primary}
                      backgroundColor={colors.border}
                      height={6}
                    />
                    <Text style={styles.openingRounds}>
                      Step {receiveChannelOpening.currentRound} of{' '}
                      {receiveChannelOpening.totalRounds}
                    </Text>
                  </View>
                ) : null}
              </Card>
            )}

            <Button
              title="Create New Invoice"
              variant="outline"
              onPress={() => {
                stopReceiveChannelOpeningMonitor();
                setInvoice('');
                setExpirySeconds(0);
              }}
            />
          </>
        )}
      </ScrollView>
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
  memoInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  qrLabel: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginBottom: spacing.lg,
  },
  qrWrapper: {
    padding: spacing.lg,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  invoiceText: {
    ...typography.mono,
    color: colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.info,
    lineHeight: 18,
  },
  feeTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  feeAmount: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  feeBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  openingTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  openingMessage: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  openingBar: {
    gap: spacing.sm,
  },
  openingRounds: {
    ...typography.bodySmall,
    color: colors.textTertiary,
  },
});
