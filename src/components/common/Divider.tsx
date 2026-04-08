import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {colors, spacing} from '@theme/index';

interface DividerProps {
  style?: ViewStyle;
}

export function Divider({style}: DividerProps) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
});
