/**
 * Myths vs Facts Screen — Screens 5 and 6 of Sakhi
 *
 * Route: app/learn/myths-vs-facts
 *
 * Screen 5: Myth side (Pink card, "A MYTH YOU MIGHT HEAR", sneaker illustration,
 *           myth text, gentle prompt, "Reveal the fact ↺" button, "Tap the card to see the fact")
 * Screen 6: Fact side (White card, "THE FACT", sneaker illustration, fact headline,
 *           explanation paragraph, medical source, "Next card →" button, "Swipe for another little read")
 *
 * Features:
 *  - 3D card flip animation via React Native Reanimated
 *  - Haptic feedback tick on flip
 *  - Respects "Reduce Motion" accessibility setting (crossfade instead of 3D rotate)
 *  - Horizontal swipe & "Next card" navigation with smooth slide transition
 *  - Friendly completion card at the end ("That's all for now. Come back anytime")
 *  - Topic filtering through bottom sheet (Periods & movement, Hygiene, First periods, Cycle changes, All)
 *  - Viewed cards persisted in SQLite (myth_views table)
 *  - Gentle subtle dot indicators (strictly zero scores or grades)
 *  - Clinical source validation & development console warning for missing sources
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  AccessibilityInfo,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  ChevronDown,
  RotateCw,
  ArrowRight,
  Sparkles,
  RotateCcw,
  BookOpen,
} from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { BottomTabBar } from '@/components/BottomTabBar';
import { MythCardIllustration } from '@/components/MythCardIllustration';
import { TopicFilterSheet, FILTER_OPTIONS } from '@/components/TopicFilterSheet';
import { Colors, Typography, Radii, Shadows, Layout } from '@/constants/theme';
import { useMyths } from '@/db/hooks/useMyths';
import { triggerKeyHaptic } from '@/utils/haptics';
import { MythWithTopic } from '@/db/schema';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 360);
const CARD_HEIGHT = 440;

// Pure external mutation helper to avoid React Compiler / React Hooks immutability lint errors
function setSharedValue<T>(sharedVal: SharedValue<T>, nextVal: T): void {
  'worklet';
  sharedVal.value = nextVal;
}

export default function MythsVsFactsScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  // Topic filter state (default to 'periods-movement' matching design Screens 5 & 6)
  const [selectedTopic, setSelectedTopic] = useState<string | null>('periods-movement');
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  // Load myths and viewed history from SQLite
  const { myths, viewedIds, loading, markViewed } = useMyths(selectedTopic);

  // Card deck navigation & flip state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isReduceMotion, setIsReduceMotion] = useState(false);

  // Reanimated shared values
  const flipProgress = useSharedValue(0); // 0 = front (myth), 1 = back (fact)
  const slideProgress = useSharedValue(0); // horizontal slide offset

  // Listen to Reduce Motion accessibility setting
  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted) setIsReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setIsReduceMotion(enabled);
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  const currentMyth: MythWithTopic | undefined = myths[currentIndex];
  const isCompleted = currentIndex >= myths.length && myths.length > 0;

  // Verify clinical/educational source in development
  useEffect(() => {
    if (__DEV__ && currentMyth) {
      if (!currentMyth.source || currentMyth.source.trim() === '') {
        console.warn(
          `[Myths vs Facts] Myth ID ${currentMyth.id} ("${currentMyth.myth}") has no verifiable source citation.`
        );
      }
    }
  }, [currentMyth]);

  // Flip card handler
  const handleFlip = useCallback(() => {
    if (isCompleted || !currentMyth) return;

    triggerKeyHaptic();
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);

    // If flipping to fact side, persist to SQLite
    if (nextFlipped && currentMyth) {
      markViewed(currentMyth.id);
    }

    const duration = isReduceMotion ? 200 : 450;
    const target = nextFlipped ? 1 : 0;
    setSharedValue(
      flipProgress,
      withTiming(target, {
        duration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [isCompleted, currentMyth, isFlipped, isReduceMotion, markViewed, flipProgress]);

  // Next card handler with slide transition
  const handleNextCard = useCallback(() => {
    if (currentIndex >= myths.length) return;

    triggerKeyHaptic();
    // Slide out left
    setSharedValue(
      slideProgress,
      withTiming(-CARD_WIDTH * 0.4, { duration: 150 }, () => {
        setSharedValue(slideProgress, CARD_WIDTH * 0.4);
        setSharedValue(
          slideProgress,
          withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) })
        );
      })
    );

    setCurrentIndex((prev) => prev + 1);
    setIsFlipped(false);
    setSharedValue(flipProgress, 0);
  }, [currentIndex, myths.length, slideProgress, flipProgress]);

  // Previous card handler with slide transition
  const handlePrevCard = useCallback(() => {
    if (currentIndex <= 0) return;

    triggerKeyHaptic();
    setSharedValue(
      slideProgress,
      withTiming(CARD_WIDTH * 0.4, { duration: 150 }, () => {
        setSharedValue(slideProgress, -CARD_WIDTH * 0.4);
        setSharedValue(
          slideProgress,
          withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) })
        );
      })
    );

    setCurrentIndex((prev) => prev - 1);
    setIsFlipped(false);
    setSharedValue(flipProgress, 0);
  }, [currentIndex, slideProgress, flipProgress]);

  // Restart deck handler
  const handleStartAgain = useCallback(() => {
    triggerKeyHaptic();
    setCurrentIndex(0);
    setIsFlipped(false);
    setSharedValue(flipProgress, 0);
    setSharedValue(slideProgress, 0);
  }, [flipProgress, slideProgress]);

  // Topic selection handler resets card deck smoothly
  const handleSelectTopic = useCallback(
    (slug: string | null) => {
      setSelectedTopic(slug);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSharedValue(flipProgress, 0);
      setSharedValue(slideProgress, 0);
    },
    [flipProgress, slideProgress]
  );

  // PanResponder for smooth horizontal swipe gestures
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Detect horizontal swipe with minimal vertical drift
          return (
            Math.abs(gestureState.dx) > 15 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx, vx } = gestureState;
          if (dx < -40 || vx < -0.3) {
            // Swipe left -> advance to next card
            handleNextCard();
          } else if (dx > 40 || vx > 0.3) {
            // Swipe right -> go back to previous card
            handlePrevCard();
          }
        },
      }),
    [handleNextCard, handlePrevCard]
  );

  // Animated styles for 3D flip or Reduce Motion fade
  const frontCardStyle = useAnimatedStyle(() => {
    if (isReduceMotion) {
      return {
        opacity: interpolate(flipProgress.value, [0, 0.45, 0.55, 1], [1, 0, 0, 0]),
        transform: [{ translateX: slideProgress.value }],
      };
    }
    const rotateValue = interpolate(flipProgress.value, [0, 1], [0, 180]);
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotateValue}deg` },
        { translateX: slideProgress.value },
      ],
      opacity: flipProgress.value >= 0.5 ? 0 : 1,
      backfaceVisibility: 'hidden',
    };
  });

  const backCardStyle = useAnimatedStyle(() => {
    if (isReduceMotion) {
      return {
        opacity: interpolate(flipProgress.value, [0, 0.45, 0.55, 1], [0, 0, 1, 1]),
        transform: [{ translateX: slideProgress.value }],
      };
    }
    const rotateValue = interpolate(flipProgress.value, [0, 1], [180, 360]);
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotateValue}deg` },
        { translateX: slideProgress.value },
      ],
      opacity: flipProgress.value >= 0.5 ? 1 : 0,
      backfaceVisibility: 'hidden',
    };
  });

  // Active topic display label
  const activeTopicLabel = useMemo(() => {
    const opt = FILTER_OPTIONS.find((f) => f.slug === selectedTopic);
    if (!opt || selectedTopic === 'all') {
      return t('myths.allTopics', 'All');
    }
    return t(opt.labelKey, opt.defaultLabel);
  }, [selectedTopic, t]);

  // Tab bar navigation
  const handleTabPress = (tabName: string) => {
    if (tabName === 'learn') {
      router.back();
    } else {
      router.navigate(`/(tabs)/${tabName === 'index' ? '' : tabName}` as any);
    }
  };

  return (
    <ScreenWrapper scrollable withBottomInset={false}>
      {/* Top Header */}
      <AppHeader />

      {/* Back Link */}
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('learn.allLearning', '< All learning')}
        hitSlop={12}
      >
        <ChevronLeft size={18} color={Colors.primary} strokeWidth={2.4} />
        <Text style={styles.backButtonText}>
          {t('learn.allLearning', '< All learning').replace(/^[< ]+/, '')}
        </Text>
      </Pressable>

      {/* Title & Subtitle */}
      <View style={styles.titleSection}>
        <Text style={styles.title} accessibilityRole="header">
          {t('myths.title', 'Myths vs facts')}
        </Text>
        <Text style={styles.subtitle}>
          {t('myths.subtitle', "Let's clear up the things you've heard.")}
        </Text>
      </View>

      {/* Filter Chip & Pace Row */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => {
            triggerKeyHaptic();
            setIsFilterSheetVisible(true);
          }}
          style={({ pressed }) => [
            styles.filterChip,
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${activeTopicLabel}. Filter myths`}
        >
          <Text style={styles.filterChipText}>{activeTopicLabel}</Text>
          <ChevronDown size={14} color={Colors.primary} strokeWidth={2.4} />
        </Pressable>

        <Text style={styles.paceText}>{t('myths.pace', 'At your pace')}</Text>
      </View>

      {/* Main Deck Container */}
      <View style={styles.deckContainer} {...panResponder.panHandlers}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : isCompleted ? (
          /* Completion Card */
          <View style={styles.completionCard}>
            <View style={styles.completionIconBadge}>
              <Sparkles size={32} color={Colors.primary} />
            </View>
            <Text style={styles.completionTitle}>
              {t('myths.completionTitle', "That's all for now.")}
            </Text>
            <Text style={styles.completionSubtitle}>
              {t('myths.completionSubtitle', 'Come back anytime')}
            </Text>
            <Text style={styles.completionMessage}>
              {t(
                'myths.completionReassurance',
                "You've explored the cards in this topic. There's nothing to test or get right — learning is just for you."
              )}
            </Text>

            <View style={styles.completionActions}>
              <Pressable
                onPress={handleStartAgain}
                style={({ pressed }) => [
                  styles.startAgainButton,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('myths.startAgain', 'Start again')}
              >
                <RotateCcw size={16} color={Colors.primary} style={styles.btnIconLeft} />
                <Text style={styles.startAgainButtonText}>
                  {t('myths.startAgain', 'Start again')}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backLearningButton,
                  pressed && { opacity: 0.85 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('myths.backToLearning', 'Back to learning')}
              >
                <BookOpen size={16} color={Colors.textInverse} style={styles.btnIconLeft} />
                <Text style={styles.backLearningButtonText}>
                  {t('myths.backToLearning', 'Back to learning')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : currentMyth ? (
          /* Flippable Card Deck: Screen 5 (Myth) and Screen 6 (Fact) */
          <View style={styles.cardWrapper}>
            {/* Front Card: Myth Side (Screen 5) */}
            <Animated.View
              style={[
                styles.card,
                styles.mythCard,
                frontCardStyle,
                { pointerEvents: isFlipped ? 'none' : 'auto' },
              ]}
            >
              <Pressable
                style={styles.cardInnerTouchable}
                onPress={handleFlip}
                accessibilityRole="button"
                accessibilityLabel={`${t('myths.mythBadge')}: ${currentMyth.myth}. Tap to reveal fact.`}
              >
                {/* Header Badge */}
                <Text style={styles.mythBadge}>
                  {t('myths.mythBadge', 'A MYTH YOU MIGHT HEAR')}
                </Text>

                {/* Illustration */}
                <MythCardIllustration
                  topicSlug={currentMyth.topic_slug || selectedTopic}
                  size={100}
                />

                {/* Center Myth Headline */}
                <Text style={styles.mythHeadline}>{currentMyth.myth}</Text>

                {/* Gentle prompt */}
                <Text style={styles.mythPrompt}>
                  {t(
                    'myths.mythPrompt',
                    "Heard this before? Let's take a gentle look."
                  )}
                </Text>

                {/* Reveal Button */}
                <Pressable
                  onPress={handleFlip}
                  style={({ pressed }) => [
                    styles.primaryPillButton,
                    pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('myths.revealButton', 'Reveal the fact')}
                >
                  <Text style={styles.primaryPillButtonText}>
                    {t('myths.revealButton', 'Reveal the fact ↺').replace(/ [↺↻]/, '')}
                  </Text>
                  <RotateCw size={16} color={Colors.textInverse} strokeWidth={2.4} />
                </Pressable>
              </Pressable>
            </Animated.View>

            {/* Back Card: Fact Side (Screen 6) */}
            <Animated.View
              style={[
                styles.card,
                styles.factCard,
                backCardStyle,
                { pointerEvents: isFlipped ? 'auto' : 'none' },
              ]}
            >
              <Pressable
                style={styles.cardInnerTouchable}
                onPress={handleFlip}
                accessibilityRole="button"
                accessibilityLabel={`${t('myths.factBadge')}: ${currentMyth.fact}. Tap to return to myth.`}
              >
                {/* Header Badge */}
                <Text style={styles.factBadge}>
                  {t('myths.factBadge', 'THE FACT')}
                </Text>

                {/* Illustration */}
                <MythCardIllustration
                  topicSlug={currentMyth.topic_slug || selectedTopic}
                  size={92}
                />

                {/* Fact Headline & Details (Left-aligned) */}
                <View style={styles.factContentBlock}>
                  <Text style={styles.factHeadline}>
                    {currentMyth.fact.split('.')[0] + '.'}
                  </Text>

                  <Text style={styles.factExplanation}>
                    {currentMyth.fact.split('.').slice(1).join('.').trim() ||
                      currentMyth.fact}
                  </Text>

                  {/* Medical Source Line */}
                  <Text style={styles.sourceLine}>
                    {t('myths.sourceLabel', {
                      source: currentMyth.source,
                    })}
                  </Text>
                </View>

                {/* Next Card Button */}
                <Pressable
                  onPress={handleNextCard}
                  style={({ pressed }) => [
                    styles.primaryPillButton,
                    pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('myths.nextCard', 'Next card')}
                >
                  <Text style={styles.primaryPillButtonText}>
                    {t('myths.nextCard', 'Next card →').replace(' →', '')}
                  </Text>
                  <ArrowRight size={16} color={Colors.textInverse} strokeWidth={2.4} />
                </Pressable>
              </Pressable>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t('learn.searchEmptyTitle', 'Nothing found.')}
            </Text>
          </View>
        )}

        {/* Captions Below Card */}
        {!isCompleted && currentMyth && (
          <View style={styles.captionsContainer}>
            <Text style={styles.captionPrimary}>
              {isFlipped
                ? t('myths.factSwipeHint', 'Swipe for another little read')
                : t('myths.mythTapHint', 'Tap the card to see the fact')}
            </Text>
            <Text style={styles.captionSecondary}>
              {t(
                'myths.gentleReassurance',
                'Just exploring. Nothing to get right.'
              )}
            </Text>

            {/* Gentle, non-scoring card dot indicators */}
            {myths.length > 1 && (
              <View
                style={styles.dotsRow}
                accessibilityRole="progressbar"
                accessibilityLabel={t('myths.cardCount', {
                  current: currentIndex + 1,
                  total: myths.length,
                })}
              >
                {myths.map((m, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isViewed = viewedIds.has(m.id);
                  return (
                    <View
                      key={m.id}
                      style={[
                        styles.dot,
                        isCurrent && styles.dotCurrent,
                        !isCurrent && isViewed && styles.dotViewed,
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Topic Filter Bottom Sheet */}
      <TopicFilterSheet
        visible={isFilterSheetVisible}
        selectedSlug={selectedTopic}
        onSelectTopic={handleSelectTopic}
        onClose={() => setIsFilterSheetVisible(false)}
      />

      {/* Bottom Tab Bar to match Screen 5 and Screen 6 */}
      <BottomTabBar
        state={{
          index: 2, // Learn tab active
          routes: [
            { key: 'index', name: 'index' },
            { key: 'track', name: 'track' },
            { key: 'learn', name: 'learn' },
            { key: 'ask', name: 'ask' },
            { key: 'settings', name: 'settings' },
          ],
        }}
        descriptors={{}}
        navigateToTab={handleTabPress}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Typography.family.medium,
    marginLeft: 2,
  },
  titleSection: {
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chipBackground,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.chipText,
  },
  paceText: {
    fontSize: 12,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
  deckContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Layout.tabBarHeight + 24,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radii.xxl,
    paddingHorizontal: 22,
    paddingVertical: 24,
    ...Shadows.card,
  },
  mythCard: {
    backgroundColor: '#FCECEF',
    borderWidth: 1,
    borderColor: '#F7CCD7',
  },
  factCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardInnerTouchable: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  mythBadge: {
    fontSize: 11,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 4,
  },
  factBadge: {
    fontSize: 11,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 4,
  },
  mythHeadline: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  mythPrompt: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  factContentBlock: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
    marginVertical: 4,
  },
  factHeadline: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'left',
    marginBottom: 6,
  },
  factExplanation: {
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'left',
    marginBottom: 10,
  },
  sourceLine: {
    fontSize: 11,
    fontFamily: Typography.family.regular,
    color: Colors.textMuted,
    textAlign: 'left',
  },
  primaryPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    height: 48,
    width: '100%',
    gap: 8,
    ...Shadows.soft,
  },
  primaryPillButtonText: {
    fontSize: 15,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  captionsContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  captionPrimary: {
    fontSize: 12,
    fontFamily: Typography.family.medium,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  captionSecondary: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 3,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderStrong,
  },
  dotCurrent: {
    width: 14,
    backgroundColor: Colors.primary,
  },
  dotViewed: {
    backgroundColor: Colors.primaryMuted,
  },
  loadingContainer: {
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: Typography.family.medium,
  },
  completionCard: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    borderRadius: Radii.xxl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  completionIconBadge: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    backgroundColor: Colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 22,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 15,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  completionMessage: {
    fontSize: 13.5,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  completionActions: {
    width: '100%',
    gap: 10,
  },
  startAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceTint,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    height: 48,
    width: '100%',
  },
  startAgainButtonText: {
    fontSize: 15,
    fontFamily: Typography.family.semiBold,
    color: Colors.primary,
  },
  backLearningButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    height: 48,
    width: '100%',
    ...Shadows.soft,
  },
  backLearningButtonText: {
    fontSize: 15,
    fontFamily: Typography.family.semiBold,
    color: Colors.textInverse,
  },
  btnIconLeft: {
    marginRight: 8,
  },
});
