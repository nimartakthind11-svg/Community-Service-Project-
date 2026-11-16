/**
 * Ask Screen — Screen 7 of Sakhi
 *
 * "Ask anything. Really."
 *
 * Features:
 *  - Curated, offline Q&A library (NO AI, NO network, NO data collection).
 *  - Verified questions and clinical sources in SQLite.
 *  - Debounced search across questions and answers.
 *  - "Browse by topic" 2x2 chips (First periods, Cycle changes, Hygiene, Feelings & discomfort).
 *    Tapping filters; tapping active again clears filter.
 *  - "Common questions" list with "Tap to explore" header and topic tag above each question.
 *  - Answer sheet with plain-language answer, source citation, "Was this helpful?" feedback (stored locally in SQLite),
 *    and related questions.
 *  - "When to talk to someone" callout for potentially concerning symptoms (severe pain, very heavy bleeding).
 *  - Empty search state ("We don't have that one yet") with "Suggest a question" modal saving locally to SQLite.
 *  - Persistent supportive footer card ("You don't have to figure it out alone. A trusted adult or nurse can help, too.").
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import {
  Heart,
  CalendarDays,
  Droplets,
  Users,
  ChevronRight,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { SearchInput } from '@/components/SearchInput';
import { QuestionAnswerSheet } from '@/components/QuestionAnswerSheet';
import { SuggestQuestionModal } from '@/components/SuggestQuestionModal';
import { Colors, Typography, Radii, Shadows, Layout } from '@/constants/theme';
import { useQuestions } from '@/db/hooks/useQuestions';
import { getRelatedQuestions } from '@/db/repositories/questionsRepository';
import { triggerKeyHaptic } from '@/utils/haptics';
import { Question } from '@/db/schema';

interface TopicChipConfig {
  slug: string;
  labelKey: string;
  defaultLabel: string;
  IconComponent: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}

const TOPIC_CHIPS: TopicChipConfig[] = [
  {
    slug: 'first-periods',
    labelKey: 'ask.topicFirstPeriods',
    defaultLabel: 'First periods',
    IconComponent: Heart,
  },
  {
    slug: 'cycle-changes',
    labelKey: 'ask.topicCycleChanges',
    defaultLabel: 'Cycle changes',
    IconComponent: CalendarDays,
  },
  {
    slug: 'hygiene',
    labelKey: 'ask.topicHygiene',
    defaultLabel: 'Hygiene',
    IconComponent: Droplets,
  },
  {
    slug: 'feelings-discomfort',
    labelKey: 'ask.topicFeelingsDiscomfort',
    defaultLabel: 'Feelings & discomfort',
    IconComponent: Users,
  },
];

export default function AskScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Hook for offline questions and local feedback
  const {
    questions,
    loading,
    feedbackMap,
    search,
    submitFeedback,
    suggestQuestion,
  } = useQuestions(selectedTopic || undefined);

  // Active question for answer sheet modal
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);
  const [isAnswerSheetVisible, setIsAnswerSheetVisible] = useState(false);

  // Suggest question modal state
  const [isSuggestModalVisible, setIsSuggestModalVisible] = useState(false);

  // Debounced search timer
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        search(text);
      }, 250);
    },
    [search]
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Topic filter chip toggle
  const handleToggleTopic = (slug: string) => {
    triggerKeyHaptic();
    setSelectedTopic((prev) => (prev === slug ? null : slug));
  };

  // Open question answer sheet
  const handleOpenQuestion = useCallback(
    async (q: Question) => {
      triggerKeyHaptic();
      setActiveQuestion(q);
      setIsAnswerSheetVisible(true);

      // Load related questions from same topic
      try {
        const related = await getRelatedQuestions(db, q.id, q.topic_slug, 3);
        setRelatedQuestions(related);
      } catch (err) {
        console.error('Failed to load related questions:', err);
        setRelatedQuestions([]);
      }
    },
    [db]
  );

  // Helper to get formatted topic display name
  const getTopicLabel = useCallback(
    (slug?: string) => {
      switch (slug) {
        case 'first-periods':
          return t('ask.topicFirstPeriods', 'First periods');
        case 'cycle-changes':
          return t('ask.topicCycleChanges', 'Cycle changes');
        case 'hygiene':
        case 'hygiene-ask':
          return t('ask.topicHygiene', 'Hygiene');
        case 'feelings-discomfort':
          return t('ask.topicFeelingsDiscomfort', 'Feelings & discomfort');
        default:
          return slug || '';
      }
    },
    [t]
  );

  const isHelpfulForActive = useMemo(() => {
    if (!activeQuestion) return null;
    return feedbackMap.has(activeQuestion.id) ? feedbackMap.get(activeQuestion.id)! : null;
  }, [activeQuestion, feedbackMap]);

  return (
    <ScreenWrapper scrollable>
      {/* Top Header */}
      <AppHeader />

      {/* Screen Title & Subtitle */}
      <View style={styles.titleSection}>
        <Text style={styles.title} accessibilityRole="header">
          {t('ask.title', 'Ask anything. Really.')}
        </Text>
        <Text style={styles.subtitle}>
          {t('ask.subtitle', 'Find answers, quietly and at your own pace.')}
        </Text>
      </View>

      {/* Search Input Field */}
      <View style={styles.searchSection}>
        <SearchInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={t('ask.searchPlaceholder', 'Search your question or a topic')}
          onClear={() => handleSearchChange('')}
        />
      </View>

      {/* Browse by topic section (2x2 grid) */}
      <View style={styles.browseSection}>
        <Text style={styles.sectionHeaderTitle}>
          {t('ask.browseByTopic', 'Browse by topic')}
        </Text>
        <View style={styles.topicsGrid}>
          {TOPIC_CHIPS.map((chip) => {
            const isSelected = selectedTopic === chip.slug;
            const IconComp = chip.IconComponent;
            const label = t(chip.labelKey, chip.defaultLabel);

            return (
              <Pressable
                key={chip.slug}
                onPress={() => handleToggleTopic(chip.slug)}
                style={({ pressed }) => [
                  styles.topicChip,
                  isSelected && styles.topicChipSelected,
                  pressed && { opacity: 0.82 },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${label}. ${isSelected ? 'Selected. Tap to clear.' : 'Tap to filter.'}`}
              >
                <IconComp
                  size={16}
                  color={isSelected ? Colors.textInverse : Colors.primary}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.topicChipText,
                    isSelected && styles.topicChipTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Common questions section */}
      <View style={styles.questionsSection}>
        <View style={styles.questionsHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>
            {t('ask.commonQuestions', 'Common questions')}
          </Text>
          <Text style={styles.questionsHeaderHint}>
            {t('ask.tapToExplore', 'Tap to explore')}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : questions.length === 0 ? (
          /* Empty Search State with Suggestion Button */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBadge}>
              <HelpCircle size={28} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {t('ask.emptyTitle', "We don't have that one yet")}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t(
                'ask.emptySubtitle',
                "You can suggest this question, and we'll look into adding a medically reviewed answer."
              )}
            </Text>
            <Pressable
              onPress={() => {
                triggerKeyHaptic();
                setIsSuggestModalVisible(true);
              }}
              style={({ pressed }) => [
                styles.suggestButton,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('ask.suggestButton', 'Suggest a question')}
            >
              <Text style={styles.suggestButtonText}>
                {t('ask.suggestButton', 'Suggest a question')}
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Questions List */
          <View style={styles.questionsList}>
            {questions.map((q) => (
              <Pressable
                key={q.id}
                onPress={() => handleOpenQuestion(q)}
                style={({ pressed }) => [
                  styles.questionCard,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.995 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${getTopicLabel(q.topic_slug)}: ${q.question}`}
              >
                <View style={styles.questionCardLeft}>
                  <Text style={styles.questionTopicTag}>
                    {getTopicLabel(q.topic_slug)}
                  </Text>
                  <Text style={styles.questionText}>{q.question}</Text>
                </View>
                <ChevronRight size={18} color={Colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Reassurance Footer Card */}
      <View style={styles.footerSupportCard}>
        <View style={styles.footerIconBadge}>
          <ShieldCheck size={22} color={Colors.primary} />
        </View>
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerTitle}>
            {t('ask.supportTitle', "You don't have to figure it out alone.")}
          </Text>
          <Text style={styles.footerSubtitle}>
            {t('ask.supportSubtitle', 'A trusted adult or nurse can help, too.')}
          </Text>
        </View>
      </View>

      {/* Answer Bottom Sheet */}
      <QuestionAnswerSheet
        visible={isAnswerSheetVisible}
        question={activeQuestion}
        relatedQuestions={relatedQuestions}
        isHelpful={isHelpfulForActive}
        onSelectRelatedQuestion={handleOpenQuestion}
        onSubmitFeedback={submitFeedback}
        onClose={() => setIsAnswerSheetVisible(false)}
      />

      {/* Suggest Question Modal */}
      <SuggestQuestionModal
        visible={isSuggestModalVisible}
        initialQuery={searchQuery}
        onSave={suggestQuestion}
        onClose={() => setIsSuggestModalVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleSection: {
    paddingVertical: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  searchSection: {
    marginBottom: 20,
  },
  browseSection: {
    marginBottom: 22,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chipBackground,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
    minHeight: Layout.minTouchTarget,
  },
  topicChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  topicChipText: {
    fontSize: 13,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.chipText,
  },
  topicChipTextSelected: {
    color: Colors.textInverse,
  },
  questionsSection: {
    marginBottom: 24,
  },
  questionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  questionsHeaderHint: {
    fontSize: 12.5,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  questionsList: {
    gap: 10,
  },
  questionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Shadows.soft,
  },
  questionCardLeft: {
    flex: 1,
    paddingRight: 10,
  },
  questionTopicTag: {
    fontSize: 11,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  questionText: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.xl,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  suggestButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    ...Shadows.soft,
  },
  suggestButtonText: {
    fontSize: 14,
    fontFamily: Typography.family.semiBold,
    color: Colors.textInverse,
  },
  footerSupportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceTint,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: Layout.tabBarHeight + 16,
  },
  footerIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  footerTextContainer: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 13.5,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  footerSubtitle: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
