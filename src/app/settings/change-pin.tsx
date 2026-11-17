/**
 * Change PIN Screen — Screen 8 Flow of Sakhi
 *
 * Route: app/settings/change-pin
 *
 * Requirements:
 *  1. Three-step Change PIN flow:
 *     - Step 1: Enter current PIN (verified against stored hash)
 *     - Step 2: Enter new PIN (4-digit format validated)
 *     - Step 3: Confirm new PIN (ensures confirmation matches)
 *  2. Reuses existing keypad UI and PIN validation logic.
 *  3. Verifies current PIN against stored hash in SecureStore/WebStorage.
 *  4. Validates new PIN and ensures confirmation matches.
 *  5. Updates stored PIN hash only after successful verification.
 *  6. Applies existing incorrect-PIN lockout rules (5 attempts, 30s cooldown).
 *  7. Shows appropriate error messages and a success confirmation view.
 *  8. Ensures new PIN works after closing/reopening the app.
 *  9. Navigation back to Settings.
 * 10. Does not store PINs in plain text.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Shield, CheckCircle } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { PinKeypad } from '@/components/PinKeypad';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/auth/AuthContext';
import {
  verifyPin,
  savePin,
  getLockoutStatus,
  recordFailedAttempt,
  resetFailedAttempts,
  LockoutStatus,
  isValidPinFormat,
} from '@/auth/pinStorage';
import {
  triggerKeyHaptic,
  triggerErrorHaptic,
  triggerSuccessHaptic,
} from '@/utils/haptics';
import { Colors, Typography, Radii, Layout, Shadows } from '@/constants/theme';

export type ChangePinStep = 'current' | 'new' | 'confirm' | 'success';

export default function ChangePinScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { changePin } = useAuth();

  const [step, setStep] = useState<ChangePinStep>('current');
  const [pin, setPin] = useState<string>('');
  const [tempNewPin, setTempNewPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Lockout state
  const [lockout, setLockout] = useState<LockoutStatus>({
    isLocked: false,
    remainingSeconds: 0,
    failedCount: 0,
  });

  // Reanimated shake animation
  const shakeOffset = useSharedValue(0);
  const animatedDotsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const triggerShake = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability
    shakeOffset.value = withSequence(
      withTiming(-14, { duration: 55 }),
      withTiming(14, { duration: 55 }),
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-5, { duration: 45 }),
      withTiming(5, { duration: 45 }),
      withTiming(0, { duration: 45 })
    );
  }, [shakeOffset]);

  // Check lockout on mount
  useEffect(() => {
    let isMounted = true;
    getLockoutStatus()
      .then((status) => {
        if (isMounted) {
          setLockout(status);
        }
      })
      .catch((err) => {
        console.error('Error checking lockout status:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Countdown timer when locked out
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (lockout.isLocked && lockout.remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setLockout((prev) => {
          if (prev.remainingSeconds <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            resetFailedAttempts();
            setErrorMsg('');
            return { isLocked: false, remainingSeconds: 0, failedCount: 0 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockout.isLocked, lockout.remainingSeconds]);

  // Process PIN when 4 digits are completed
  const processPin = useCallback(
    async (completedPin: string) => {
      setIsProcessing(true);

      if (step === 'current') {
        // Step 1: Verify current PIN
        const isValid = await verifyPin(completedPin);

        if (isValid) {
          triggerKeyHaptic();
          await resetFailedAttempts();
          setStep('new');
          setPin('');
          setErrorMsg('');
          setIsProcessing(false);
        } else {
          triggerErrorHaptic();
          triggerShake();
          const newLockout = await recordFailedAttempt();
          setLockout(newLockout);

          if (newLockout.isLocked) {
            setErrorMsg(
              t('lock.lockedOutCountdown', {
                seconds: newLockout.remainingSeconds,
                defaultValue: `Too many attempts. Try again in ${newLockout.remainingSeconds}s`,
              })
            );
          } else {
            setErrorMsg(
              t(
                'changePin.wrongCurrentPin',
                "That's not your current PIN. Try again."
              )
            );
          }

          setPin('');
          setIsProcessing(false);
        }
      } else if (step === 'new') {
        // Step 2: Validate new PIN format
        if (!isValidPinFormat(completedPin)) {
          triggerErrorHaptic();
          triggerShake();
          setErrorMsg(t('changePin.pinMismatch', "PIN must be 4 digits. Let's try again."));
          setPin('');
          setIsProcessing(false);
          return;
        }

        triggerKeyHaptic();
        setTempNewPin(completedPin);
        setStep('confirm');
        setPin('');
        setErrorMsg('');
        setIsProcessing(false);
      } else if (step === 'confirm') {
        // Step 3: Confirm new PIN matches
        if (completedPin === tempNewPin) {
          try {
            // Update stored PIN hash securely
            if (changePin) {
              await changePin(completedPin);
            } else {
              await savePin(completedPin);
            }
            await resetFailedAttempts();
            triggerSuccessHaptic();
            setPin('');
            setTempNewPin('');
            setErrorMsg('');
            setStep('success');
          } catch (err) {
            console.error('Failed to save new PIN:', err);
            triggerErrorHaptic();
            setErrorMsg(t('common.error', 'Something went wrong. Please try again.'));
            setPin('');
            setStep('new');
          } finally {
            setIsProcessing(false);
          }
        } else {
          triggerErrorHaptic();
          triggerShake();
          setErrorMsg(
            t('changePin.pinMismatch', "New PINs didn't match. Let's try again.")
          );
          setPin('');
          setTempNewPin('');
          setStep('new');
          setIsProcessing(false);
        }
      }
    },
    [step, tempNewPin, changePin, t, triggerShake]
  );

  const handleKeyPress = (digit: string) => {
    if (lockout.isLocked || isProcessing) return;
    if (pin.length < 4) {
      triggerKeyHaptic();
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      AccessibilityInfo.announceForAccessibility(
        t('lock.accessibility.dotsStatus', {
          count: nextPin.length,
          defaultValue: `${nextPin.length} of 4 digits entered`,
        })
      );

      if (nextPin.length === 4) {
        processPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (lockout.isLocked || isProcessing) return;
    if (pin.length > 0) {
      triggerKeyHaptic();
      const nextPin = pin.slice(0, -1);
      setPin(nextPin);
      setErrorMsg('');
      AccessibilityInfo.announceForAccessibility(
        t('lock.accessibility.dotsStatus', {
          count: nextPin.length,
          defaultValue: `${nextPin.length} of 4 digits entered`,
        })
      );
    }
  };

  const handleBackPress = () => {
    triggerKeyHaptic();
    if (step === 'current' || step === 'success') {
      router.back();
    } else if (step === 'new') {
      setStep('current');
      setPin('');
      setErrorMsg('');
    } else if (step === 'confirm') {
      setStep('new');
      setPin('');
      setErrorMsg('');
    }
  };

  const handleBackToSettings = () => {
    triggerSuccessHaptic();
    router.replace('/(tabs)/settings' as any);
  };

  // Helper titles and subtitles
  const getStepNumber = (): number => {
    switch (step) {
      case 'current':
        return 1;
      case 'new':
        return 2;
      case 'confirm':
        return 3;
      default:
        return 3;
    }
  };

  const getTitle = (): string => {
    switch (step) {
      case 'current':
        return t('changePin.stepCurrentTitle', 'Enter current PIN');
      case 'new':
        return t('changePin.stepNewTitle', 'Enter new PIN');
      case 'confirm':
        return t('changePin.stepConfirmTitle', 'Confirm new PIN');
      case 'success':
        return t('changePin.successTitle', 'PIN updated');
      default:
        return t('changePin.title', 'Change PIN');
    }
  };

  const getSubtitle = (): string => {
    switch (step) {
      case 'current':
        return t(
          'changePin.stepCurrentSubtitle',
          "Enter your current 4-digit PIN to verify it's you."
        );
      case 'new':
        return t('changePin.stepNewSubtitle', 'Choose a new 4-digit PIN.');
      case 'confirm':
        return t(
          'changePin.stepConfirmSubtitle',
          'Re-enter your new 4-digit PIN to make sure.'
        );
      case 'success':
        return t(
          'changePin.successSubtitle',
          'Your new 4-digit PIN is active. Use it next time you open Sakhi.'
        );
      default:
        return '';
    }
  };

  const displayedError = lockout.isLocked
    ? t('lock.lockedOutCountdown', {
        seconds: lockout.remainingSeconds,
        defaultValue: `Too many attempts. Try again in ${lockout.remainingSeconds}s`,
      })
    : errorMsg;

  // Render Success Confirmation View
  if (step === 'success') {
    return (
      <ScreenWrapper contentContainerStyle={styles.screenContent}>
        <AppHeader />

        <View style={styles.successContainer}>
          <View style={styles.successIconBadge}>
            <CheckCircle size={44} color={Colors.primary} strokeWidth={2.4} />
          </View>
          <Text style={styles.successTitle}>{getTitle()}</Text>
          <Text style={styles.successSubtitle}>{getSubtitle()}</Text>

          <View style={styles.successActionContainer}>
            <PrimaryButton
              title={t('changePin.backToSettings', 'Back to Settings')}
              onPress={handleBackToSettings}
              variant="primary"
            />
          </View>
        </View>

        <View style={styles.footerContainer}>
          <Shield
            size={14}
            color={Colors.textMuted}
            strokeWidth={2}
            style={styles.shieldIcon}
          />
          <Text style={styles.footerText}>
            {t(
              'lock.footerNotice',
              'Your PIN helps keep your space private.'
            )}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Render 3-step PIN entry view
  return (
    <ScreenWrapper contentContainerStyle={styles.screenContent}>
      {/* Top Navigation Row */}
      <View style={styles.topNavRow}>
        <Pressable
          onPress={handleBackPress}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('changePin.back', 'Settings')}
          hitSlop={12}
        >
          <ChevronLeft size={20} color={Colors.primary} strokeWidth={2.4} />
          <Text style={styles.backButtonText}>
            {t('changePin.back', 'Settings')}
          </Text>
        </Pressable>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>
            {t('changePin.stepIndicator', {
              step: getStepNumber(),
              defaultValue: `Step ${getStepNumber()} of 3`,
            })}
          </Text>
        </View>
      </View>

      {/* Center Section: Title, Subtitle, Indicator Dots, Error */}
      <View style={styles.centerSection}>
        <Text style={styles.title} accessibilityRole="header">
          {getTitle()}
        </Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        {/* 4 Outlined / Filled Dots with Shake Animation */}
        <Animated.View
          style={[styles.dotsContainer, animatedDotsStyle]}
          accessibilityRole="text"
          accessibilityLabel={t('lock.accessibility.dotsStatus', {
            count: pin.length,
            defaultValue: `${pin.length} of 4 digits entered`,
          })}
          accessibilityLiveRegion="polite"
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isFilled ? styles.dotFilled : styles.dotEmpty,
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Status / Error Message */}
        <View style={styles.errorSlot}>
          {displayedError ? (
            <Text
              style={[
                styles.errorText,
                lockout.isLocked && styles.lockoutText,
              ]}
              accessibilityRole="alert"
            >
              {displayedError}
            </Text>
          ) : null}
        </View>
      </View>

      {/* 3x4 Numeric Keypad */}
      <PinKeypad
        onDigitPress={handleKeyPress}
        onDeletePress={handleDelete}
        disabled={lockout.isLocked || isProcessing}
        deleteDisabled={pin.length === 0}
      />

      {/* Footer Security Notice */}
      <View style={styles.footerContainer}>
        <Shield
          size={14}
          color={Colors.textMuted}
          strokeWidth={2}
          style={styles.shieldIcon}
        />
        <Text style={styles.footerText}>
          {t('lock.footerNotice', 'Your PIN helps keep your space private.')}
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 4,
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
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceTint,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  stepBadgeText: {
    fontSize: 12,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.primary,
  },
  centerSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
  },
  dotEmpty: {
    borderWidth: 1.5,
    borderColor: '#E2B6C3',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  errorSlot: {
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    fontFamily: Typography.family.medium,
    textAlign: 'center',
  },
  lockoutText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  shieldIcon: {
    marginTop: -1,
  },
  footerText: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textMuted,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 40,
    marginBottom: 30,
  },
  successIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 290,
    marginBottom: 32,
  },
  successActionContainer: {
    width: '100%',
    maxWidth: 280,
  },
});
