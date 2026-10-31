import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { Colors, Radii, Shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'white' | 'tinted' | 'flat';
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'white',
  onPress,
  style,
  testID,
  accessibilityLabel,
  accessibilityRole,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'white':
        return Colors.surface;
      case 'tinted':
        return Colors.surfaceTint;
      case 'flat':
        return Colors.surfaceMuted;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    ...Shadows.card,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          {
            opacity: pressed ? 0.95 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
          style,
        ]}
        testID={testID}
        accessibilityRole={accessibilityRole || 'button'}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[cardStyle, style]}
      testID={testID}
      accessibilityRole={accessibilityRole || 'none'}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};
