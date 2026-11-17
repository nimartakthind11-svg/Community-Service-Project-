/**
 * Language Selection Screen — Screen 8 of Sakhi
 *
 * Route: app/settings/language
 *
 * Features:
 *  - Selection between English and Hindi
 *  - Visual indicator of currently active language
 *  - Instant language switching via i18next without app restart
 *  - Persistent language preference saved in local SQLite settings table
 *  - Consistent design tokens, typography, and theme styling
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { ChevronLeft, CheckCircle2, Languages, Globe } from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Typography, Radii, Shadows, Layout } from '@/constants/theme';
import { setSetting } from '@/db/repositories/settingsRepository';
import { triggerKeyHaptic } from '@/utils/haptics';

interface LanguageOption {
  code: 'en' | 'hi';
  label: string;
  subLabel: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    subLabel: 'English',
  },
  {
    code: 'hi',
    label: 'हिन्दी',
    subLabel: 'Hindi',
  },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const db = useSQLiteContext();

  const currentLanguage = i18n.language === 'hi' ? 'hi' : 'en';

  const handleSelectLanguage = useCallback(
    async (code: 'en' | 'hi') => {
      triggerKeyHaptic();
      if (i18n.language !== code) {
        // Change language instantly
        await i18n.changeLanguage(code);

        // Persist to local settings in SQLite
        try {
          await setSetting(db, 'language', code);
        } catch (err) {
          console.error('Failed to save language setting:', err);
        }
      }
    },
    [i18n, db]
  );

  return (
    <ScreenWrapper contentContainerStyle={styles.screenContent}>
      {/* Top Header */}
      <AppHeader />

      {/* Top Back Navigation Row */}
      <View style={styles.topNavRow}>
        <Pressable
          onPress={() => {
            triggerKeyHaptic();
            router.back();
          }}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('language.back', 'Settings')}
          hitSlop={12}
        >
          <ChevronLeft size={20} color={Colors.primary} strokeWidth={2.4} />
          <Text style={styles.backButtonText}>
            {t('language.back', 'Settings')}
          </Text>
        </Pressable>
      </View>

      {/* Title & Subtitle Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title} accessibilityRole="header">
          {t('language.title', 'Language')}
        </Text>
        <Text style={styles.subtitle}>
          {t('language.subtitle', 'Pick the language you prefer.')}
        </Text>
      </View>

      {/* Language Options List */}
      <View style={styles.optionsContainer} accessibilityRole="radiogroup">
        {LANGUAGES.map((lang) => {
          const isSelected = currentLanguage === lang.code;

          return (
            <Pressable
              key={lang.code}
              onPress={() => handleSelectLanguage(lang.code)}
              style={({ pressed }) => [
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                pressed && styles.optionCardPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${lang.label}. ${lang.subLabel}. ${
                isSelected ? t('language.activeBadge', 'Active') : ''
              }`}
            >
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.iconBadge,
                    isSelected && styles.iconBadgeSelected,
                  ]}
                >
                  {lang.code === 'hi' ? (
                    <Languages
                      size={22}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                      strokeWidth={2.2}
                    />
                  ) : (
                    <Globe
                      size={22}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                      strokeWidth={2.2}
                    />
                  )}
                </View>

                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.languageLabel,
                      isSelected && styles.languageLabelSelected,
                    ]}
                  >
                    {lang.code === 'hi'
                      ? t('language.hindiLabel', 'हिन्दी')
                      : t('language.englishLabel', 'English')}
                  </Text>
                  <Text style={styles.languageSubLabel}>
                    {lang.code === 'hi'
                      ? t('language.hindiSub', 'Hindi')
                      : t('language.englishSub', 'English')}
                  </Text>
                </View>
              </View>

              {/* Selection Checkmark / Radio Indicator */}
              <View style={styles.cardRight}>
                {isSelected ? (
                  <CheckCircle2
                    size={22}
                    color={Colors.primary}
                    strokeWidth={2.4}
                  />
                ) : (
                  <View style={styles.radioUnchecked} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingBottom: 24,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: Layout.minTouchTarget,
    gap: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontFamily: Typography.family.medium,
    fontWeight: '500',
    color: Colors.primary,
  },
  titleSection: {
    paddingVertical: 4,
    marginBottom: 20,
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
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: Radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: Layout.minTouchTarget,
    ...Shadows.soft,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  optionCardPressed: {
    opacity: 0.88,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeSelected: {
    backgroundColor: Colors.surfaceTint,
  },
  textContainer: {
    flex: 1,
  },
  languageLabel: {
    fontSize: 17,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  languageLabelSelected: {
    color: Colors.primary,
  },
  languageSubLabel: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },
  cardRight: {
    paddingLeft: 8,
  },
  radioUnchecked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
});
