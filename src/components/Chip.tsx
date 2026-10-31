import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Radii, Layout } from '../constants/theme';

interface ChipProps {
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'muted' | 'outline' | 'white' | 'tinted';
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  uppercase?: boolean;
  selected?: boolean;
  testID?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  icon,
  variant = 'tinted',
  size = 'md',
  onPress,
  style,
  textStyle,
  uppercase = false,
  selected = false,
  testID,
}) => {
  const isInteractive = !!onPress;

  const getContainerStyle = (pressed?: boolean): ViewStyle => {
    let bg: string = Colors.chipBackground;
    let border: string = Colors.border;
    let borderWidth = 0;

    if (selected) {
      bg = Colors.primary;
      border = Colors.primary;
    } else {
      switch (variant) {
        case 'primary':
          bg = Colors.primary;
          break;
        case 'white':
          bg = Colors.surface;
          borderWidth = 1;
          border = Colors.border;
          break;
        case 'outline':
          bg = 'transparent';
          borderWidth = 1;
          border = Colors.borderStrong;
          break;
        case 'muted':
          bg = Colors.surfaceMuted;
          break;
        case 'tinted':
        default:
          bg = Colors.chipBackground;
          break;
      }
    }

    let paddingH = 10;
    let paddingV = 4;
    let minH = 24;

    if (size === 'sm') {
      paddingH = 8;
      paddingV = 2;
      minH = 20;
    } else if (size === 'lg') {
      paddingH = 16;
      paddingV = 8;
      minH = Layout.minTouchTarget;
    }

    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: bg,
      borderColor: border,
      borderWidth,
      borderRadius: Radii.full,
      paddingHorizontal: paddingH,
      paddingVertical: paddingV,
      minHeight: minH,
      opacity: pressed ? 0.85 : 1,
    };
  };

  const getTextColor = (): string => {
    if (selected) return Colors.textInverse;
    switch (variant) {
      case 'primary':
        return Colors.textInverse;
      case 'muted':
        return Colors.textSecondary;
      case 'outline':
        return Colors.text;
      case 'white':
        return Colors.text;
      case 'tinted':
      default:
        return Colors.chipText;
    }
  };

  const content = (
    <>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.labelText,
          size === 'sm' && styles.labelSm,
          size === 'lg' && styles.labelLg,
          { color: getTextColor() },
          textStyle,
        ]}
      >
        {uppercase ? label.toUpperCase() : label}
      </Text>
    </>
  );

  if (isInteractive) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [getContainerStyle(pressed), style]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[getContainerStyle(), style]} testID={testID}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    marginRight: 6,
  },
  labelText: {
    fontSize: 11,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelLg: {
    fontSize: 13,
    fontFamily: Typography.family.medium,
    fontWeight: '500',
  },
});
