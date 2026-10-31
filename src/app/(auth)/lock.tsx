import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Shield, Delete } from 'lucide-react-native';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/auth/AuthContext';
import { Colors, Typography, Radii, Layout } from '@/constants/theme';

export default function LockScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isPinSet, unlockWithPin, setupNewPin, resetUserPin } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'initial' | 'confirm'>('initial');
  const [tempFirstPin, setTempFirstPin] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, router]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        processPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const processPin = async (completedPin: string) => {
    if (!isPinSet) {
      // First-time setup flow
      if (setupStep === 'initial') {
        setTempFirstPin(completedPin);
        setSetupStep('confirm');
        setPin('');
      } else if (setupStep === 'confirm') {
        if (completedPin === tempFirstPin) {
          await setupNewPin(completedPin);
          router.replace('/(tabs)' as any);
        } else {
          setErrorMsg(t('lock.pinMismatch'));
          setPin('');
          setSetupStep('initial');
          setTempFirstPin('');
        }
      }
    } else {
      // Existing PIN unlock flow
      const success = await unlockWithPin(completedPin);
      if (success) {
        router.replace('/(tabs)' as any);
      } else {
        setErrorMsg(t('lock.incorrectPin'));
        setPin('');
      }
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      t('lock.forgotPin'),
      t('lock.resetPrompt'),
      [
        { text: t('lock.cancel'), style: 'cancel' },
        {
          text: t('lock.resetConfirm'),
          style: 'destructive',
          onPress: async () => {
            await resetUserPin();
            setPin('');
            setErrorMsg('');
            setSetupStep('initial');
          },
        },
      ]
    );
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

  return (
    <ScreenWrapper>
      <AppHeader />

      <View style={styles.centerSection}>
        <Text style={styles.title}>{getTitle()}</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>

        {/* PIN Indicators */}
        <View style={styles.dotsRow} accessibilityLabel={`PIN length ${pin.length} of 4`}>
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
        </View>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        {isPinSet && (
          <Pressable
            onPress={handleForgotPin}
            style={styles.forgotButton}
            accessibilityRole="button"
          >
            <Text style={styles.forgotText}>{t('lock.forgotPin')}</Text>
          </Pressable>
        )}
      </View>

      {/* Keypad */}
      <View style={styles.keypadContainer}>
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((n) => (
            <KeypadButton key={n} label={n} onPress={() => handleKeyPress(n)} />
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((n) => (
            <KeypadButton key={n} label={n} onPress={() => handleKeyPress(n)} />
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((n) => (
            <KeypadButton key={n} label={n} onPress={() => handleKeyPress(n)} />
          ))}
        </View>
        <View style={styles.keypadRow}>
          <View style={styles.emptyKey} />
          <KeypadButton label="0" onPress={() => handleKeyPress('0')} />
          <Pressable
            onPress={handleDelete}
            style={styles.keypadButton}
            accessibilityRole="button"
            accessibilityLabel="Delete"
          >
            <Delete size={22} color={Colors.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* Footer Security Note */}
      <View style={styles.footerNotice}>
        <Shield size={14} color={Colors.textMuted} strokeWidth={2} style={styles.shieldIcon} />
        <Text style={styles.footerText}>{t('lock.footerNotice')}</Text>
      </View>
    </ScreenWrapper>
  );
}

function KeypadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.keypadButton,
        {
          backgroundColor: pressed ? Colors.chipBackground : Colors.surface,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Digit ${label}`}
    >
      <Text style={styles.keypadLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centerSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 24,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotEmpty: {
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    fontFamily: Typography.family.medium,
    marginBottom: 8,
  },
  forgotButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  forgotText: {
    fontSize: 12,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 290,
    alignSelf: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadButton: {
    width: 78,
    height: 54,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8C324E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyKey: {
    width: 78,
    height: 54,
  },
  keypadLabel: {
    fontSize: 22,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.text,
  },
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  shieldIcon: {
    marginTop: -1,
  },
  footerText: {
    fontSize: 11,
    fontFamily: Typography.family.regular,
    color: Colors.textMuted,
  },
});
