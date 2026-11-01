/**
 * periodLogic.ts — Pure functions for period date selection, overlap validation,
 * and calendar day state determination.
 *
 * Offline-first, teen-friendly, non-judgmental.
 */

import {
  parseISO,
  isBefore,
  isAfter,
  isSameDay,
  addDays,
  format,
  startOfDay,
} from 'date-fns';
export interface PeriodLogLike {
  start_date: string; // ISO-8601 date string, e.g. "2024-09-12"
  end_date?: string | null;
}

export interface PeriodValidationResult {
  isValid: boolean;
  errorKey?: 'endBeforeStart' | 'futureDate' | 'periodOverlap' | 'invalidDate';
}

/**
 * Format a Date to 'yyyy-MM-dd' ISO string
 */
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Normalizes start and end dates for a period. If end_date is null/undefined,
 * treats the period as a 1-day period where end = start.
 */
export function getPeriodInterval(log: PeriodLogLike): { start: Date; end: Date } {
  const start = startOfDay(parseISO(log.start_date));
  const end = log.end_date ? startOfDay(parseISO(log.end_date)) : start;
  return { start, end };
}

/**
 * Check if two period date ranges overlap.
 * Intervals [A_start, A_end] and [B_start, B_end] overlap if:
 * A_start <= B_end AND B_start <= A_end.
 */
export function doPeriodsOverlap(
  periodA: PeriodLogLike,
  periodB: PeriodLogLike
): boolean {
  const a = getPeriodInterval(periodA);
  const b = getPeriodInterval(periodB);

  return (
    (isBefore(a.start, b.end) || isSameDay(a.start, b.end)) &&
    (isBefore(b.start, a.end) || isSameDay(b.start, a.end))
  );
}

/**
 * Validates a period date range:
 * 1. Checks that end_date is not before start_date.
 * 2. Checks that neither date is in the future beyond `today`.
 * 3. Checks that this period does not overlap with any existing period
 *    (excluding the one being edited, if `editingId` is provided).
 */
export function validatePeriodDates(
  startDateStr: string,
  endDateStr: string | null,
  existingLogs: (PeriodLogLike & { id?: number })[],
  editingId?: number | null,
  today: Date = new Date()
): PeriodValidationResult {
  if (!startDateStr) {
    return { isValid: false, errorKey: 'invalidDate' };
  }

  const todayStart = startOfDay(today);
  const start = startOfDay(parseISO(startDateStr));

  if (isNaN(start.getTime())) {
    return { isValid: false, errorKey: 'invalidDate' };
  }

  // Future start date check
  if (isAfter(start, todayStart)) {
    return { isValid: false, errorKey: 'futureDate' };
  }

  let end = start;
  if (endDateStr) {
    end = startOfDay(parseISO(endDateStr));
    if (isNaN(end.getTime())) {
      return { isValid: false, errorKey: 'invalidDate' };
    }

    // End date before start date
    if (isBefore(end, start)) {
      return { isValid: false, errorKey: 'endBeforeStart' };
    }

    // Future end date check
    if (isAfter(end, todayStart)) {
      return { isValid: false, errorKey: 'futureDate' };
    }
  }

  const candidate: PeriodLogLike = {
    start_date: startDateStr,
    end_date: endDateStr,
  };

  // Check overlap with existing logs
  for (const log of existingLogs) {
    if (editingId && log.id === editingId) {
      continue; // Skip the log being edited
    }

    if (doPeriodsOverlap(candidate, log)) {
      return { isValid: false, errorKey: 'periodOverlap' };
    }
  }

  return { isValid: true };
}

/**
 * Checks if a given day falls within a period log.
 */
export function isDayInPeriod(day: Date, log: PeriodLogLike): boolean {
  const { start, end } = getPeriodInterval(log);
  const d = startOfDay(day);
  return (
    (isAfter(d, start) || isSameDay(d, start)) &&
    (isBefore(d, end) || isSameDay(d, end))
  );
}

/**
 * Finds which period log covers the given day (if any).
 */
export function findPeriodForDay<T extends PeriodLogLike>(
  day: Date,
  logs: T[]
): T | null {
  for (const log of logs) {
    if (isDayInPeriod(day, log)) {
      return log;
    }
  }
  return null;
}

/**
 * Check if a day is in the predicted period window (e.g. nextPeriodDate ± windowDays).
 */
export function isDayInPredictedWindow(
  day: Date,
  predictedNextDate: Date | null,
  windowDays: number = 3
): boolean {
  if (!predictedNextDate) return false;
  const d = startOfDay(day);
  const center = startOfDay(predictedNextDate);
  const windowStart = addDays(center, -windowDays);
  const windowEnd = addDays(center, windowDays);

  return (
    (isAfter(d, windowStart) || isSameDay(d, windowStart)) &&
    (isBefore(d, windowEnd) || isSameDay(d, windowEnd))
  );
}

/**
 * 2-tap range selection state machine:
 * - Tap 1 (no start, or already have start & end): sets new start, clears end.
 * - Tap 2 (start exists, no end):
 *     - If tappedDay >= start: sets end.
 *     - If tappedDay < start: resets start to tappedDay.
 */
export function handleRangeSelection(
  currentStart: string | null,
  currentEnd: string | null,
  tappedDayStr: string
): { startDate: string; endDate: string | null } {
  // If no start, or if a full range was already selected, begin a new selection
  if (!currentStart || (currentStart && currentEnd)) {
    return { startDate: tappedDayStr, endDate: null };
  }

  // We have a start but no end
  const start = parseISO(currentStart);
  const tapped = parseISO(tappedDayStr);

  if (isBefore(tapped, start)) {
    // Tapped earlier date -> reset start date to the earlier date
    return { startDate: tappedDayStr, endDate: null };
  }

  // Tapped on or after start date -> set end date
  return { startDate: currentStart, endDate: tappedDayStr };
}
