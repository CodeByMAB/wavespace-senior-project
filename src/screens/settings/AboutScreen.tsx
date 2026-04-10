import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '@/types/navigation';
import { Header } from '@components/common/Header';
import { CopyableText } from '@components/common/CopyableText';
import { useWallet } from '@context/WalletContext';
import { useMainnetTipHeight } from '@hooks/useMainnetTipHeight';
import { colors, spacing } from '@theme/index';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

const BREEZ_SDK_VERSION = '0.10.0';

const DOC_URL = 'https://sdk-doc.breez.technology';
const SUPPORT_URL = 'mailto:support@breez.technology';
const PRIVACY_URL = 'https://breez.technology/privacy';

export function AboutScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { state: walletState } = useWallet();
  const { height: tipHeight, loading: tipLoading } = useMainnetTipHeight();

  const appVersion = Constants.expoConfig?.version ?? '—';
  const blockHeightLabel = tipLoading
    ? '…'
    : tipHeight != null
      ? tipHeight.toLocaleString('en-US')
      : '—';

  const open = (url: string) => {
    void Linking.openURL(url);
  };

  return (
    <View style={styles.root}>
      <Header title="About" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>APP</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowLabel}>App version</Text>
            </View>
            <Text style={styles.rowValue}>{appVersion}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="layers-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowLabel}>Breez SDK</Text>
            </View>
            <Text style={styles.rowValue}>{BREEZ_SDK_VERSION}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="globe-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowLabel}>Network</Text>
            </View>
            <Text style={styles.rowValue}>Bitcoin mainnet</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="git-network-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowLabel}>Block height</Text>
            </View>
            <Text style={styles.rowValue}>{blockHeightLabel}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>NODE</Text>
        <View style={styles.copyWrap}>
          <CopyableText label="NODE PUBKEY" text={walletState.nodeId} />
        </View>

        <Text style={styles.sectionTitle}>LINKS</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={() => open(DOC_URL)} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="book-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowLabel}>Documentation</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => open(SUPPORT_URL)}
            activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="help-circle-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowLabel}>Support</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => open(PRIVACY_URL)}
            activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.rowLabel}>Privacy policy</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  copyWrap: {
    marginTop: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
});
