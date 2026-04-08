import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, borderRadius, typography} from '@theme/index';

interface CopyableTextProps {
  text: string;
  displayText?: string;
  label?: string;
  mono?: boolean;
}

export function CopyableText({
  text,
  displayText,
  label,
  mono = true,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.container}
        onPress={handleCopy}
        activeOpacity={0.7}>
        <Text
          style={[styles.text, mono && typography.mono]}
          numberOfLines={1}
          ellipsizeMode="middle">
          {displayText || text}
        </Text>
        <Ionicons
          name={copied ? 'checkmark' : 'copy-outline'}
          size={18}
          color={copied ? colors.success : colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
});
