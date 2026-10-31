import { addDays, differenceInCalendarDays, parseISO, format } from 'date-fns';
import type { PeriodLog } from '../schema';

export interface CyclePrediction {
  lastPeriodStart: string | null;
  nextPeriodDate: Date | null;
  formattedNextDate: string; // e.g. "Oct 8"
  likelyRange: string; // e.g. "Oct 6–10"
  daysRemaining: number | null;
  averageCycleLength: number; // e.g. 29
  hasLoggedPeriods: boolean;
}

export function calculateCyclePrediction(
  logs: PeriodLog[],
  settingCycleLength: number = 29
): CyclePrediction {
  if (!logs || logs.length === 0) {
    return {
      lastPeriodStart: null,
      nextPeriodDate: null,
      formattedNextDate: '',
      likelyRange: '',
      daysRemaining: null,
      averageCycleLength: settingCycleLength,
      hasLoggedPeriods: false,
    };
  }

  // Logs are expected to be ordered by start_date DESC
  const sorted = [...logs].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  const latest = sorted[0];
  const lastStartDate = parseISO(latest.start_date);

  // Calculate average cycle length if we have at least 2 distinct periods
  let cycleLength = settingCycleLength;
  if (sorted.length >= 2) {
    const diffs: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = parseISO(sorted[i].start_date);
      const prev = parseISO(sorted[i + 1].start_date);
      const diff = differenceInCalendarDays(current, prev);
      if (diff >= 18 && diff <= 45) {
        // typical teen cycle range
        diffs.push(diff);
      }
    }
    if (diffs.length > 0) {
      const avg = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
      cycleLength = avg;
    }
  }

  const nextDate = addDays(lastStartDate, cycleLength);
  const today = new Date();
  const daysRemaining = differenceInCalendarDays(nextDate, today);

  const rangeStart = addDays(nextDate, -2);
  const rangeEnd = addDays(nextDate, 2);

  const formattedNextDate = format(nextDate, 'MMM d');
  const likelyRange = `${format(rangeStart, 'MMM d')}–${format(rangeEnd, 'd')}`;

  return {
    lastPeriodStart: latest.start_date,
    nextPeriodDate: nextDate,
    formattedNextDate,
    likelyRange,
    daysRemaining,
    averageCycleLength: cycleLength,
    hasLoggedPeriods: true,
  };
}
