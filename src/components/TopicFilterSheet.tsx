import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Activity,
  Droplets,
  Heart,
  CalendarDays,
  Check,
  X,
} from 'lucide-react-native';
import { Colors, Typography, Radii, Layout, Shadows } from '../constants/theme';
import { triggerKeyHaptic } from '../utils/haptics';

export interface FilterOption {
  slug: string | null;
  labelKey: string;
  defaultLabel: string;
  IconComponent: React.ComponentType<{ size: number; color: string }>;
}

export const FILTER_OPTIONS: FilterOption[] = [
  {
    slug: 'all',
    labelKey: 'myths.allTopics',
    defaultLabel: 'All',
    IconComponent: Sparkles,
  },
  {
    slug: 'periods-movement',
    labelKey: 'myths.topicPeriodsMovement',
    defaultLabel: 'Periods & movement',
    IconComponent: Activity,
  },
  {
    slug: 'hygiene',
    labelKey: 'myths.topicHygiene',
    defaultLabel: 'Hygiene',
    IconComponent: Droplets,
  },
  {
    slug: 'first-periods',
    labelKey: 'myths.topicFirstPeriods',
    defaultLabel: 'First periods',
    IconComponent: Heart,
  },
  {
    slug: 'cycle-changes',
    labelKey: 'myths.topicCycleChanges',
    defaultLabel: 'Cycle changes',
    IconComponent: CalendarDays,
  },
];

interface TopicFilterSheetProps {
  visible: boolean;
  selectedSlug: string | null;
  onSelectTopic: (slug: string | null) => void;
  onClose: () => void;
}

export const TopicFilterSheet: React.FC<TopicFilterSheetProps> = ({
  visible,
  selectedSlug,
  onSelectTopic,
  onClose,
}) => {
  const { t } = useTranslation();
  const [slideAnim] = useState(() => new Animated.Value(320));

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
        toValue: 320,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleSelect = (slug: string | null) => {
    triggerKeyHaptic();
    onSelectTopic(slug);
    onClose();
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
          accessibilityLabel={t('common.cancel', 'Close')}
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>
                {t('myths.filterTitle', 'Choose a topic')}
              </Text>
              <Text style={styles.subtitleText}>
                {t('myths.filterSubtitle', 'Filter the myths by topic')}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel', 'Close')}
              hitSlop={8}
            >
              <X size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Options */}
          <View style={styles.optionsList}>
            {FILTER_OPTIONS.map((opt) => {
              const isSelected =
                (opt.slug === 'all' && (!selectedSlug || selectedSlug === 'all')) ||
                selectedSlug === opt.slug;
              const IconComp = opt.IconComponent;
              const label = t(opt.labelKey, opt.defaultLabel);

              return (
                <Pressable
                  key={opt.slug || 'all'}
                  onPress={() => handleSelect(opt.slug)}
                  style={({ pressed }) => [
                    styles.optionItem,
                    isSelected && styles.optionItemSelected,
                    pressed && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={label}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.iconBadge,
                        isSelected && styles.iconBadgeSelected,
                      ]}
                    >
                      <IconComp
                        size={18}
                        color={isSelected ? Colors.textInverse : Colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Check size={16} color={Colors.primary} strokeWidth={2.5} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
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
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
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
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitleText: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceMuted,
    marginLeft: 8,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    minHeight: Layout.minTouchTarget,
  },
  optionItemSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.borderStrong,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    backgroundColor: Colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBadgeSelected: {
    backgroundColor: Colors.primary,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: Typography.family.medium,
    color: Colors.text,
  },
  optionLabelSelected: {
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: Radii.full,
    backgroundColor: Colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
