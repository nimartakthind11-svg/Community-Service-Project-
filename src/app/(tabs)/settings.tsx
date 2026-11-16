/**
 * Settings Screen — Screen 8 of Sakhi
 *
 * "Make Sakhi feel right for you."
 *
 * Features (Commit 1: Settings UI):
 *  - Screen Title: "Settings"
 *  - Subtitle: "Make Sakhi feel right for you."
 *  - Three card rows with icons and chevrons:
 *    1. Change PIN — "Choose a new PIN to open Sakhi."
 *    2. Language — "Pick the language you prefer." with "English" badge.
 *    3. Privacy information — "Read Sakhi's privacy information."
 *  - Subtle About Sakhi section at the bottom with app version and medical disclaimer.
 *  - Responsive layout reusing design tokens and theme constants.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Lock, Languages, Shield, ChevronRight } from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { Colors, Typography, Radii, Shadows, Layout } from '@/constants/theme';
import { triggerKeyHaptic } from '@/utils/haptics';

export default function SettingsScreen() {
  const { t } = useTranslation();

  const handleRowPress = () => {
    triggerKeyHaptic();
    // Functionality deferred to subsequent commits
  };

  return (
    <ScreenWrapper scrollable>
      {/* Top Brand Header */}
      <AppHeader />

      {/* Screen Title & Subtitle */}
      <View style={styles.titleSection}>
        <Text style={styles.title} accessibilityRole="header">
          {t('settings.title', 'Settings')}
        </Text>
        <Text style={styles.subtitle}>
          {t('settings.subtitle', 'Make Sakhi feel right for you.')}
        </Text>
      </View>

      {/* Settings Card Rows */}
      <View style={styles.rowsContainer}>
        {/* Row 1: Change PIN */}
        <Pressable
          onPress={handleRowPress}
          style={({ pressed }) => [
            styles.cardRow,
            pressed && styles.cardRowPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${t('settings.changePinTitle', 'Change PIN')}. ${t(
            'settings.changePinSubtitle',
            'Choose a new PIN to open Sakhi.'
          )}`}
        >
          <View style={styles.iconBadge}>
            <Lock size={20} color={Colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.rowTitle}>
              {t('settings.changePinTitle', 'Change PIN')}
            </Text>
            <Text style={styles.rowSubtitle}>
              {t(
                'settings.changePinSubtitle',
                'Choose a new PIN to open Sakhi.'
              )}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </Pressable>

        {/* Row 2: Language */}
        <Pressable
          onPress={handleRowPress}
          style={({ pressed }) => [
            styles.cardRow,
            pressed && styles.cardRowPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${t('settings.languageTitle', 'Language')}. ${t(
            'settings.languageSubtitle',
            'Pick the language you prefer.'
          )}. ${t('settings.languageValue', 'English')}`}
        >
          <View style={styles.iconBadge}>
            <Languages size={20} color={Colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.rowTitle}>
              {t('settings.languageTitle', 'Language')}
            </Text>
            <Text style={styles.rowSubtitle}>
              {t('settings.languageSubtitle', 'Pick the language you prefer.')}
            </Text>
          </View>
          <View style={styles.rightActionContainer}>
            <Text style={styles.languageBadgeText}>
              {t('settings.languageValue', 'English')}
            </Text>
            <ChevronRight size={18} color={Colors.textMuted} />
          </View>
        </Pressable>

        {/* Row 3: Privacy Information */}
        <Pressable
          onPress={handleRowPress}
          style={({ pressed }) => [
            styles.cardRow,
            pressed && styles.cardRowPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${t(
            'settings.privacyTitle',
            'Privacy information'
          )}. ${t(
            'settings.privacySubtitle',
            "Read Sakhi's privacy information."
          )}`}
        >
          <View style={styles.iconBadge}>
            <Shield size={20} color={Colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.rowTitle}>
              {t('settings.privacyTitle', 'Privacy information')}
            </Text>
            <Text style={styles.rowSubtitle}>
              {t(
                'settings.privacySubtitle',
                "Read Sakhi's privacy information."
              )}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </Pressable>
      </View>

      {/* Subtle About Sakhi Section */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutVersion}>
          {t('settings.aboutVersion', 'Sakhi v1.0.0')}
        </Text>
        <Text style={styles.aboutDisclaimer}>
          {t(
            'settings.aboutDisclaimer',
            'An awareness and education tool, not medical advice.'
          )}
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
  rowsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: Layout.minTouchTarget,
    ...Shadows.soft,
  },
  cardRowPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    backgroundColor: Colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
  },
  rowSubtitle: {
    fontSize: 12.5,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  languageBadgeText: {
    fontSize: 13,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
  aboutSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  aboutVersion: {
    fontSize: 12.5,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
  },
  aboutDisclaimer: {
    fontSize: 11.5,
    fontFamily: Typography.family.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
