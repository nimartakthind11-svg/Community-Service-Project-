/**
 * cycle.ts — Shared cycle-prediction engine.
 * Pure functions only: no React, no RN, no SQLite. Testable in Node.
 *
 * "Sakhi" is an awareness & education tool, not a medical or fertility app.
 * Predictions carry a "cycles can shift" disclaimer and must never be
 * presented as medical advice.
 */

import { addDays, differenceInCalendarDays, parseISO, format } from 'date-fns';

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface PeriodLogLike {
  start_date: string; // ISO-8601 date string, e.g. "2024-09-12"
  end_date?: string | null;
}

export type DaysPillLabel =
  | 'today'
  | 'tomorrow'
  | 'about_n_days'
  | 'few_days_late';

export interface CyclePredictionResult {
  /** True when at least one period has been logged */
  hasLoggedPeriods: boolean;
  /** "estimate" when only 1 log, "calculated" when 2+ logs */
  confidence: 'estimate' | 'calculated';
  /** Average cycle length used for prediction */
  averageCycleLength: number;
  /** Predicted next period start date (null when no logs) */
  nextPeriodDate: Date | null;
  /** Formatted date string, e.g. "Oct 8" */
  formattedNextDate: string;
  /** Days remaining until predicted date (negative = overdue) */
  daysRemaining: number | null;
  /** UI pill label discriminant */
  pillLabel: DaysPillLabel | null;
  /** Numeric days for "about N days" pill (null when not applicable) */
  pillDays: number | null;
  /** Formatted range string, e.g. "Oct 5–11" */
  likelyRange: string;
  /** Raw ISO string of the last logged period start */
  lastPeriodStart: string | null;
}

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

/** Default cycle length (days) when only 1 period has been logged */
export const DEFAULT_CYCLE_LENGTH = 28;

/** Plausible teen-cycle range used to filter outliers */
export const MIN_CYCLE_GAP = 18;
export const MAX_CYCLE_GAP = 45;

/** Maximum historical cycles considered for averaging */
export const MAX_CYCLES_FOR_AVERAGE = 6;

/** Range half-width shown in the "may arrive ±N days" note */
export const RANGE_HALF_DAYS = 3;

// ────────────────────────────────────────────────────────────────────────────
// Core engine
// ────────────────────────────────────────────────────────────────────────────

/**
 * Calculate a cycle prediction from an array of period logs.
 *
 * @param logs     Array of PeriodLogLike objects (any order; function sorts internally)
 * @param today    Reference "today" — defaults to new Date(). Injectable for tests.
 */
export function calculateCyclePrediction(
  logs: PeriodLogLike[],
  today: Date = new Date()
): CyclePredictionResult {
  // ── No data ─────────────────────────────────────────────────────────────
  if (!logs || logs.length === 0) {
    return {
      hasLoggedPeriods: false,
      confidence: 'estimate',
      averageCycleLength: DEFAULT_CYCLE_LENGTH,
      nextPeriodDate: null,
      formattedNextDate: '',
      daysRemaining: null,
      pillLabel: null,
      pillDays: null,
      likelyRange: '',
      lastPeriodStart: null,
    };
  }

  // ── Sort newest-first ─────────────────────────────────────────────────
  const sorted = [...logs].sort(
    (a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  const latest = sorted[0];
  const lastStartDate = parseISO(latest.start_date);

  // ── Average cycle length ──────────────────────────────────────────────
  let cycleLength = DEFAULT_CYCLE_LENGTH;
  let confidence: 'estimate' | 'calculated' = 'estimate';

  if (sorted.length >= 2) {
    // Consider at most MAX_CYCLES_FOR_AVERAGE gaps (= MAX_CYCLES_FOR_AVERAGE+1 periods)
    const window = sorted.slice(0, MAX_CYCLES_FOR_AVERAGE + 1);
    const gaps: number[] = [];

    for (let i = 0; i < window.length - 1; i++) {
      const current = parseISO(window[i].start_date);
      const prev = parseISO(window[i + 1].start_date);
      const diff = differenceInCalendarDays(current, prev);

      if (diff >= MIN_CYCLE_GAP && diff <= MAX_CYCLE_GAP) {
        gaps.push(diff);
      }
    }

    if (gaps.length > 0) {
      const avg = Math.round(
        gaps.reduce((acc, g) => acc + g, 0) / gaps.length
      );
      cycleLength = avg;
      confidence = 'calculated';
    }
  }

  // ── Predicted next date ───────────────────────────────────────────────
  const nextPeriodDate = addDays(lastStartDate, cycleLength);
  const daysRemaining = differenceInCalendarDays(nextPeriodDate, today);

  // ── Pill label ────────────────────────────────────────────────────────
  let pillLabel: DaysPillLabel;
  let pillDays: number | null = null;

  if (daysRemaining < 0) {
    pillLabel = 'few_days_late';
  } else if (daysRemaining === 0) {
    pillLabel = 'today';
  } else if (daysRemaining === 1) {
    pillLabel = 'tomorrow';
  } else {
    pillLabel = 'about_n_days';
    pillDays = daysRemaining;
  }

  // ── Range ─────────────────────────────────────────────────────────────
  const rangeStart = addDays(nextPeriodDate, -RANGE_HALF_DAYS);
  const rangeEnd = addDays(nextPeriodDate, RANGE_HALF_DAYS);

  // Format: "Oct 5–11" (same month) or "Sep 29 – Oct 3"
  const rangeStartStr = format(rangeStart, 'MMM d');
  const rangeEndStr =
    rangeStart.getMonth() === rangeEnd.getMonth()
      ? format(rangeEnd, 'd')
      : format(rangeEnd, 'MMM d');
  const likelyRange = `${rangeStartStr}–${rangeEndStr}`;

  return {
    hasLoggedPeriods: true,
    confidence,
    averageCycleLength: cycleLength,
    nextPeriodDate,
    formattedNextDate: format(nextPeriodDate, 'MMM d'),
    daysRemaining,
    pillLabel,
    pillDays,
    likelyRange,
    lastPeriodStart: latest.start_date,
  };
}

