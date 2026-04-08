import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, borderRadius} from '@theme/index';

interface PinPadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
  onBiometric?: () => void;
  showBiometric?: boolean;
}

export function PinPad({
  onPress,
  onDelete,
  onBiometric,
  showBiometric = false,
}: PinPadProps) {
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['bio', '0', 'del'],
  ];

  const renderKey = (key: string) => {
    if (key === 'bio') {
      if (!showBiometric) {
        return <View style={styles.key} />;
      }
      return (
        <TouchableOpacity
          style={styles.key}
          onPress={onBiometric}
          activeOpacity={0.6}>
          <Ionicons
            name="finger-print-outline"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      );
    }

    if (key === 'del') {
      return (
        <TouchableOpacity
          style={styles.key}
          onPress={onDelete}
          activeOpacity={0.6}>
          <Ionicons
            name="backspace-outline"
            size={28}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.key}
        onPress={() => onPress(key)}
        activeOpacity={0.6}>
        <Text style={styles.keyText}>{key}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map(key => (
            <React.Fragment key={key}>{renderKey(key)}</React.Fragment>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
