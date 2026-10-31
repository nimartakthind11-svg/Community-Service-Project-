import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Radii } from '../constants/theme';

interface AppHeaderProps {
  style?: ViewStyle;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ style, rightAction }) => {
  const { t } = useTranslation();

  return (
    <View
      style={[styles.headerContainer, style]}
      accessibilityRole="header"
      accessibilityLabel="Sakhi header"
    >
      <View style={styles.brandRow}>
        <View style={styles.logoBadge} accessibilityElementsHidden>
          <Text style={styles.logoText}>s</Text>
        </View>
        <Text style={styles.brandTitle}>{t('brand.name', 'Sakhi')}</Text>
      </View>
      {rightAction && <View style={styles.rightContainer}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    color: Colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Typography.family.bold,
    lineHeight: 20,
    marginTop: -2,
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

