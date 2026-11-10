/**
 * Topic Articles Screen — app/learn/[topic].tsx
 *
 * Displays all articles under a selected topic, indicating read status.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { useTopicDetail } from '@/db/hooks/useTopics';
import { Colors, Typography, Spacing, Radii, Shadows, Layout } from '@/constants/theme';
import { Article } from '@/db/schema';
import {
  getArticlesByTopicSlug,
  getReadArticleIds,
} from '@/db/repositories/articlesRepository';

export default function TopicDetailScreen() {
  const { topic: slug } = useLocalSearchParams<{ topic: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const db = useSQLiteContext();

  const { topic, loading: topicLoading } = useTopicDetail(slug || '');
  const [articles, setArticles] = useState<Article[]>([]);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [loadingArticles, setLoadingArticles] = useState(true);

  // Refresh articles and read statuses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      if (!slug) return;

      async function load() {
        try {
          setLoadingArticles(true);
          const [data, reads] = await Promise.all([
            getArticlesByTopicSlug(db, slug),
            getReadArticleIds(db),
          ]);
          if (isMounted) {
            setArticles(data);
            setReadIds(reads);
          }
        } catch (err) {
          console.error('Failed to load topic articles:', err);
        } finally {
          if (isMounted) setLoadingArticles(false);
        }
      }

      load();

      return () => {
        isMounted = false;
      };
    }, [db, slug])
  );

  const handleOpenArticle = (id: number) => {
    router.push(`/learn/article/${id}` as any);
  };

  const isLoading = topicLoading || loadingArticles;

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
      {/* Top Back Navigation */}
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('learn.allLearning', '< All learning')}
        hitSlop={12}
      >
        <ArrowLeft size={20} color={Colors.primary} />
        <Text style={styles.backButtonText}>
          {t('learn.allLearning', '< All learning')}
        </Text>
      </Pressable>

      {/* Topic Header */}
      <View style={styles.headerSection}>
        <Text style={styles.topicTitle} accessibilityRole="header">
          {topic?.title || slug}
        </Text>
        {topic?.subtitle ? (
          <Text style={styles.topicSubtitle}>{topic.subtitle}</Text>
        ) : null}
      </View>

      {/* Articles Section */}
      <Text style={styles.sectionHeader}>{t('learn.articles', 'Articles')}</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {t('learn.noArticlesYet', 'Articles coming soon.')}
          </Text>
        </View>
      ) : (
        <View style={styles.articlesList}>
          {articles.map((art) => {
            const isRead = readIds.has(art.id);
            return (
              <Pressable
                key={art.id}
                onPress={() => handleOpenArticle(art.id)}
                style={({ pressed }) => [
                  styles.articleCard,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${art.title}. ${art.read_minutes} minute read.${
                  isRead ? ' Read.' : ''
                }`}
              >
                <View style={styles.articleCardContent}>
                  <Text style={styles.articleItemTitle}>{art.title}</Text>
                  <View style={styles.articleMetaRow}>
                    <View style={styles.readTimeTag}>
                      <Clock size={12} color={Colors.textSecondary} />
                      <Text style={styles.readTimeTagText}>
                        {t('learn.readMinutes', { minutes: art.read_minutes })}
                      </Text>
                    </View>
                    {isRead && (
                      <View style={styles.readTickBadge}>
                        <CheckCircle2 size={12} color={Colors.success} />
                        <Text style={styles.readTickText}>
                          {t('learn.readTick', 'Read')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: Layout.tabBarHeight + 36,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
    minHeight: Layout.minTouchTarget,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: Typography.family.medium,
    color: Colors.primary,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  topicTitle: {
    fontSize: 24,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  topicSubtitle: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  articlesList: {
    gap: Spacing.sm,
  },
  articleCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    ...Shadows.soft,
  },
  articleCardContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  articleItemTitle: {
    fontSize: 15,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  articleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  readTimeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeTagText: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },
  readTickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  readTickText: {
    fontSize: 11,
    fontFamily: Typography.family.semiBold,
    color: Colors.success,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },
});
