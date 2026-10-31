import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { useTopicDetail } from '@/db/hooks/useTopics';
import { Colors, Typography } from '@/constants/theme';

export default function TopicDetailScreen() {
  const { topic: slug } = useLocalSearchParams<{ topic: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { topic, loading } = useTopicDetail(slug || '');

  return (
    <ScreenWrapper scrollable>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{t('learn.allLearning', '< All learning')}</Text>
      </Pressable>
      <View style={styles.container}>
        <Text style={styles.title}>{loading ? t('common.loading') : topic?.title || slug}</Text>
        <Text style={styles.subtitle}>{topic?.subtitle || ''}</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Typography.family.medium,
  },
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
