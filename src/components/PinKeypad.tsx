import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Delete } from 'lucide-react-native';

import { Colors, Typography, Radii, Layout, Shadows } from '@/constants/theme';

export interface PinKeypadProps {
  onDigitPress: (digit: string) => void;
  onDeletePress: () => void;
  disabled?: boolean;
  deleteDisabled?: boolean;
}

interface KeypadKeyProps {
  digit: string;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

function KeypadKey({ digit, disabled, onPress, accessibilityLabel }: KeypadKeyProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.keypadKey,
        {
          backgroundColor: pressed ? Colors.chipBackground : Colors.surface,
          transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.keypadDigit}>{digit}</Text>
    </Pressable>
  );
}

export function PinKeypad({
  onDigitPress,
  onDeletePress,
  disabled = false,
  deleteDisabled = false,
}: PinKeypadProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.keypadContainer, disabled && styles.keypadDisabled]}>
      {/* Row 1: 1, 2, 3 */}
      <View style={styles.keypadRow}>
        {['1', '2', '3'].map((digit) => (
          <KeypadKey
            key={digit}
            digit={digit}
            disabled={disabled}
            onPress={() => onDigitPress(digit)}
            accessibilityLabel={t('lock.accessibility.digit', { digit, defaultValue: `Digit ${digit}` })}
          />
        ))}
      </View>

      {/* Row 2: 4, 5, 6 */}
      <View style={styles.keypadRow}>
        {['4', '5', '6'].map((digit) => (
          <KeypadKey
            key={digit}
            digit={digit}
            disabled={disabled}
            onPress={() => onDigitPress(digit)}
            accessibilityLabel={t('lock.accessibility.digit', { digit, defaultValue: `Digit ${digit}` })}
          />
        ))}
      </View>

      {/* Row 3: 7, 8, 9 */}
      <View style={styles.keypadRow}>
        {['7', '8', '9'].map((digit) => (
          <KeypadKey
            key={digit}
            digit={digit}
            disabled={disabled}
            onPress={() => onDigitPress(digit)}
            accessibilityLabel={t('lock.accessibility.digit', { digit, defaultValue: `Digit ${digit}` })}
          />
        ))}
      </View>

      {/* Row 4: Empty spacer, 0, Delete */}
      <View style={styles.keypadRow}>
        <View style={styles.emptySlot} />
        <KeypadKey
          digit="0"
          disabled={disabled}
          onPress={() => onDigitPress('0')}
          accessibilityLabel={t('lock.accessibility.digit', { digit: '0', defaultValue: 'Digit 0' })}
        />
        <Pressable
          onPress={onDeletePress}
          disabled={disabled || deleteDisabled}
          style={({ pressed }) => [
            styles.keypadKey,
            {
              opacity: deleteDisabled ? 0.35 : pressed ? 0.8 : 1,
              transform: [{ scale: pressed && !deleteDisabled && !disabled ? 0.96 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('lock.accessibility.delete', { defaultValue: 'Delete last digit' })}
        >
          <Delete size={22} color={Colors.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keypadContainer: {
    width: '100%',
    maxWidth: 296,
    alignSelf: 'center',
    gap: 12,
    marginBottom: 16,
  },
  keypadDisabled: {
    opacity: 0.45,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadKey: {
    width: 84,
    height: 56,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.minTouchTarget,
    minWidth: Layout.minTouchTarget,
    ...Shadows.soft,
  },
  emptySlot: {
    width: 84,
    height: 56,
  },
  keypadDigit: {
    fontSize: 24,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.text,
  },
});
