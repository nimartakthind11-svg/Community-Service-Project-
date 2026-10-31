import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Typography } from '@/constants/theme';

export default function AskScreen() {
  const { t } = useTranslation();

  return (
    <ScreenWrapper scrollable>
      <AppHeader />
      <View style={styles.container}>
        <Text style={styles.title}>{t('ask.title')}</Text>
        <Text style={styles.subtitle}>{t('ask.subtitle')}</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },
});

