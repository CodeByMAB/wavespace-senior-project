import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, ScrollView, Share, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import {Header} from '@components/common/Header';
import {Button} from '@components/common/Button';
import {Card} from '@components/common/Card';
import {useWallet} from '@context/WalletContext';
import {colors, spacing, typography, borderRadius} from '@theme/index';
import {satsToFiat} from '@utils/formatters';

export function ReceiveScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {createInvoice} = useWallet();
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [invoice, setInvoice] = useState('');
  const [generating, setGenerating] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  const amountSats = parseInt(amount || '0', 10);

  useEffect(() => {
    if (expirySeconds <= 0) return;
    const timer = setInterval(() => {
      setExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expirySeconds]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const inv = await createInvoice(amountSats, memo || undefined);
      setInvoice(inv);
      setExpirySeconds(600);
    } finally {
      setGenerating(false);
    }
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
        {!invoice ? (
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

            <Button
              title="Create New Invoice"
              variant="outline"
              onPress={() => {
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
});
