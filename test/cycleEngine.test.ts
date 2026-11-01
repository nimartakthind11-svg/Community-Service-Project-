/**
 * cycleEngine.test.ts
 *
 * Unit tests for src/lib/cycle.ts
 * Runs in Node with: node --test test/cycleEngine.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCyclePrediction,
  DEFAULT_CYCLE_LENGTH,
  MAX_CYCLES_FOR_AVERAGE,
  RANGE_HALF_DAYS,
} from '../src/lib/cycle.ts';

// Helper: build a log with a start_date N days before a reference date
function makeLog(
  daysBeforeRef: number,
  ref: Date = new Date('2024-10-01')
): { start_date: string } {
  const d = new Date(ref);
  d.setDate(d.getDate() - daysBeforeRef);
  return { start_date: d.toISOString().slice(0, 10) };
}

// ─── Test 1: No periods logged ────────────────────────────────────────────────

test('No periods: returns hasLoggedPeriods=false, no prediction', () => {
  const result = calculateCyclePrediction([]);

  assert.equal(result.hasLoggedPeriods, false);
  assert.equal(result.nextPeriodDate, null);
  assert.equal(result.formattedNextDate, '');
  assert.equal(result.daysRemaining, null);
  assert.equal(result.pillLabel, null);
  assert.equal(result.pillDays, null);
  assert.equal(result.likelyRange, '');
  assert.equal(result.lastPeriodStart, null);
  assert.equal(result.averageCycleLength, DEFAULT_CYCLE_LENGTH);
  assert.equal(result.confidence, 'estimate');
});

// ─── Test 2: Exactly 1 period logged ─────────────────────────────────────────

test('1 period: uses default 28-day cycle, confidence=estimate', () => {
  // Last period started 7 days ago; today is ref
  const today = new Date('2024-10-08');
  const logs = [{ start_date: '2024-10-01' }];
  const result = calculateCyclePrediction(logs, today);

  assert.equal(result.hasLoggedPeriods, true);
  assert.equal(result.confidence, 'estimate');
  assert.equal(result.averageCycleLength, DEFAULT_CYCLE_LENGTH); // 28

  // Expected next: 2024-10-01 + 28 = 2024-10-29
  // Use formattedNextDate (date-fns format, local timezone) rather than toISOString()
  // to avoid UTC offset shifting the date by one day in UTC+5:30 and similar zones.
  assert.ok(result.nextPeriodDate !== null);
  assert.equal(result.formattedNextDate, 'Oct 29');

  // daysRemaining = Oct 29 - Oct 8 = 21
  assert.equal(result.daysRemaining, 21);
  assert.equal(result.pillLabel, 'about_n_days');
  assert.equal(result.pillDays, 21);

  // Range = Oct 29 ±3 = Oct 26–Nov 1
  assert.equal(result.likelyRange, 'Oct 26–Nov 1');
});

// ─── Test 3: 2 periods — calculated average ───────────────────────────────────

test('2 periods: computes average cycle length, confidence=calculated', () => {
  const today = new Date('2024-10-08');
  // Period 1 started Sep 10, Period 2 started Oct 1 → gap = 21 days
  const logs = [
    { start_date: '2024-10-01' },
    { start_date: '2024-09-10' },
  ];
  const result = calculateCyclePrediction(logs, today);

  assert.equal(result.hasLoggedPeriods, true);
  assert.equal(result.confidence, 'calculated');
  assert.equal(result.averageCycleLength, 21);

  // next = Oct 1 + 21 = Oct 22
  assert.equal(result.formattedNextDate, 'Oct 22');
  // days remaining = Oct 22 - Oct 8 = 14
  assert.equal(result.daysRemaining, 14);
  assert.equal(result.pillLabel, 'about_n_days');
  assert.equal(result.pillDays, 14);
});

// ─── Test 4: Irregular cycles — outliers filtered, average computed ────────────

test('Irregular cycles: outlier gaps excluded, within-range gaps averaged', () => {
  const today = new Date('2024-11-01');
  // Three periods; one gap is 60 days (outlier), the other is 30 days
  const logs = [
    { start_date: '2024-10-15' }, // gap from Sep 15 = 30 days ✓
    { start_date: '2024-09-15' }, // gap from Jul 17 = 60 days (outlier) ✗
    { start_date: '2024-07-17' },
  ];
  const result = calculateCyclePrediction(logs, today);

  assert.equal(result.confidence, 'calculated');
  // Only the 30-day gap is valid; outlier filtered
  assert.equal(result.averageCycleLength, 30);

  // next = Oct 15 + 30 = Nov 14
  assert.equal(result.formattedNextDate, 'Nov 14');
  // daysRemaining = Nov 14 - Nov 1 = 13
  assert.equal(result.daysRemaining, 13);
});

// ─── Test 5: Overdue — prediction date already passed ────────────────────────

test('Overdue: daysRemaining is negative, pillLabel=few_days_late', () => {
  const today = new Date('2024-11-10');
  // Last period Oct 1, default 28-day cycle → predicted Nov 1 (9 days ago)
  const logs = [{ start_date: '2024-10-01' }];
  const result = calculateCyclePrediction(logs, today);

  // Nov 1 - Nov 10 = -9
  assert.ok(result.daysRemaining !== null && result.daysRemaining < 0);
  assert.equal(result.pillLabel, 'few_days_late');
  assert.equal(result.pillDays, null);
});

// ─── Test 6: Tomorrow pill ────────────────────────────────────────────────────

test('daysRemaining=1 → pillLabel=tomorrow', () => {
  // Last period Oct 1, today Oct 28 (1 day before the predicted Oct 29)
  const today = new Date('2024-10-28');
  const logs = [{ start_date: '2024-10-01' }]; // default 28 → Oct 29
  const result = calculateCyclePrediction(logs, today);

  assert.equal(result.daysRemaining, 1);
  assert.equal(result.pillLabel, 'tomorrow');
  assert.equal(result.pillDays, null);
});

// ─── Test 7: Today pill ───────────────────────────────────────────────────────

test('daysRemaining=0 → pillLabel=today', () => {
  const today = new Date('2024-10-29');
  const logs = [{ start_date: '2024-10-01' }]; // default 28 → Oct 29
  const result = calculateCyclePrediction(logs, today);

  assert.equal(result.daysRemaining, 0);
  assert.equal(result.pillLabel, 'today');
  assert.equal(result.pillDays, null);
});

// ─── Test 8: More than MAX_CYCLES_FOR_AVERAGE logs ────────────────────────────

test('Many periods: averages only the last MAX_CYCLES_FOR_AVERAGE gaps', () => {
  // Build 8 periods each 28 days apart, then slip in an old weird one
  const today = new Date('2024-11-01');
  const logs: { start_date: string }[] = [];
  // Start from 2024-10-01 and step back 28 days each time for 8 records
  let d = new Date('2024-10-01');
  for (let i = 0; i < 8; i++) {
    logs.push({ start_date: d.toISOString().slice(0, 10) });
    d = new Date(d);
    d.setDate(d.getDate() - 28);
  }
  // Add an ancient outlier (120-day gap) — should NOT be considered
  logs.push({ start_date: '2022-01-01' });

  const result = calculateCyclePrediction(logs, today);

  // All 6 sampled gaps should be 28 days, so average = 28
  assert.equal(result.confidence, 'calculated');
  assert.equal(result.averageCycleLength, 28);
});

// ─── Test 9: Range stays within same month ────────────────────────────────────

test('Range within same month uses short end-date format', () => {
  // next = Oct 15 ±3 → Oct 12–18
  const today = new Date('2024-10-01');
  const logs = [{ start_date: '2024-09-17' }]; // 17+28=Oct 15
  const result = calculateCyclePrediction(logs, today);

  assert.equal(result.formattedNextDate, 'Oct 15');
  assert.equal(result.likelyRange, 'Oct 12–18');
});
