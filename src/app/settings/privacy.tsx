/**
 * Privacy Information Screen — Screen 8 of Sakhi
 *
 * Route: app/settings/privacy
 *
 * Requirements:
 *  1. Privacy Information screen:
 *     - Sakhi requires no account (no emails, phone numbers, logins).
 *     - All personal information stays on the device.
 *     - No user data is transmitted externally (100% offline).
 *     - Deleting the app removes locally stored data, subject to device backup behaviour.
 *     - Reassuring, gentle tone consistent with Sakhi's design.
 *  2. Delete All My Data:
 *     - Prominent "Delete all my data" button.
 *     - Confirmation bottom sheet explaining that deletion is permanent and irreversible.
 *     - Cancel and Delete action options.
 *     - On confirmation: clears all period logs, predictions, PIN hashes/lockout,
 *       settings, feedback, suggestions and other local personal data.
 *     - Preserves application code, translations, and educational content.
 *     - Reinitializes baseline settings and resets auth to Create PIN screen.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import {
  ChevronLeft,
  ShieldCheck,
  UserCheck,
  Smartphone,
  WifiOff,
  AlertCircle,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/auth/AuthContext';
import { Colors, Typography, Radii, Shadows, Layout } from '@/constants/theme';
import { triggerKeyHaptic, triggerSuccessHaptic } from '@/utils/haptics';

export default function PrivacyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { deleteAllUserData } = useAuth();

  const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Animated slide-up for bottom sheet
  const [slideAnim] = useState(() => new Animated.Value(450));

  useEffect(() => {
    if (isDeleteSheetVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 3,
        speed: 14,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 450,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isDeleteSheetVisible, slideAnim]);

  const handleBack = () => {
    triggerKeyHaptic();
    router.back();
  };

  const handleOpenDeleteSheet = () => {
    triggerKeyHaptic();
    setIsDeleteSheetVisible(true);
  };

  const handleCloseDeleteSheet = () => {
    if (isDeleting) return;
    triggerKeyHaptic();
    setIsDeleteSheetVisible(false);
  };

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    triggerKeyHaptic();

    try {
      // 1. Wipe all user-generated SQLite tables and reset auth storage
      await deleteAllUserData(db);

      triggerSuccessHaptic();
      setIsDeleteSheetVisible(false);

      // 2. Safely route to Create PIN screen
      router.replace('/(auth)/lock' as any);
    } catch (err) {
      console.error('Failed to wipe user data:', err);
      setIsDeleting(false);
    }
  }, [deleteAllUserData, db, router]);

  return (
    <ScreenWrapper scrollable contentContainerStyle={styles.screenContent}>
      {/* Top Header */}
      <AppHeader />

      {/* Top Back Navigation Row */}
      <View style={styles.topNavRow}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('privacy.back', 'Settings')}
          hitSlop={12}
        >
          <ChevronLeft size={20} color={Colors.primary} strokeWidth={2.4} />
          <Text style={styles.backButtonText}>
            {t('privacy.back', 'Settings')}
          </Text>
        </Pressable>
      </View>

      {/* Screen Title & Subtitle */}
      <View style={styles.titleSection}>
        <Text style={styles.title} accessibilityRole="header">
          {t('privacy.title', 'Privacy information')}
        </Text>
        <Text style={styles.subtitle}>
          {t(
            'privacy.subtitle',
            'How your information is kept private, safe, and entirely yours.'
          )}
        </Text>
      </View>

      {/* Privacy Information Cards */}
      <View style={styles.cardsContainer}>
        {/* Card 1: No account required */}
        <View style={styles.infoCard}>
          <View style={styles.iconBadge}>
            <UserCheck size={22} color={Colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>
              {t('privacy.noAccountTitle', 'No account required')}
            </Text>
            <Text style={styles.cardDesc}>
              {t(
                'privacy.noAccountDesc',
                'Sakhi works completely without logins, passwords, emails, or phone numbers. Your identity is never requested.'
              )}
            </Text>
          </View>
        </View>

        {/* Card 2: Stored only on your phone */}
        <View style={styles.infoCard}>
          <View style={styles.iconBadge}>
            <Smartphone size={22} color={Colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>
              {t('privacy.onDeviceTitle', 'Stored only on your phone')}
            </Text>
            <Text style={styles.cardDesc}>
              {t(
                'privacy.onDeviceDesc',
                'All your cycle dates, personal notes, and reading history stay exclusively on this device inside a local database.'
              )}
            </Text>
          </View>
        </View>

        {/* Card 3: No tracking or external sharing */}
        <View style={styles.infoCard}>
          <View style={styles.iconBadge}>
            <WifiOff size={22} color={Colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>
              {t('privacy.noSharingTitle', 'No tracking or external sharing')}
            </Text>
            <Text style={styles.cardDesc}>
              {t(
                'privacy.noSharingDesc',
                'Nothing is ever sent to servers, trackers, or third parties. Sakhi operates 100% offline without network connections.'
              )}
            </Text>
          </View>
        </View>

        {/* Card 4: Deleting the app */}
        <View style={styles.infoCard}>
          <View style={styles.iconBadge}>
            <AlertCircle size={22} color={Colors.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>
              {t('privacy.appDeletionTitle', 'Deleting the app')}
            </Text>
            <Text style={styles.cardDesc}>
              {t(
                'privacy.appDeletionDesc',
                "Uninstalling the app removes all locally stored data from this phone, subject to your device's automatic cloud backup settings."
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* Gentle Reassurance Banner */}
      <View style={styles.reassuranceBanner}>
        <View style={styles.reassuranceIconBadge}>
          <ShieldCheck size={20} color={Colors.primary} strokeWidth={2.2} />
        </View>
        <View style={styles.reassuranceTextContainer}>
          <Text style={styles.reassuranceTitle}>
            {t('privacy.reassuranceTitle', 'Your space, truly private.')}
          </Text>
          <Text style={styles.reassuranceSubtitle}>
            {t(
              'privacy.reassuranceSubtitle',
              'You are always in complete control of your health information.'
            )}
          </Text>
        </View>
      </View>

      {/* Delete All My Data Section */}
      <View style={styles.deleteSection}>
        <Pressable
          onPress={handleOpenDeleteSheet}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('privacy.deleteDataButton', 'Delete all my data')}
        >
          <Trash2 size={18} color={Colors.danger} strokeWidth={2.2} style={styles.deleteIcon} />
          <Text style={styles.deleteButtonText}>
            {t('privacy.deleteDataButton', 'Delete all my data')}
          </Text>
        </Pressable>
        <Text style={styles.deleteSubtext}>
          {t(
            'privacy.deleteDataSubtext',
            'Permanently erase your PIN, period logs, and settings from this device.'
          )}
        </Text>
      </View>

      {/* Delete Confirmation Bottom Sheet */}
      <Modal
        visible={isDeleteSheetVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleCloseDeleteSheet}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleCloseDeleteSheet}
            accessibilityLabel={t('common.cancel', 'Cancel')}
          />
          <Animated.View
            style={[
              styles.sheetContainer,
              { transform: [{ translateY: slideAnim }] },
            ]}
            accessibilityRole="alertdialog"
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Close button in header */}
            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetIconBadge}>
                <AlertTriangle size={24} color={Colors.danger} strokeWidth={2.2} />
              </View>
              <Pressable
                onPress={handleCloseDeleteSheet}
                disabled={isDeleting}
                style={styles.sheetCloseButton}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel', 'Cancel')}
                hitSlop={8}
              >
                <X size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Sheet Title & Description */}
            <Text style={styles.sheetTitle}>
              {t('privacy.sheetTitle', 'Delete all your data?')}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {t(
                'privacy.sheetSubtitle',
                'This will permanently erase all your period logs, cycle predictions, PIN security, settings, and learning activity. This cannot be undone.'
              )}
            </Text>

            {/* Action Buttons */}
            <View style={styles.sheetActions}>
              <Pressable
                onPress={handleConfirmDelete}
                disabled={isDeleting}
                style={({ pressed }) => [
                  styles.confirmDeleteButton,
                  pressed && !isDeleting && styles.confirmDeleteButtonPressed,
                  isDeleting && styles.buttonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('privacy.confirmDeleteButton', 'Delete all data')}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={Colors.textInverse} />
                ) : (
                  <>
                    <Trash2
                      size={18}
                      color={Colors.textInverse}
                      strokeWidth={2.2}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.confirmDeleteButtonText}>
                      {t('privacy.confirmDeleteButton', 'Delete all data')}
                    </Text>
                  </>
                )}
              </Pressable>

              <PrimaryButton
                title={t('privacy.cancelButton', 'Cancel')}
                onPress={handleCloseDeleteSheet}
                variant="secondary"
                disabled={isDeleting}
                style={styles.cancelButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: Layout.tabBarHeight + 36,
  },
  topNavRow: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 2,
    minHeight: Layout.minTouchTarget,
  },
  backButtonText: {
    fontSize: 15,
    fontFamily: Typography.family.medium,
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radii.lg,
    padding: 16,
    ...Shadows.soft,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  reassuranceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceTint,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 28,
  },
  reassuranceIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reassuranceTextContainer: {
    flex: 1,
  },
  reassuranceTitle: {
    fontSize: 14,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  reassuranceSubtitle: {
    fontSize: 12.5,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  deleteSection: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 52,
    backgroundColor: '#FFF0F3',
    borderWidth: 1.5,
    borderColor: '#F7CCD7',
    borderRadius: Radii.full,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  deleteButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  deleteIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.danger,
  },
  deleteSubtext: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Layout.tabBarHeight + 20,
    ...Shadows.floating,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: Radii.full,
    backgroundColor: Colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetIconBadge: {
    width: 48,
    height: 48,
    borderRadius: Radii.full,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  sheetSubtitle: {
    fontSize: 13.5,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  sheetActions: {
    gap: 12,
  },
  confirmDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: Radii.full,
    backgroundColor: Colors.danger,
    paddingHorizontal: 24,
    paddingVertical: 12,
    ...Shadows.soft,
  },
  confirmDeleteButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  confirmDeleteButtonText: {
    fontSize: 15,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  cancelButton: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
