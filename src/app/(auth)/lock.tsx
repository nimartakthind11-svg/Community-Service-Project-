import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Shield, Delete, AlertTriangle } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSQLiteContext } from 'expo-sqlite';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/auth/AuthContext';
import {
  getLockoutStatus,
  recordFailedAttempt,
  resetFailedAttempts,
  LockoutStatus,
} from '@/auth/pinStorage';
import { triggerKeyHaptic, triggerErrorHaptic, triggerSuccessHaptic } from '@/utils/haptics';
import { Colors, Typography, Radii, Layout, Shadows } from '@/constants/theme';

export default function LockScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { isAuthenticated, isPinSet, unlockWithPin, setupNewPin, resetUserPin } = useAuth();

  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [tempFirstPin, setTempFirstPin] = useState<string>('');
  const [isResetModalVisible, setIsResetModalVisible] = useState<boolean>(false);
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

  // Navigate when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, router]);

  // Check lockout on mount and when app focuses
  const checkLockout = useCallback(async () => {
    const status = await getLockoutStatus();
    setLockout(status);
  }, []);

  useEffect(() => {
    checkLockout();
  }, [checkLockout]);

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

  const processPin = useCallback(
    async (completedPin: string) => {
      setIsProcessing(true);

      if (!isPinSet) {
        // First-time setup flow
        if (setupStep === 'create') {
          triggerKeyHaptic();
          setTempFirstPin(completedPin);
          setSetupStep('confirm');
          setPin('');
          setErrorMsg('');
          setIsProcessing(false);
        } else if (setupStep === 'confirm') {
          if (completedPin === tempFirstPin) {
            triggerSuccessHaptic();
            await setupNewPin(completedPin);
            router.replace('/(tabs)' as any);
          } else {
            triggerErrorHaptic();
            triggerShake();
            setErrorMsg(t('lock.pinMismatch'));
            setPin('');
            setSetupStep('create');
            setTempFirstPin('');
            setIsProcessing(false);
          }
        }
      } else {
        // Existing PIN unlock flow
        const isValid = await unlockWithPin(completedPin);
        if (isValid) {
          triggerSuccessHaptic();
          await resetFailedAttempts();
          router.replace('/(tabs)' as any);
        } else {
          triggerErrorHaptic();
          triggerShake();
          const newLockout = await recordFailedAttempt();
          setLockout(newLockout);

          if (newLockout.isLocked) {
            setErrorMsg(
              t('lock.lockedOutCountdown', { seconds: newLockout.remainingSeconds })
            );
          } else {
            setErrorMsg(t('lock.wrongPin'));
          }

          setPin('');
          setIsProcessing(false);
        }
      }
    },
    [
      isPinSet,
      setupStep,
      tempFirstPin,
      unlockWithPin,
      setupNewPin,
      router,
      t,
      triggerShake,
    ]
  );

  const handleKeyPress = (digit: string) => {
    if (lockout.isLocked || isProcessing) return;
    if (pin.length < 4) {
      triggerKeyHaptic();
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');

      AccessibilityInfo.announceForAccessibility(
        t('lock.accessibility.dotsStatus', { count: nextPin.length })
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
        t('lock.accessibility.dotsStatus', { count: nextPin.length })
      );
    }
  };

  const handleConfirmReset = async () => {
    setIsResetModalVisible(false);
    await resetUserPin(db);
    setPin('');
    setErrorMsg('');
    setSetupStep('create');
    setTempFirstPin('');
    setLockout({ isLocked: false, remainingSeconds: 0, failedCount: 0 });
    triggerSuccessHaptic();
  };

  const getTitle = () => {
    if (!isPinSet) {
      return setupStep === 'confirm' ? t('lock.confirmTitle') : t('lock.createTitle');
    }
    return t('lock.title');
  };

  const getSubtitle = () => {
    if (!isPinSet) {
      return setupStep === 'confirm' ? t('lock.confirmSubtitle') : t('lock.createSubtitle');
    }
    return t('lock.subtitle');
  };

  const displayedError = lockout.isLocked
    ? t('lock.lockedOutCountdown', { seconds: lockout.remainingSeconds })
    : errorMsg;

  return (
    <ScreenWrapper contentContainerStyle={styles.screenContent}>
      <AppHeader />

      <View style={styles.centerSection}>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        {/* 4 Outlined / Filled Dots with Shake Animation */}
        <Animated.View
          style={[styles.dotsContainer, animatedDotsStyle]}
          accessibilityRole="text"
          accessibilityLabel={t('lock.accessibility.dotsStatus', { count: pin.length })}
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

        {/* Forgot PIN link (only visible if PIN is already set) */}
        {isPinSet && (
          <Pressable
            onPress={() => setIsResetModalVisible(true)}
            style={styles.forgotButton}
            accessibilityRole="button"
            accessibilityLabel={t('lock.forgotPin')}
            hitSlop={8}
          >
            <Text style={styles.forgotText}>{t('lock.forgotPin')}</Text>
          </Pressable>
        )}
      </View>

      {/* 3x4 Numeric Keypad */}
      <View
        style={[
          styles.keypadContainer,
          lockout.isLocked && styles.keypadDisabled,
        ]}
      >
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((digit) => (
            <KeypadKey
              key={digit}
              digit={digit}
              disabled={lockout.isLocked || isProcessing}
              onPress={() => handleKeyPress(digit)}
              accessibilityLabel={t('lock.accessibility.digit', { digit })}
            />
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((digit) => (
            <KeypadKey
              key={digit}
              digit={digit}
              disabled={lockout.isLocked || isProcessing}
              onPress={() => handleKeyPress(digit)}
              accessibilityLabel={t('lock.accessibility.digit', { digit })}
            />
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((digit) => (
            <KeypadKey
              key={digit}
              digit={digit}
              disabled={lockout.isLocked || isProcessing}
              onPress={() => handleKeyPress(digit)}
              accessibilityLabel={t('lock.accessibility.digit', { digit })}
            />
          ))}
        </View>
        <View style={styles.keypadRow}>
          <View style={styles.emptySlot} />
          <KeypadKey
            digit="0"
            disabled={lockout.isLocked || isProcessing}
            onPress={() => handleKeyPress('0')}
            accessibilityLabel={t('lock.accessibility.digit', { digit: '0' })}
          />
          <Pressable
            onPress={handleDelete}
            disabled={lockout.isLocked || isProcessing || pin.length === 0}
            style={({ pressed }) => [
              styles.keypadKey,
              {
                opacity: pin.length === 0 ? 0.35 : pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('lock.accessibility.delete')}
          >
            <Delete size={22} color={Colors.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* Footer Security Notice */}
      <View style={styles.footerContainer}>
        <Shield size={14} color={Colors.textMuted} strokeWidth={2} style={styles.shieldIcon} />
        <Text style={styles.footerText}>{t('lock.footerNotice')}</Text>
      </View>

      {/* "Forgot your PIN?" Confirmation Sheet */}
      <Modal
        visible={isResetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet} accessibilityRole="alertdialog">
            <View style={styles.modalIconBadge}>
              <AlertTriangle size={24} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.modalTitle}>{t('lock.resetSheetTitle')}</Text>
            <Text style={styles.modalDescription}>
              {t('lock.resetSheetDescription')}
            </Text>

            <View style={styles.modalActions}>
              <PrimaryButton
                title={t('lock.resetSheetConfirm')}
                onPress={handleConfirmReset}
                variant="primary"
                style={styles.modalConfirmButton}
              />
              <PrimaryButton
                title={t('lock.resetSheetCancel')}
                onPress={() => setIsResetModalVisible(false)}
                variant="secondary"
                style={styles.modalCancelButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

interface KeypadKeyProps {
  digit: string;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

function KeypadKey({ digit, disabled, onPress, accessibilityLabel }: KeypadKeyProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.keypadKey,
        {
          backgroundColor: pressed ? Colors.chipBackground : Colors.surface,
          transform: [{ scale: pressed && !disabled ? 0.95 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.keypadDigit}>{digit}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  centerSection: {
    alignItems: 'center',
    paddingTop: 16,
  },
  title: {
    fontSize: 25,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 270,
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    marginTop: 28,
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
  forgotButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.primary,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 296,
    alignSelf: 'center',
    gap: 12,
    marginBottom: 16,
  },
  keypadDisabled: {
    opacity: 0.45,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadKey: {
    width: 84,
    height: 56,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.minTouchTarget,
    minWidth: Layout.minTouchTarget,
    ...Shadows.soft,
  },
  emptySlot: {
    width: 84,
    height: 56,
  },
  keypadDigit: {
    fontSize: 24,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.text,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    ...Shadows.floating,
  },
  modalIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  modalConfirmButton: {
    minHeight: 48,
  },
  modalCancelButton: {
    minHeight: 48,
  },
});
