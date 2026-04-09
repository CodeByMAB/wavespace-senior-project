import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SettingsStackParamList } from '@/types/navigation';
import type { DisplayUnit } from '@/types/wallet';
import { Header } from '@components/common/Header';
import { useSettings } from '@context/SettingsContext';
import { colors, spacing } from '@theme/index';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

const OPTIONS: { unit: DisplayUnit; label: string }[] = [
  { unit: 'sats', label: 'Sats' },
  { unit: 'btc', label: 'BTC' },
  { unit: 'both', label: 'Both' },
];

export function DisplayUnitsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { state: settings, dispatch } = useSettings();

  return (
    <View style={styles.root}>
      <Header title="Display unit" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {OPTIONS.map(({ unit, label }, index) => (
            <React.Fragment key={unit}>
              {index > 0 ? <View style={styles.separator} /> : null}
              <TouchableOpacity
                style={styles.row}
                onPress={() => dispatch({ type: 'SET_DISPLAY_UNIT', payload: unit })}
                activeOpacity={0.7}>
                <Text style={styles.rowLabel}>{label}</Text>
                {settings.displayUnit === unit ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            </React.Fragment>
          ))}
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
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
});
