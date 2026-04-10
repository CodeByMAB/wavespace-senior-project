import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@theme/colors';

const stage = Constants.expoConfig?.extra?.releaseStage as string | undefined;

export function NonProductionBanner() {
  const insets = useSafeAreaInsets();
  if (stage !== 'development' && stage !== 'preview') {
    return null;
  }
  const label = stage === 'preview' ? 'Preview build — not for production use' : 'Development build — not for production use';
  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.warningMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.warning,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  text: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
