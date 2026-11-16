import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  X,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Typography, Radii, Layout, Shadows } from '../constants/theme';
import { Question } from '../db/schema';
import { triggerKeyHaptic } from '../utils/haptics';

interface QuestionAnswerSheetProps {
  visible: boolean;
  question: Question | null;
  relatedQuestions?: Question[];
  isHelpful?: boolean | null;
  onSelectRelatedQuestion?: (q: Question) => void;
  onSubmitFeedback?: (questionId: number, isHelpful: boolean) => void;
  onClose: () => void;
}

export const QuestionAnswerSheet: React.FC<QuestionAnswerSheetProps> = ({
  visible,
  question,
  relatedQuestions = [],
  isHelpful: initialHelpful = null,
  onSelectRelatedQuestion,
  onSubmitFeedback,
  onClose,
}) => {
  const { t } = useTranslation();
  const [slideAnim] = useState(() => new Animated.Value(450));
  const [localFeedback, setLocalFeedback] = useState<Record<number, boolean>>({});

  const feedbackGiven = (question ? localFeedback[question.id] : undefined) ?? initialHelpful;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
        speed: 14,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 450,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!question) return null;

  const handleFeedback = (helpful: boolean) => {
    triggerKeyHaptic();
    setLocalFeedback((prev) => ({ ...prev, [question.id]: helpful }));
    onSubmitFeedback?.(question.id, helpful);
  };

  const getTopicDisplayName = (slug?: string) => {
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
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.sheetOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('ask.close', 'Close')}
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Top Handle */}
          <View style={styles.sheetHandle} />

          {/* Top Navigation Row */}
          <View style={styles.topNavRow}>
            <View style={styles.topicBadge}>
              <Text style={styles.topicBadgeText}>
                {getTopicDisplayName(question.topic_slug)}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={t('ask.close', 'Close')}
              hitSlop={8}
            >
              <X size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Question Title */}
            <Text style={styles.questionTitle} accessibilityRole="header">
              {question.question}
            </Text>

            {/* Answer Body */}
            <View style={styles.answerBox}>
              <Text style={styles.answerText}>{question.answer}</Text>
            </View>

            {/* When to Talk to Someone Callout */}
            {question.is_concerning === 1 && (
              <View style={styles.calloutContainer}>
                <View style={styles.calloutHeader}>
                  <AlertCircle size={18} color={Colors.primary} />
                  <Text style={styles.calloutTitle}>
                    {t('ask.whenToTalkTitle', 'When to talk to someone')}
                  </Text>
                </View>
                <Text style={styles.calloutBody}>
                  {t(
                    'ask.whenToTalkBody',
                    'If you are experiencing severe, unbearable pain, very heavy bleeding (soaking through a pad every 1–2 hours), or feeling dizzy/faint, please gently reach out to a parent, trusted adult, school nurse, or healthcare provider. This is educational support, not a clinical diagnosis.'
                  )}
                </Text>
                <Text style={styles.calloutDisclaimer}>
                  {t('ask.notADiagnosis', 'This is educational information, not a medical diagnosis.')}
                </Text>
              </View>
            )}

            {/* Medical Source Citation */}
            <Text style={styles.sourceCitation}>
              {t('ask.sourceLabel', { source: question.source })}
            </Text>

            {/* Was this helpful? section */}
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackQuestion}>
                {t('ask.wasThisHelpful', 'Was this helpful?')}
              </Text>
              <View style={styles.feedbackButtonsRow}>
                <Pressable
                  onPress={() => handleFeedback(true)}
                  style={({ pressed }) => [
                    styles.feedbackButton,
                    feedbackGiven === true && styles.feedbackButtonActive,
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('ask.helpfulYes', 'Helpful')}
                >
                  <ThumbsUp
                    size={15}
                    color={feedbackGiven === true ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.feedbackButtonText,
                      feedbackGiven === true && styles.feedbackButtonTextActive,
                    ]}
                  >
                    {t('ask.helpfulYes', 'Helpful')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleFeedback(false)}
                  style={({ pressed }) => [
                    styles.feedbackButton,
                    feedbackGiven === false && styles.feedbackButtonActive,
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('ask.helpfulNo', 'Not quite')}
                >
                  <ThumbsDown
                    size={15}
                    color={feedbackGiven === false ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.feedbackButtonText,
                      feedbackGiven === false && styles.feedbackButtonTextActive,
                    ]}
                  >
                    {t('ask.helpfulNo', 'Not quite')}
                  </Text>
                </Pressable>
              </View>

              {feedbackGiven !== null && (
                <Text style={styles.feedbackThankYou}>
                  {t('ask.feedbackThankYou', 'Thank you for letting us know!')}
                </Text>
              )}
            </View>

            {/* Related Questions */}
            {relatedQuestions.length > 0 && (
              <View style={styles.relatedSection}>
                <View style={styles.relatedHeader}>
                  <Sparkles size={16} color={Colors.primary} />
                  <Text style={styles.relatedTitle}>
                    {t('ask.relatedQuestions', 'Related questions')}
                  </Text>
                </View>
                <View style={styles.relatedList}>
                  {relatedQuestions.map((rel) => (
                    <Pressable
                      key={rel.id}
                      onPress={() => {
                        triggerKeyHaptic();
                        onSelectRelatedQuestion?.(rel);
                      }}
                      style={({ pressed }) => [
                        styles.relatedItem,
                        pressed && { opacity: 0.85, backgroundColor: Colors.surfaceTint },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={rel.question}
                    >
                      <View style={styles.relatedItemContent}>
                        <Text style={styles.relatedItemTopic}>
                          {getTopicDisplayName(rel.topic_slug)}
                        </Text>
                        <Text style={styles.relatedItemQuestion}>
                          {rel.question}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    paddingTop: 12,
    maxHeight: '85%',
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
    ...Shadows.floating,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 12,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  topicBadge: {
    backgroundColor: Colors.chipBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  topicBadgeText: {
    fontSize: 11,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.chipText,
  },
  closeButton: {
    padding: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceMuted,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  questionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  answerBox: {
    backgroundColor: Colors.background,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 14,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: Typography.family.regular,
    color: Colors.text,
  },
  calloutContainer: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 14,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  calloutTitle: {
    fontSize: 14,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  calloutBody: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Typography.family.regular,
    color: Colors.text,
    marginBottom: 6,
  },
  calloutDisclaimer: {
    fontSize: 11,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  sourceCitation: {
    fontSize: 11,
    fontFamily: Typography.family.regular,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  feedbackSection: {
    backgroundColor: Colors.surfaceTint,
    borderRadius: Radii.lg,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackQuestion: {
    fontSize: 13,
    fontFamily: Typography.family.medium,
    color: Colors.text,
    marginBottom: 10,
  },
  feedbackButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    gap: 6,
  },
  feedbackButtonActive: {
    backgroundColor: Colors.chipBackground,
    borderColor: Colors.primary,
  },
  feedbackButtonText: {
    fontSize: 13,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
  feedbackButtonTextActive: {
    fontFamily: Typography.family.semiBold,
    color: Colors.primary,
  },
  feedbackThankYou: {
    fontSize: 11,
    fontFamily: Typography.family.medium,
    color: Colors.primary,
    marginTop: 8,
  },
  relatedSection: {
    marginTop: 8,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  relatedTitle: {
    fontSize: 15,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  relatedList: {
    gap: 8,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  relatedItemContent: {
    flex: 1,
    paddingRight: 8,
  },
  relatedItemTopic: {
    fontSize: 10.5,
    fontFamily: Typography.family.semiBold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  relatedItemQuestion: {
    fontSize: 13.5,
    fontFamily: Typography.family.medium,
    color: Colors.text,
  },
});
