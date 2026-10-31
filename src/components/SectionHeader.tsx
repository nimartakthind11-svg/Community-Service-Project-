import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Layout } from '../constants/theme';

interface SectionHeaderProps {
  title: string;
  rightActionText?: string;
  onRightActionPress?: () => void;
  rightSubtext?: string;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  rightActionText,
  onRightActionPress,
  rightSubtext,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {rightActionText && onRightActionPress && (
        <Pressable
          onPress={onRightActionPress}
          style={styles.actionPressable}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.actionText}>{rightActionText}</Text>
        </Pressable>
      )}
      {rightSubtext && !rightActionText && (
        <Text style={styles.subtext}>{rightSubtext}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  actionPressable: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.primary,
  },
  subtext: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },
});

