/**
 * Article Reader Screen — app/learn/article/[id].tsx
 *
 * Displays:
 *  - Back navigation button
 *  - Article title & reading time badge
 *  - Formatted body text
 *  - Verified medical source citation box
 *  - Automatic recording into `article_reads` table
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { ArrowLeft, Clock, CheckCircle2, ShieldCheck } from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Colors, Typography, Spacing, Radii, Shadows, Layout } from '@/constants/theme';
import { Article } from '@/db/schema';
import {
  getArticleById,
  markArticleAsRead,
  isArticleRead,
} from '@/db/repositories/articlesRepository';

export default function ArticleReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const db = useSQLiteContext();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasBeenRead, setHasBeenRead] = useState(false);

  const articleId = id ? parseInt(id, 10) : 0;

  useEffect(() => {
    let isMounted = true;
    if (!articleId) return;

    async function load() {
      try {
        setLoading(true);
        const data = await getArticleById(db, articleId);
        if (isMounted && data) {
          setArticle(data);
          const wasRead = await isArticleRead(db, articleId);
          setHasBeenRead(wasRead);

          // Automatically mark as read if not already read
          await markArticleAsRead(db, articleId);
          if (isMounted) setHasBeenRead(true);
        }
      } catch (err) {
        console.error('Failed to load article:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [db, articleId]);

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!article) {
    return (
      <ScreenWrapper>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>{t('common.back', 'Back')}</Text>
        </Pressable>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('learn.searchEmptyTitle')}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Split article body into paragraphs for clean typography
  const paragraphs = article.body.split('\n\n').filter(Boolean);

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
      {/* Top Navigation */}
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('common.back', 'Back')}
        hitSlop={12}
      >
        <ArrowLeft size={20} color={Colors.primary} />
        <Text style={styles.backButtonText}>{t('common.back', 'Back')}</Text>
      </Pressable>

      {/* Meta Header */}
      <View style={styles.metaRow}>
        <View style={styles.readTimeBadge}>
          <Clock size={13} color={Colors.textSecondary} />
          <Text style={styles.readTimeText}>
            {t('learn.readMinutes', { minutes: article.read_minutes })}
          </Text>
        </View>
        {hasBeenRead && (
          <View style={styles.readStatusBadge}>
            <CheckCircle2 size={13} color={Colors.success} />
            <Text style={styles.readStatusText}>{t('learn.readTick')}</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.articleTitle} accessibilityRole="header">
        {article.title}
      </Text>

      {/* Body Content */}
      <View style={styles.bodyContainer}>
        {paragraphs.map((p, idx) => (
          <Text key={idx} style={styles.paragraphText}>
            {p}
          </Text>
        ))}
      </View>

      {/* Source Citation Card */}
      <View style={styles.citationCard}>
        <View style={styles.citationHeader}>
          <ShieldCheck size={18} color={Colors.primary} />
          <Text style={styles.citationBadge}>
            {t('learn.verifiedMedicalInfo', 'Evidence-based health education')}
          </Text>
        </View>
        <Text style={styles.citationText}>
          {t('learn.source', { source: article.source })}
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
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
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
    minHeight: Layout.minTouchTarget,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: Typography.family.medium,
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  readTimeText: {
    fontSize: 12,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
  readStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  readStatusText: {
    fontSize: 11,
    fontFamily: Typography.family.semiBold,
    color: Colors.success,
  },
  articleTitle: {
    fontSize: 24,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 32,
    marginBottom: Spacing.lg,
  },
  bodyContainer: {
    marginBottom: Spacing.xl,
  },
  paragraphText: {
    fontSize: 16,
    fontFamily: Typography.family.regular,
    color: Colors.text,
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  citationCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    ...Shadows.soft,
  },
  citationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  citationBadge: {
    fontSize: 12,
    fontFamily: Typography.family.semiBold,
    color: Colors.primary,
  },
  citationText: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
});

