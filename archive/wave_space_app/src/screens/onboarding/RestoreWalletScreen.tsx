import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {GradientBackground} from '@components/common/GradientBackground';
import {Header} from '@components/common/Header';
import {Button} from '@components/common/Button';
import {MnemonicInput} from '@components/onboarding/MnemonicInput';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, typography} from '@theme/index';
import type {OnboardingStackParamList} from '@/types/navigation';

type Nav = NativeStackNavigationProp<
  OnboardingStackParamList,
  'RestoreWallet'
>;

export function RestoreWalletScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [words, setWords] = useState<string[]>(Array(12).fill(''));

  const handleWordChange = (index: number, word: string) => {
    const updated = [...words];
    updated[index] = word;
    setWords(updated);
  };

  const allFilled = words.every(w => w.length > 0);

  return (
    <GradientBackground glow>
      <Header title="" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + spacing.xxl},
        ]}
        keyboardShouldPersistTaps="handled">
        {/* Icon + title section */}
        <View style={styles.heroSection}>
          <View style={styles.iconBox}>
            <Ionicons name="download-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.headline}>Restore{'\n'}your wallet</Text>
          <Text style={styles.subtitle}>
            Enter your 12-word recovery phrase to restore your wallet.
          </Text>
        </View>

        <MnemonicInput words={words} onWordChange={handleWordChange} />

        <Button
          title="Restore Wallet"
          onPress={() => navigation.navigate('PinSetup')}
          disabled={!allFilled}
          icon="refresh-outline"
          style={styles.btn}
        />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.xxl,
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
  btn: {
    borderRadius: 50,
  },
});
