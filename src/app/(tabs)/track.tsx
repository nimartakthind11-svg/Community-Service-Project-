/**
 * Track Screen — Screen 3 of Sakhi
 *
 * Cycle tracker with:
 *  - Month calendar grid (built with date-fns, no heavy external library)
 *  - Highlight for logged period days, today, and predicted next window
 *  - Next period prediction card
 *  - Average cycle & Next period stat cards
 *  - Floating primary button "Log or edit period dates"
 *  - Full Range-selection Bottom Sheet for logging/editing period dates
 *  - Overlap and range validation with gentle teen-friendly feedback
 *  - Day tap quick-interaction with confirmation for period removal
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Calendar as CalendarIcon,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  format,
  parseISO,
  isAfter,
  startOfDay,
} from 'date-fns';

import { ScreenWrapper } from '@/components/ScreenWrapper';
import { AppHeader } from '@/components/AppHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, Typography, Spacing, Radii, Shadows, Layout } from '@/constants/theme';
import { usePeriodLogs } from '@/db/hooks/usePeriodLogs';
import { calculateCyclePrediction } from '@/lib/cycle';
import {
  formatDateKey,
  validatePeriodDates,
  handleRangeSelection,
  findPeriodForDay,
  isDayInPeriod,
  isDayInPredictedWindow,
} from '@/lib/periodLogic';
import { PeriodLog } from '@/db/schema';
import { triggerKeyHaptic, triggerSuccessHaptic, triggerErrorHaptic } from '@/utils/haptics';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ────────────────────────────────────────────────────────────────────────────
// Period Log Sheet Component
// ────────────────────────────────────────────────────────────────────────────

interface LogSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate: string | null, id?: number) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  existingLogs: PeriodLog[];
  editingLog?: PeriodLog | null;
  initialSelectedDay?: string | null;
}

const LogPeriodSheet: React.FC<LogSheetProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  existingLogs,
  editingLog,
  initialSelectedDay,
}) => {
  const { t } = useTranslation();
  const [slideAnim] = useState(() => new Animated.Value(500));

  const [sheetMonth, setSheetMonth] = useState<Date>(() => {
    if (editingLog) return parseISO(editingLog.start_date);
    if (initialSelectedDay) return parseISO(initialSelectedDay);
    return new Date();
  });
  const [selectedStart, setSelectedStart] = useState<string | null>(
    () => editingLog?.start_date ?? initialSelectedDay ?? null
  );
  const [selectedEnd, setSelectedEnd] = useState<string | null>(
    () => editingLog?.end_date ?? null
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Entrance animation on mount
  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [slideAnim]);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Mini calendar days for sheetMonth
  const sheetDays = useMemo(() => {
    const monthStart = startOfMonth(sheetMonth);
    const monthEnd = endOfMonth(sheetMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [sheetMonth]);

  const handleDayPress = (day: Date) => {
    if (isAfter(startOfDay(day), today)) {
      triggerErrorHaptic();
      setValidationError(t('track.sheet.errors.futureDate'));
      return;
    }

    triggerKeyHaptic();
    setValidationError(null);
    const dayStr = formatDateKey(day);

    const nextSelection = handleRangeSelection(selectedStart, selectedEnd, dayStr);
    setSelectedStart(nextSelection.startDate);
    setSelectedEnd(nextSelection.endDate);
  };

  const handleSave = async () => {
    if (!selectedStart) {
      setValidationError(t('track.sheet.errors.invalidDate'));
      triggerErrorHaptic();
      return;
    }

    const validation = validatePeriodDates(
      selectedStart,
      selectedEnd,
      existingLogs,
      editingLog?.id,
      today
    );

    if (!validation.isValid && validation.errorKey) {
      triggerErrorHaptic();
      setValidationError(t(`track.sheet.errors.${validation.errorKey}`));
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(selectedStart, selectedEnd, editingLog?.id);
      triggerSuccessHaptic();
      setShowSuccessToast(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch {
      setIsSubmitting(false);
      triggerErrorHaptic();
    }
  };

  const handleDelete = () => {
    if (!editingLog || !onDelete) return;

    Alert.alert(
      t('track.confirmDelete.title'),
      t('track.confirmDelete.message', {
        range: editingLog.end_date
          ? `${format(parseISO(editingLog.start_date), 'MMM d')} – ${format(
              parseISO(editingLog.end_date),
              'MMM d'
            )}`
          : format(parseISO(editingLog.start_date), 'MMM d'),
      }),
      [
        { text: t('track.confirmDelete.cancel'), style: 'cancel' },
        {
          text: t('track.confirmDelete.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(editingLog.id);
              triggerSuccessHaptic();
              onClose();
            } catch {
              triggerErrorHaptic();
            }
          },
        },
      ]
    );
  };

  // Helper to check if a day is within selected start & end
  const isSelected = (day: Date) => {
    if (!selectedStart) return false;
    const dStr = formatDateKey(day);
    if (!selectedEnd) return dStr === selectedStart;
    return dStr >= selectedStart && dStr <= selectedEnd;
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
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheetContent, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.sheetHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>
                {editingLog ? t('track.sheet.editTitle') : t('track.sheet.title')}
              </Text>
              <Text style={styles.sheetSubtitle}>{t('track.sheet.subtitle')}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.sheetCloseBtn}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('track.sheet.cancelButton')}
            >
              <X size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          {/* Success Banner */}
          {showSuccessToast && (
            <View style={styles.successToast}>
              <CheckCircle2 size={18} color={Colors.success} />
              <Text style={styles.successToastText}>{t('track.sheet.successMessage')}</Text>
            </View>
          )}

          {/* Range Preview Badge */}
          <View style={styles.rangePreviewBox}>
            <View style={styles.rangePreviewCol}>
              <Text style={styles.rangeLabel}>{t('track.sheet.startDateLabel')}</Text>
              <Text style={styles.rangeValue}>
                {selectedStart
                  ? format(parseISO(selectedStart), 'MMM d, yyyy')
                  : t('track.sheet.notSelected')}
              </Text>
            </View>
            <View style={styles.rangeDivider} />
            <View style={styles.rangePreviewCol}>
              <Text style={styles.rangeLabel}>{t('track.sheet.endDateLabel')}</Text>
              <Text style={styles.rangeValue}>
                {selectedEnd
                  ? format(parseISO(selectedEnd), 'MMM d, yyyy')
                  : selectedStart
                  ? format(parseISO(selectedStart), 'MMM d, yyyy')
                  : '—'}
              </Text>
            </View>
          </View>

          {/* Mini Month Navigator */}
          <View style={styles.calendarNavRow}>
            <Pressable
              onPress={() => setSheetMonth((m) => subMonths(m, 1))}
              style={styles.navArrow}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <ChevronLeft size={20} color={Colors.primary} />
            </Pressable>
            <Text style={styles.navMonthTitle}>{format(sheetMonth, 'MMMM yyyy')}</Text>
            <Pressable
              onPress={() => setSheetMonth((m) => addMonths(m, 1))}
              style={styles.navArrow}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <ChevronRight size={20} color={Colors.primary} />
            </Pressable>
          </View>

          {/* Weekday Row */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((w, idx) => (
              <Text key={idx} style={styles.weekdayText}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {sheetDays.map((day, idx) => {
              const inCurrentMonth = isSameMonth(day, sheetMonth);
              const isFuture = isAfter(startOfDay(day), today);
              const selected = isSelected(day);
              const isStartDay = selectedStart === formatDateKey(day);
              const isEndDay = selectedEnd === formatDateKey(day);

              return (
                <Pressable
                  key={idx}
                  onPress={() => handleDayPress(day)}
                  disabled={!inCurrentMonth || isFuture}
                  style={[
                    styles.miniDayCell,
                    selected && styles.dayCellSelected,
                    (isStartDay || isEndDay) && styles.dayCellRangeCap,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={format(day, 'MMMM d, yyyy')}
                  accessibilityState={{ selected, disabled: !inCurrentMonth || isFuture }}
                >
                  <Text
                    style={[
                      styles.dayNumberText,
                      !inCurrentMonth && styles.dayNumberOutside,
                      isFuture && styles.dayNumberDisabled,
                      selected && styles.dayNumberSelected,
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Validation Error Message */}
          {validationError && (
            <View style={styles.sheetErrorSlot}>
              <Text style={styles.sheetErrorText}>{validationError}</Text>
            </View>
          )}

          {/* Sheet Actions */}
          <View style={styles.sheetActionRow}>
            {editingLog && onDelete && (
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.deleteLogBtn,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('track.sheet.deleteButton')}
              >
                <Trash2 size={18} color={Colors.danger} />
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title={t('track.sheet.saveButton')}
                onPress={handleSave}
                loading={isSubmitting}
                disabled={!selectedStart || isSubmitting}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Main Screen Component
// ────────────────────────────────────────────────────────────────────────────

export default function TrackScreen() {
  const { t } = useTranslation();
  const { logs, loading, addLog, editLog, removeLog } = usePeriodLogs();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingLog, setEditingLog] = useState<PeriodLog | null>(null);
  const [initialTappedDay, setInitialTappedDay] = useState<string | null>(null);

  // Prediction engine
  const prediction = useMemo(() => calculateCyclePrediction(logs), [logs]);

  // Calendar dates for currentMonth
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Handlers for month navigation
  const prevMonth = useCallback(() => {
    triggerKeyHaptic();
    setCurrentMonth((m) => subMonths(m, 1));
  }, []);

  const nextMonth = useCallback(() => {
    triggerKeyHaptic();
    setCurrentMonth((m) => addMonths(m, 1));
  }, []);

  // Quick-tap day on main calendar
  const handleCalendarDayPress = useCallback(
    (day: Date) => {
      triggerKeyHaptic();
      const existingPeriod = findPeriodForDay(day, logs);

      if (existingPeriod) {
        // Tapped a logged period: prompt to edit or remove
        Alert.alert(
          t('track.confirmDelete.title'),
          t('track.confirmDelete.message', {
            range: existingPeriod.end_date
              ? `${format(parseISO(existingPeriod.start_date), 'MMM d')} – ${format(
                  parseISO(existingPeriod.end_date),
                  'MMM d'
                )}`
              : format(parseISO(existingPeriod.start_date), 'MMM d'),
          }),
          [
            { text: t('track.confirmDelete.cancel'), style: 'cancel' },
            {
              text: t('common.edit', 'Edit'),
              onPress: () => {
                setEditingLog(existingPeriod);
                setInitialTappedDay(null);
                setSheetVisible(true);
              },
            },
            {
              text: t('track.confirmDelete.confirm'),
              style: 'destructive',
              onPress: async () => {
                await removeLog(existingPeriod.id);
                triggerSuccessHaptic();
              },
            },
          ]
        );
      } else {
        // Unlogged day: if not in future, open sheet pre-selected with this day
        if (isAfter(startOfDay(day), today)) {
          triggerErrorHaptic();
          return;
        }
        setEditingLog(null);
        setInitialTappedDay(formatDateKey(day));
        setSheetVisible(true);
      }
    },
    [logs, removeLog, t, today]
  );

  const openLogSheetForNew = () => {
    triggerKeyHaptic();
    setEditingLog(null);
    setInitialTappedDay(null);
    setSheetVisible(true);
  };

  const handleSavePeriod = async (
    startDate: string,
    endDate: string | null,
    id?: number
  ) => {
    if (id) {
      await editLog(id, startDate, endDate);
    } else {
      await addLog(startDate, endDate);
    }
  };

  const handleDeletePeriod = async (id: number) => {
    await removeLog(id);
  };

  // Next period string formatting
  const nextPeriodText = prediction.hasLoggedPeriods
    ? t('track.aroundDate', { date: prediction.formattedNextDate })
    : t('track.noPredictionYet');

  const nextPeriodSubtext = prediction.hasLoggedPeriods
    ? t('track.likelyRange', { range: prediction.likelyRange })
    : t('track.logFirstPeriodHint');

  // Next period stat pill value
  const getNextPeriodStat = () => {
    if (!prediction.hasLoggedPeriods) return t('track.statNoValue');
    switch (prediction.pillLabel) {
      case 'today':
        return t('track.nextPeriodToday');
      case 'tomorrow':
        return t('track.nextPeriodTomorrow');
      case 'few_days_late':
        return t('track.nextPeriodLate');
      case 'about_n_days':
        return t('track.nextPeriodStatValue', { days: prediction.pillDays });
      default:
        return t('track.statNoValue');
    }
  };

  if (loading) {
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
      <ScreenWrapper scrollable contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <AppHeader />

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle} accessibilityRole="header">
            {t('track.title')}
          </Text>
          <Text style={styles.screenSubtitle}>{t('track.subtitle')}</Text>
        </View>

        {/* ── Main Month Calendar Card ───────────────────────────────── */}
        <View style={styles.calendarCard}>
          {/* Calendar Header with < Month > */}
          <View style={styles.calendarNavRow}>
            <Pressable
              onPress={prevMonth}
              style={styles.navArrow}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <ChevronLeft size={22} color={Colors.primary} />
            </Pressable>

            <Text style={styles.navMonthTitle} accessibilityRole="header">
              {format(currentMonth, 'MMMM yyyy')}
            </Text>

            <Pressable
              onPress={nextMonth}
              style={styles.navArrow}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <ChevronRight size={22} color={Colors.primary} />
            </Pressable>
          </View>

          {/* Weekday Row (S M T W T F S) */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((w, idx) => (
              <Text key={idx} style={styles.weekdayText}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, idx) => {
              const inCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDay = isToday(day);
              const isLogged = logs.some((l) => isDayInPeriod(day, l));
              const isPredicted =
                !isLogged &&
                prediction.hasLoggedPeriods &&
                isDayInPredictedWindow(day, prediction.nextPeriodDate, 2);

              return (
                <Pressable
                  key={idx}
                  onPress={() => inCurrentMonth && handleCalendarDayPress(day)}
                  style={[
                    styles.dayCell,
                    isLogged && styles.dayCellLogged,
                    isTodayDay && !isLogged && styles.dayCellToday,
                    isPredicted && inCurrentMonth && styles.dayCellPredicted,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${format(day, 'MMMM d')}${
                    isLogged ? ', period logged' : ''
                  }${isTodayDay ? ', today' : ''}${
                    isPredicted ? ', predicted period day' : ''
                  }`}
                  accessibilityState={{ selected: isLogged }}
                >
                  <Text
                    style={[
                      styles.dayNumberText,
                      !inCurrentMonth && styles.dayNumberOutside,
                      isLogged && styles.dayNumberLogged,
                      isTodayDay && !isLogged && styles.dayNumberToday,
                      isPredicted && inCurrentMonth && styles.dayNumberPredicted,
                    ]}
                  >
                    {inCurrentMonth ? format(day, 'd') : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Calendar Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDotLogged} />
              <Text style={styles.legendText}>{t('track.legendLogged')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendRingToday} />
              <Text style={styles.legendText}>{t('track.legendToday')}</Text>
            </View>
            {prediction.hasLoggedPeriods && (
              <View style={styles.legendItem}>
                <View style={styles.legendDotPredicted} />
                <Text style={styles.legendText}>{t('track.legendPredicted')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Next Period Card ───────────────────────────────────────── */}
        <View style={styles.nextPeriodCard}>
          <View style={styles.nextPeriodTextCol}>
            <Text style={styles.nextPeriodTag}>{t('track.nextPeriodLabel')}</Text>
            <Text style={styles.nextPeriodTitle}>{nextPeriodText}</Text>
            <Text style={styles.nextPeriodSubtitle}>{nextPeriodSubtext}</Text>
          </View>
          <View style={styles.nextPeriodBadge}>
            <CalendarIcon size={22} color={Colors.primary} strokeWidth={2.2} />
          </View>
        </View>

        {/* ── Stat Cards Row ─────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {/* Average Cycle Card */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('track.averageCycleLabel')}</Text>
            <Text style={styles.statValue}>
              {prediction.confidence === 'calculated'
                ? t('track.averageCycleValue', { days: prediction.averageCycleLength })
                : t('track.statNoValue')}
            </Text>
            {prediction.confidence !== 'calculated' && (
              <Text style={styles.statHint}>{t('track.needMoreCyclesHint')}</Text>
            )}
          </View>

          {/* Next Period Stat Card */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t('track.nextPeriodStatLabel')}</Text>
            <Text style={styles.statValue}>{getNextPeriodStat()}</Text>
          </View>
        </View>

        {/* Spacer for bottom floating button */}
        <View style={{ height: 80 }} />
      </ScreenWrapper>

      {/* ── Sticky Primary Button at Bottom ───────────────────────────── */}
      <View style={styles.stickyButtonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.floatingLogButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
          onPress={openLogSheetForNew}
          accessibilityRole="button"
          accessibilityLabel={t('track.logButton')}
        >
          <Pencil size={18} color={Colors.textInverse} strokeWidth={2.2} />
          <Text style={styles.floatingLogButtonText}>{t('track.logButton')}</Text>
        </Pressable>
      </View>

      {/* ── Log/Edit Bottom Sheet ─────────────────────────────────────── */}
      {sheetVisible && (
        <LogPeriodSheet
          key={`${editingLog?.id ?? 'new'}-${initialTappedDay ?? 'none'}`}
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          onSave={handleSavePeriod}
          onDelete={handleDeletePeriod}
          existingLogs={logs}
          editingLog={editingLog}
          initialSelectedDay={initialTappedDay}
        />
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: Layout.tabBarHeight + 36,
  },
  titleSection: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },

  // ── Main Calendar Card
  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navMonthTitle: {
    fontSize: 16,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xs,
    paddingHorizontal: 4,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    rowGap: 6,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellLogged: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.text,
  },
  dayCellPredicted: {
    backgroundColor: Colors.primaryLight,
  },
  dayNumberText: {
    fontSize: 13,
    fontFamily: Typography.family.medium,
    color: Colors.text,
  },
  dayNumberOutside: {
    color: 'transparent',
  },
  dayNumberLogged: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  dayNumberToday: {
    color: Colors.text,
    fontWeight: '700',
  },
  dayNumberPredicted: {
    color: Colors.primary,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotLogged: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.primary,
  },
  legendRingToday: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.text,
  },
  legendDotPredicted: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.primaryMuted,
  },
  legendText: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },

  // ── Next Period Card
  nextPeriodCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  nextPeriodTextCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  nextPeriodTag: {
    fontSize: 12,
    fontFamily: Typography.family.semiBold,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  nextPeriodTitle: {
    fontSize: 17,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  nextPeriodSubtitle: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  nextPeriodBadge: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Stat Cards
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 88,
    justifyContent: 'center',
    ...Shadows.soft,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
  },
  statHint: {
    fontSize: 10,
    fontFamily: Typography.family.regular,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // ── Floating / Sticky Button
  stickyButtonContainer: {
    position: 'absolute',
    bottom: Layout.tabBarHeight + 12,
    left: 20,
    right: 20,
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    zIndex: 90,
  },
  floatingLogButton: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.floating,
  },
  floatingLogButtonText: {
    fontSize: 15,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.textInverse,
  },

  // ── Bottom Sheet
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  sheetContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    padding: Spacing.lg,
    paddingBottom: Math.max(Spacing.xl, 30),
    maxHeight: '90%',
    ...Shadows.floating,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radii.full,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceMuted,
  },
  rangePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  rangePreviewCol: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
  },
  rangeDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  rangeLabel: {
    fontSize: 11,
    fontFamily: Typography.family.semiBold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  rangeValue: {
    fontSize: 13,
    fontFamily: Typography.family.bold,
    fontWeight: '700',
    color: Colors.primary,
  },
  miniDayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: Colors.primaryLight,
  },
  dayCellRangeCap: {
    backgroundColor: Colors.primary,
  },
  dayNumberDisabled: {
    color: Colors.borderStrong,
    opacity: 0.5,
  },
  dayNumberSelected: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  sheetErrorSlot: {
    backgroundColor: Colors.dangerLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    marginVertical: Spacing.xs,
  },
  sheetErrorText: {
    fontSize: 12,
    fontFamily: Typography.family.medium,
    color: Colors.danger,
    textAlign: 'center',
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.successLight,
    padding: Spacing.sm,
    borderRadius: Radii.md,
    marginBottom: Spacing.sm,
  },
  successToastText: {
    fontSize: 13,
    fontFamily: Typography.family.medium,
    color: Colors.success,
  },
  sheetActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  deleteLogBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
