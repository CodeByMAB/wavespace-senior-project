import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, typography} from '@theme/index';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
}

export function Header({title, onBack, onClose, rightAction}: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {paddingTop: insets.top + spacing.sm}]}>
      <View style={styles.leftSlot}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        )}
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightSlot}>
        {rightAction && (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={styles.iconBtn}>
            <Ionicons
              name={rightAction.icon}
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  leftSlot: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightSlot: {
    width: 40,
    alignItems: 'flex-end',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  iconBtn: {
    padding: spacing.xs,
  },
});
