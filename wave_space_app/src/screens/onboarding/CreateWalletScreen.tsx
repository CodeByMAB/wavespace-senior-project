import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {GradientBackground} from '@components/common/GradientBackground';
import {Header} from '@components/common/Header';
import {Button} from '@components/common/Button';
import {MnemonicGrid} from '@components/onboarding/MnemonicGrid';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, typography} from '@theme/index';
import {MOCK_MNEMONIC} from '@data/mockWallet';
import type {OnboardingStackParamList} from '@/types/navigation';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'CreateWallet'>;

export function CreateWalletScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <GradientBackground glow>
      <Header title="" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + spacing.xxl},
        ]}>
        {/* Icon + title section */}
        <View style={styles.heroSection}>
          <View style={styles.iconBox}>
            <Ionicons name="key-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.headline}>Back up{'\n'}your wallet</Text>
          <Text style={styles.subtitle}>
            Write down these 12 words and store them safely. Anyone with these
            words can access your funds.
          </Text>
        </View>

        {/* Mnemonic grid */}
        <View style={styles.mnemonicSection}>
          <MnemonicGrid words={MOCK_MNEMONIC} />
        </View>

        {/* Confirmation checkbox */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setConfirmed(!confirmed)}
          activeOpacity={0.7}>
          <Ionicons
            name={confirmed ? 'checkbox' : 'square-outline'}
            size={24}
            color={confirmed ? colors.primary : colors.textTertiary}
          />
          <Text style={styles.checkLabel}>
            I have written down my recovery phrase and stored it safely
          </Text>
        </TouchableOpacity>

        <Button
          title="Continue"
          onPress={() => navigation.navigate('PinSetup')}
          disabled={!confirmed}
          style={styles.btn}
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.xl,
  },
  heroSection: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  mnemonicSection: {
    paddingVertical: spacing.sm,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkLabel: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    flex: 1,
  },
  btn: {
    borderRadius: 50,
  },
});
