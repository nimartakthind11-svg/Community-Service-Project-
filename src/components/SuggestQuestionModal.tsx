import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { HelpCircle, X, Check } from 'lucide-react-native';
import { Colors, Typography, Radii, Layout, Shadows } from '../constants/theme';
import { triggerKeyHaptic, triggerSuccessHaptic } from '../utils/haptics';

interface SuggestQuestionModalProps {
  visible: boolean;
  initialQuery?: string;
  onSave: (questionText: string) => Promise<void>;
  onClose: () => void;
}

export const SuggestQuestionModal: React.FC<SuggestQuestionModalProps> = ({
  visible,
  initialQuery = '',
  onSave,
  onClose,
}) => {
  const { t } = useTranslation();
  const [questionText, setQuestionText] = useState(initialQuery);
  const [isSaved, setIsSaved] = useState(false);
  const [slideAnim] = useState(() => new Animated.Value(350));

  // Reset text when modal transitions from closed to open
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setQuestionText(initialQuery);
      setIsSaved(false);
    }
  }

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
        toValue: 350,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleSave = async () => {
    if (!questionText.trim()) return;
    triggerSuccessHaptic();
    await onSave(questionText.trim());
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClose = () => {
    triggerKeyHaptic();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.iconBadge}>
              <HelpCircle size={20} color={Colors.primary} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.modalTitle}>
                {t('ask.suggestSheetTitle', 'Suggest a question')}
              </Text>
              <Text style={styles.modalSubtitle}>
                {t(
                  'ask.suggestSheetSubtitle',
                  'Saved privately on your device for user testing and research. Never sent over the internet.'
                )}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={t('ask.close', 'Close')}
              hitSlop={8}
            >
              <X size={18} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Form Content */}
          {isSaved ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconBadge}>
                <Check size={24} color={Colors.textInverse} strokeWidth={2.5} />
              </View>
              <Text style={styles.successText}>
                {t(
                  'ask.suggestSuccess',
                  'Question saved privately on your device. Thank you!'
                )}
              </Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={questionText}
                onChangeText={setQuestionText}
                placeholder={t(
                  'ask.suggestPlaceholder',
                  'Type the question you were looking for...'
                )}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoFocus
              />

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={handleClose}
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('ask.close', 'Close')}
                >
                  <Text style={styles.cancelButtonText}>
                    {t('common.cancel', 'Cancel')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSave}
                  disabled={!questionText.trim()}
                  style={({ pressed }) => [
                    styles.saveButton,
                    !questionText.trim() && styles.saveButtonDisabled,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('ask.saveSuggestion', 'Save question')}
                >
                  <Text style={styles.saveButtonText}>
                    {t('ask.saveSuggestion', 'Save question')}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  closeButton: {
    padding: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceMuted,
    marginLeft: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: 14,
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.text,
    minHeight: 84,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: Typography.family.semiBold,
    color: Colors.textInverse,
  },
  successContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    fontFamily: Typography.family.semiBold,
    color: Colors.text,
    textAlign: 'center',
  },
});
