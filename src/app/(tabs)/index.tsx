/**
 * Home Screen — Screen 2 of Sakhi
 *
 * Shows:
 *  - Greeting (with optional nickname)
 *  - Hero "NEXT PERIOD" card driven by the cycle prediction engine
 *  - "Explore Sakhi" section with two content cards
 *  - "Ask anything" banner card
 *  - Bottom tab bar (managed by the Tabs layout)
 *
 * Nickname: on first visit a friendly bottom sheet asks for an optional
 * nickname. This is tracked via the `home_nickname_prompted` settings key.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Pencil, Shield, Sparkles } from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Typography, Spacing, Radii, Shadows, Layout } from '@/constants/theme';
import { usePeriodLogs } from '@/db/hooks/usePeriodLogs';
import { useSettings } from '@/db/hooks/useSettings';
import { calculateCyclePrediction } from '@/lib/cycle';

// ─── Small inline components ──────────────────────────────────────────────────

interface TagPillProps {
  label: string;
  variant?: 'default' | 'hero';
}
const TagPill: React.FC<TagPillProps> = ({ label, variant = 'default' }) => (
  <View
    style={[
      styles.tagPill,
      variant === 'hero' ? styles.tagPillHero : styles.tagPillDefault,
    ]}
  >
    <Text
      style={[
        styles.tagPillText,
        variant === 'hero' ? styles.tagPillTextHero : styles.tagPillTextDefault,
      ]}
    >
      {label}
    </Text>
  </View>
);

// ─── Nickname bottom sheet ────────────────────────────────────────────────────

interface NicknameSheetProps {
  visible: boolean;
  onSave: (name: string) => void;
  onSkip: () => void;
}
const NicknameSheet: React.FC<NicknameSheetProps> = ({
  visible,
  onSave,
  onSkip,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  // Animated.Value stored in state so it's stable across renders without
  // triggering the react-hooks/refs lint rule (which disallows .current in render).
  const [slideAnim] = useState(() => new Animated.Value(400));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible, slideAnim]);

  const handleSave = () => {
    onSave(name.trim());
    setName('');
  };

  const handleSkip = () => {
    setName('');
    onSkip();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        style={styles.sheetOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleSkip} />
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.sheetHandle} />

          {/* Title row */}
          <View style={styles.sheetTitleRow}>
            <View style={styles.sheetIconBadge}>
              <Sparkles size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sheetTitle}>
              {t('home.nickname.sheetTitle')}
            </Text>
          </View>

          <Text style={styles.sheetSubtitle}>
            {t('home.nickname.sheetSubtitle')}
          </Text>

          {/* Input */}
          <TextInput
            style={styles.nicknameInput}
            placeholder={t('home.nickname.placeholder')}
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={30}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
            accessibilityLabel={t('home.nickname.placeholder')}
          />

          {/* Buttons */}
          <Pressable
            style={({ pressed }) => [
              styles.sheetSaveButton,
              pressed && { opacity: 0.85 },
            ]}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel={t('home.nickname.saveButton')}
          >
            <Text style={styles.sheetSaveButtonText}>
              {t('home.nickname.saveButton')}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.sheetSkipButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel={t('home.nickname.skipButton')}
          >
            <Text style={styles.sheetSkipText}>
              {t('home.nickname.skipButton')}
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { logs, loading: logsLoading } = usePeriodLogs();
  const { settings, loading: settingsLoading, updateSetting } = useSettings();

  const [showNicknameSheet, setShowNicknameSheet] = useState(false);

  // ── Nickname logic ────────────────────────────────────────────────────
  const nickname = settings['user_nickname'] ?? '';
  const nicknamePrompted = settings['home_nickname_prompted'] === 'true';

  useEffect(() => {
    if (!settingsLoading && !nicknamePrompted) {
      // Small delay to let the screen mount first
      const timer = setTimeout(() => setShowNicknameSheet(true), 800);
      return () => clearTimeout(timer);
    }
  }, [settingsLoading, nicknamePrompted]);

  const handleSaveNickname = useCallback(
    async (name: string) => {
      setShowNicknameSheet(false);
      if (name) await updateSetting('user_nickname', name);
      await updateSetting('home_nickname_prompted', 'true');
    },
    [updateSetting]
  );

  const handleSkipNickname = useCallback(async () => {
    setShowNicknameSheet(false);
    await updateSetting('home_nickname_prompted', 'true');
  }, [updateSetting]);

  // ── Greeting ─────────────────────────────────────────────────────────
  const greeting = nickname
    ? t('home.greeting', { name: nickname })
    : t('home.greetingNoName');

  // ── Cycle prediction ──────────────────────────────────────────────────
  const prediction = calculateCyclePrediction(logs);

  const getDaysPillText = () => {
    switch (prediction.pillLabel) {
      case 'today':
        return t('home.pillToday');
      case 'tomorrow':
        return t('home.pillTomorrow');
      case 'few_days_late':
        return t('home.pillFewDaysLate');
      case 'about_n_days':
        return t('home.pillAboutDays', { days: prediction.pillDays });
      default:
        return '';
    }
  };

  // ── Navigation helpers ─────────────────────────────────────────────────
  const goToTrack = () => router.push('/(tabs)/track');
  const goToLearn = () => router.push('/(tabs)/learn');
  const goToMyths = () => router.push('/learn/myths-vs-facts');
  const goToAsk = () => router.push('/(tabs)/ask');

  const isLoading = logsLoading || settingsLoading;

  if (isLoading) {
    return (
      <ScreenWrapper>
        <AppHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <>
      <ScreenWrapper scrollable>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <AppHeader />

        {/* ── Greeting ───────────────────────────────────────────────── */}
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText} accessibilityRole="header">
            {greeting}
          </Text>
        </View>
        <Text style={styles.subtitleText}>{t('home.subtitle')}</Text>

        {/* ── Hero Card — Next Period ────────────────────────────────── */}
        <View style={styles.heroCard} accessibilityRole="none">
          {/* Tag row */}
          <View style={styles.heroTopRow}>
            <TagPill label={t('home.nextPeriodTag')} variant="hero" />
            {prediction.confidence === 'estimate' && (
              <View style={styles.estimateBadge}>
                <Text style={styles.estimateBadgeText}>
                  {t('home.estimateBadge')}
                </Text>
              </View>
            )}
            {/* Edit button */}
            {prediction.hasLoggedPeriods && (
              <Pressable
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={goToTrack}
                accessibilityRole="button"
                accessibilityLabel={t('home.editButtonLabel')}
                hitSlop={12}
              >
                <Pencil size={14} color={Colors.primaryMuted} />
              </Pressable>
            )}
          </View>

          {prediction.hasLoggedPeriods ? (
            <>
              {/* Label */}
              <Text style={styles.heroLabel}>{t('home.nextPeriodLabel')}</Text>

              {/* Big date + pill */}
              <View style={styles.heroDateRow}>
                <Text
                  style={styles.heroDate}
                  accessibilityLabel={`Next period around ${prediction.formattedNextDate}`}
                >
                  {prediction.formattedNextDate}
                </Text>
                <View style={styles.daysPill}>
                  <Text style={styles.daysPillText}>{getDaysPillText()}</Text>
                </View>
              </View>

              {/* Range note */}
              <Text style={styles.heroNote}>{t('home.cycleShiftNotice')}</Text>
            </>
          ) : (
            /* Empty state */
            <>
              <Text style={styles.noDataTitle}>
                {t('home.noDataCardTitle')}
              </Text>
              <Text style={styles.noDataSubtitle}>
                {t('home.noDataCardSubtitle')}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.noDataButton,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={goToTrack}
                accessibilityRole="button"
                accessibilityLabel={t('home.noDataCardButton')}
              >
                <Text style={styles.noDataButtonText}>
                  {t('home.noDataCardButton')}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* ── Explore Sakhi ─────────────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('home.exploreSection')}</Text>
          <Pressable
            onPress={goToLearn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('home.seeAll')}
          >
            <Text style={styles.seeAllLink}>{t('home.seeAll')}</Text>
          </Pressable>
        </View>

        <View style={styles.exploreRow}>
          {/* Myth or Fact card */}
          <Pressable
            style={({ pressed }) => [
              styles.exploreCard,
              styles.exploreCardLeft,
              pressed && styles.exploreCardPressed,
            ]}
            onPress={goToMyths}
            accessibilityRole="button"
            accessibilityLabel={`${t('home.card1Title')}. ${t('home.card1Tag')}`}
          >
            <View style={styles.exploreCardIconRow}>
              <View style={[styles.exploreCardIcon, styles.exploreCardIconMyth]}>
                <Text style={styles.exploreCardEmoji}>🌀</Text>
              </View>
              <TagPill label={t('home.card1Tag')} />
            </View>
            <Text style={styles.exploreCardTitle}>{t('home.card1Title')}</Text>
            <Text style={styles.exploreCardSubtitle} numberOfLines={2}>
              {t('home.card1Subtitle')}
            </Text>
          </Pressable>

          {/* Period basics card */}
          <Pressable
            style={({ pressed }) => [
              styles.exploreCard,
              styles.exploreCardRight,
              pressed && styles.exploreCardPressed,
            ]}
            onPress={goToLearn}
            accessibilityRole="button"
            accessibilityLabel={`${t('home.card2Title')}. ${t('home.card2Tag')}`}
          >
            <View style={styles.exploreCardIconRow}>
              <View style={[styles.exploreCardIcon, styles.exploreCardIconBasics]}>
                <Text style={styles.exploreCardEmoji}>📖</Text>
              </View>
              <TagPill label={t('home.card2Tag')} />
            </View>
            <Text style={styles.exploreCardTitle}>{t('home.card2Title')}</Text>
            <Text style={styles.exploreCardSubtitle} numberOfLines={2}>
              {t('home.card2Subtitle')}
            </Text>
          </Pressable>
        </View>

        {/* ── Ask anything card ─────────────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [
            styles.askCard,
            pressed && styles.exploreCardPressed,
          ]}
          onPress={goToAsk}
          accessibilityRole="button"
          accessibilityLabel={t('home.askCardTitle')}
        >
          <View style={styles.askCardContent}>
            <View style={styles.askCardIconBadge}>
              <Shield size={20} color={Colors.primary} />
            </View>
            <View style={styles.askCardText}>
              <Text style={styles.askCardTitle}>{t('home.askCardTitle')}</Text>
              <Text style={styles.askCardSubtitle} numberOfLines={2}>
                {t('home.askCardSubtitle')}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.primaryMuted} />
          </View>
        </Pressable>
      </ScreenWrapper>

      {/* ── Nickname sheet (outside ScreenWrapper so it overlays tabs) */}
      <NicknameSheet
        visible={showNicknameSheet}
        onSave={handleSaveNickname}
        onSkip={handleSkipNickname}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Greeting
  greetingRow: {
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  greetingText: {
    fontSize: 22,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },

  // ── Hero card
  heroCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.primaryDark,
    marginBottom: Spacing.xs,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroDate: {
    fontSize: 42,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 48,
  },
  heroNote: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.primaryDark,
    lineHeight: 17,
    opacity: 0.8,
  },

  // ── Days pill (inside hero)
  daysPill: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  daysPillText: {
    fontSize: 12,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.textInverse,
  },

  // ── Hero estimate badge
  estimateBadge: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    opacity: 0.7,
  },
  estimateBadgeText: {
    fontSize: 10,
    fontFamily: Typography.family.medium,
    color: Colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // ── Edit button
  editButton: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // ── Hero empty state
  noDataTitle: {
    fontSize: 16,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 6,
    marginTop: Spacing.xs,
  },
  noDataSubtitle: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.primaryDark,
    opacity: 0.8,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  noDataButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  noDataButtonText: {
    fontSize: 13,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.textInverse,
  },

  // ── Tag pill
  tagPill: {
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagPillHero: {
    backgroundColor: Colors.primary,
  },
  tagPillDefault: {
    backgroundColor: Colors.chipBackground,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
  },
  tagPillText: {
    fontSize: 10,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tagPillTextHero: {
    color: Colors.textInverse,
  },
  tagPillTextDefault: {
    color: Colors.chipText,
  },

  // ── Section header row
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
  seeAllLink: {
    fontSize: 13,
    fontFamily: Typography.family.semiBold,
    color: Colors.textAccent,
  },

  // ── Explore cards row
  exploreRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  exploreCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 140,
    ...Shadows.soft,
  },
  exploreCardLeft: {
    // slight accent tint
    backgroundColor: Colors.surfaceTint,
  },
  exploreCardRight: {
    backgroundColor: Colors.surface,
  },
  exploreCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  exploreCardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  exploreCardIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreCardIconMyth: {
    backgroundColor: Colors.primaryLight,
  },
  exploreCardIconBasics: {
    backgroundColor: Colors.surfaceMuted,
  },
  exploreCardEmoji: {
    fontSize: 18,
  },
  exploreCardTitle: {
    fontSize: 14,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  exploreCardSubtitle: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // ── Ask card
  askCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    ...Shadows.soft,
  },
  askCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  askCardIconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askCardText: {
    flex: 1,
  },
  askCardTitle: {
    fontSize: 14,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  askCardSubtitle: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // ── Nickname sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    padding: Spacing.xl,
    paddingBottom: Math.max(Spacing.xl, 28),
    ...Shadows.floating,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radii.full,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sheetIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: Spacing.lg,
  },
  nicknameInput: {
    height: Layout.minTouchTarget + 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    fontFamily: Typography.family.regular,
    color: Colors.text,
    backgroundColor: Colors.background,
    marginBottom: Spacing.md,
  },
  sheetSaveButton: {
    height: Layout.minTouchTarget + 4,
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  sheetSaveButtonText: {
    fontSize: 15,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  sheetSkipButton: {
    height: Layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSkipText: {
    fontSize: 14,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
});
