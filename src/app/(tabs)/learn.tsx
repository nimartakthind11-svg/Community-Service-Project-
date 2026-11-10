/**
 * Learn Screen — Screen 4 of Sakhi
 *
 * "Your body, better understood"
 * Features:
 *  - Offline full-text debounced search across articles, topics, and myths
 *  - Highlighted search match text and empty state with navigation to Ask tab
 *  - "A Good Place to Start" featured guide card
 *  - 2x2 Explore by topic grid (Hygiene, First period, Myths vs facts, Body changes)
 *  - Bottom reassuring body growth note
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Droplets,
  Heart,
  Sparkles,
  Flower2,
  BookOpen,
  Sprout,
  HelpCircle,
} from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { SearchInput } from '@/components/SearchInput';
import { Colors, Typography, Spacing, Radii, Shadows, Layout } from '@/constants/theme';
import { useTopics } from '@/db/hooks/useTopics';
import { getFeaturedArticle } from '@/db/repositories/articlesRepository';
import {
  searchOfflineContent,
  SearchResultItem,
} from '@/db/repositories/searchRepository';
import { highlightMatches } from '@/lib/searchUtils';
import { Article, Topic } from '@/db/schema';
import { triggerKeyHaptic } from '@/utils/haptics';

// ─── Highlight Text Component ────────────────────────────────────────────────

interface HighlightTextProps {
  text: string;
  query: string;
  style?: any;
  highlightStyle?: any;
}

const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  query,
  style,
  highlightStyle,
}) => {
  const segments = useMemo(() => highlightMatches(text, query), [text, query]);

  return (
    <Text style={style}>
      {segments.map((seg, i) => (
        <Text
          key={i}
          style={seg.isMatch ? [styles.highlightedSegment, highlightStyle] : undefined}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
};

// ─── Topic Icon Helper ───────────────────────────────────────────────────────

function getTopicIcon(slug: string, iconName?: string) {
  const iconProps = { size: 22, color: Colors.primary, strokeWidth: 2 };
  switch (slug) {
    case 'hygiene':
      return <Droplets {...iconProps} />;
    case 'first-period':
      return <Heart {...iconProps} />;
    case 'myths-vs-facts':
      return <Sparkles {...iconProps} />;
    case 'body-changes':
      return <Flower2 {...iconProps} />;
    default:
      if (iconName === 'droplets') return <Droplets {...iconProps} />;
      if (iconName === 'heart') return <Heart {...iconProps} />;
      if (iconName === 'sparkles') return <Sparkles {...iconProps} />;
      return <Flower2 {...iconProps} />;
  }
}

// ─── Main Screen Component ───────────────────────────────────────────────────

export default function LearnScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const db = useSQLiteContext();

  const { topics, loading: topicsLoading } = useTopics('learn');
  const [featuredArticle, setFeaturedArticle] = useState<Article | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load featured article
  useEffect(() => {
    let isMounted = true;
    getFeaturedArticle(db)
      .then((art) => {
        if (isMounted) setFeaturedArticle(art);
      })
      .catch((err) => console.error('Failed to load featured article:', err));
    return () => {
      isMounted = false;
    };
  }, [db]);

  // Debounced search effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchOfflineContent(db, trimmed);
        if (isMounted) {
          setSearchResults(results);
          setIsSearching(false);
        }
      } catch (err) {
        console.error('Search error:', err);
        if (isMounted) setIsSearching(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [db, searchQuery]);

  const activeResults = searchQuery.trim() ? searchResults : [];
  const activeSearching = searchQuery.trim() ? isSearching : false;

  // Navigation handlers
  const handleFeaturedPress = useCallback(() => {
    triggerKeyHaptic();
    if (featuredArticle) {
      router.push(`/learn/article/${featuredArticle.id}` as any);
    } else {
      router.push('/learn/first-period' as any);
    }
  }, [featuredArticle, router]);

  const handleTopicPress = useCallback(
    (topic: Topic) => {
      triggerKeyHaptic();
      if (topic.slug === 'myths-vs-facts') {
        router.push('/learn/myths-vs-facts' as any);
      } else {
        router.push(`/learn/${topic.slug}` as any);
      }
    },
    [router]
  );

  const handleSearchResultPress = useCallback(
    (item: SearchResultItem) => {
      triggerKeyHaptic();
      if (item.type === 'article' && item.articleId) {
        router.push(`/learn/article/${item.articleId}` as any);
      } else if (item.type === 'myth') {
        router.push('/learn/myths-vs-facts' as any);
      } else if (item.type === 'topic' && item.slug) {
        router.push(`/learn/${item.slug}` as any);
      }
    },
    [router]
  );

  const goToAskTab = () => {
    triggerKeyHaptic();
    router.push('/(tabs)/ask' as any);
  };

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
      {/* ── App Header ─────────────────────────────────────────────── */}
      <AppHeader />

      {/* ── Screen Title & Subtitle ─────────────────────────────────── */}
      <View style={styles.titleSection}>
        <Text style={styles.screenTitle} accessibilityRole="header">
          {t('learn.title')}
        </Text>
        <Text style={styles.screenSubtitle}>{t('learn.subtitle')}</Text>
      </View>

      {/* ── Search Input ───────────────────────────────────────────── */}
      <View style={styles.searchSection}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('learn.searchPlaceholder')}
          onClear={() => setSearchQuery('')}
        />
      </View>

      {/* ── Content: Search Results vs Standard Grid ────────────────── */}
      {isSearchActive ? (
        <View style={styles.searchResultsContainer}>
          {activeSearching ? (
            <View style={styles.searchLoadingBox}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : activeResults.length === 0 ? (
            <View style={styles.emptySearchBox}>
              <View style={styles.emptyIconBadge}>
                <HelpCircle size={28} color={Colors.primary} />
              </View>
              <Text style={styles.emptySearchTitle}>
                {t('learn.searchEmptyTitle', 'Nothing found.')}
              </Text>
              <Text style={styles.emptySearchSubtitle}>
                {t('learn.searchEmptySubtitle', 'Try another word, or ask in the Ask tab')}
              </Text>
              <Pressable
                onPress={goToAskTab}
                style={({ pressed }) => [
                  styles.emptyAskButton,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('learn.searchEmptyAskButton')}
              >
                <Text style={styles.emptyAskButtonText}>
                  {t('learn.searchEmptyAskButton', 'Go to Ask tab →')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text style={styles.resultsCountHeader}>
                {t('learn.searchResultsCount', { count: activeResults.length })}
              </Text>
              <View style={styles.resultsList}>
                {activeResults.map((item) => (
                  <Pressable
                    key={`${item.type}-${item.id}`}
                    onPress={() => handleSearchResultPress(item)}
                    style={({ pressed }) => [
                      styles.resultCard,
                      pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}. ${item.badgeText}`}
                  >
                    <View style={styles.resultCardHeader}>
                      <View style={styles.resultTypePill}>
                        <Text style={styles.resultTypePillText}>
                          {item.type === 'article'
                            ? t('learn.articles', 'Article')
                            : item.type === 'myth'
                            ? t('myths.title', 'Myth vs Fact')
                            : t('learn.exploreTopics', 'Topic')}
                        </Text>
                      </View>
                      <Text style={styles.resultBadgeText}>{item.badgeText}</Text>
                    </View>

                    <HighlightText
                      text={item.title}
                      query={searchQuery}
                      style={styles.resultTitle}
                    />

                    {item.snippet ? (
                      <HighlightText
                        text={item.snippet}
                        query={searchQuery}
                        style={styles.resultSnippet}
                      />
                    ) : null}

                    {item.source ? (
                      <Text style={styles.resultSourceText}>
                        {t('learn.source', { source: item.source })}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <>
          {/* ── Featured Guide Card ("A GOOD PLACE TO START") ─────────── */}
          <Pressable
            onPress={handleFeaturedPress}
            style={({ pressed }) => [
              styles.featuredCard,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${t('learn.featuredTag')}. ${
              featuredArticle?.title || t('learn.featuredTitle')
            }`}
          >
            <View style={styles.featuredContent}>
              <View style={styles.featuredBadgeRow}>
                <Text style={styles.featuredBadgeText}>
                  {t('learn.featuredTag')}
                </Text>
              </View>
              <Text style={styles.featuredTitle}>
                {featuredArticle?.title || t('learn.featuredTitle')}
              </Text>
              <View style={styles.featuredLinkRow}>
                <Text style={styles.featuredLinkText}>
                  {t('learn.readGuide', {
                    minutes: featuredArticle?.read_minutes || 4,
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.featuredArtBadge}>
              <BookOpen size={24} color={Colors.primary} strokeWidth={2.2} />
            </View>
          </Pressable>

          {/* ── Section Header: Explore by Topic ──────────────────────── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {t('learn.exploreTopics')}
            </Text>
            <Text style={styles.paceNoticeText}>{t('learn.paceNotice')}</Text>
          </View>

          {/* ── 2x2 Topics Grid ───────────────────────────────────────── */}
          {topicsLoading ? (
            <View style={styles.gridLoadingBox}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.topicsGrid}>
              {topics.map((top) => (
                <Pressable
                  key={top.id}
                  onPress={() => handleTopicPress(top)}
                  style={({ pressed }) => [
                    styles.topicCard,
                    pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${top.title}. ${top.read_count} reads. ${top.subtitle}`}
                >
                  <View style={styles.topicCardTopRow}>
                    <View style={styles.topicIconBadge}>
                      {getTopicIcon(top.slug, top.icon)}
                    </View>
                    <Text style={styles.readsCountText}>
                      {t('learn.readsCount', { count: top.read_count })}
                    </Text>
                  </View>

                  <Text style={styles.topicCardTitle}>{top.title}</Text>
                  <Text style={styles.topicCardSubtitle} numberOfLines={2}>
                    {top.subtitle}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* ── Bottom Reassurance Banner ─────────────────────────────── */}
          <View style={styles.reassuranceCard}>
            <View style={styles.reassuranceIconBadge}>
              <Sprout size={20} color={Colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.reassuranceTextContainer}>
              <Text style={styles.reassuranceTitle}>
                {t('learn.reassuranceTitle')}
              </Text>
              <Text style={styles.reassuranceSubtitle}>
                {t('learn.reassuranceSubtitle')}
              </Text>
            </View>
          </View>
        </>
      )}
    </ScreenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Layout.tabBarHeight + 36,
  },
  titleSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },
  searchSection: {
    marginBottom: Spacing.lg,
  },

  // ── Featured Card
  featuredCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  featuredContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  featuredBadgeRow: {
    marginBottom: 6,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  featuredTitle: {
    fontSize: 16,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  featuredLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredLinkText: {
    fontSize: 13,
    fontFamily: Typography.family.semiBold,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  featuredArtBadge: {
    width: 48,
    height: 48,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
  },

  // ── Explore Section
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  paceNoticeText: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },

  // ── 2x2 Topics Grid
  gridLoadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  topicCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 136,
    ...Shadows.soft,
  },
  topicCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  topicIconBadge: {
    width: 38,
    height: 38,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readsCountText: {
    fontSize: 11,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
  topicCardTitle: {
    fontSize: 14,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  topicCardSubtitle: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // ── Reassurance Banner
  reassuranceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    ...Shadows.soft,
  },
  reassuranceIconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reassuranceTextContainer: {
    flex: 1,
  },
  reassuranceTitle: {
    fontSize: 13,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  reassuranceSubtitle: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // ── Search Results
  searchResultsContainer: {
    paddingTop: Spacing.xs,
  },
  searchLoadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  resultsCountHeader: {
    fontSize: 13,
    fontFamily: Typography.family.semiBold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  resultsList: {
    gap: Spacing.sm,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resultTypePill: {
    backgroundColor: Colors.surfaceTint,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  resultTypePillText: {
    fontSize: 10,
    fontFamily: Typography.family.bold,
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  resultBadgeText: {
    fontSize: 11,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
  resultTitle: {
    fontSize: 15,
    fontFamily: Typography.family.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  resultSnippet: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  resultSourceText: {
    fontSize: 11,
    fontFamily: Typography.family.regular,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  highlightedSegment: {
    backgroundColor: Colors.chipBackground,
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Empty Search State
  emptySearchBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.soft,
  },
  emptyIconBadge: {
    width: 52,
    height: 52,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  emptySearchSubtitle: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  emptyAskButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: Layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAskButtonText: {
    fontSize: 13,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});
