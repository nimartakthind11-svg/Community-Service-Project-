/**
 * periodLogic.test.ts
 *
 * Tests for period validation and range selection.
 * Runs in Node with: node --test test/periodLogic.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  doPeriodsOverlap,
  validatePeriodDates,
  handleRangeSelection,
  isDayInPeriod,
  findPeriodForDay,
  isDayInPredictedWindow,
} from '../src/lib/periodLogic.ts';

const TODAY = new Date('2026-10-15T12:00:00Z');

// ── Range Selection Tests ───────────────────────────────────────────────────

test('Range selection: first tap sets start date', () => {
  const result = handleRangeSelection(null, null, '2026-10-01');
  assert.equal(result.startDate, '2026-10-01');
  assert.equal(result.endDate, null);
});

test('Range selection: second tap on or after start date sets end date', () => {
  const result = handleRangeSelection('2026-10-01', null, '2026-10-05');
  assert.equal(result.startDate, '2026-10-01');
  assert.equal(result.endDate, '2026-10-05');
});

test('Range selection: second tap on same day creates 1-day range', () => {
  const result = handleRangeSelection('2026-10-01', null, '2026-10-01');
  assert.equal(result.startDate, '2026-10-01');
  assert.equal(result.endDate, '2026-10-01');
});

test('Range selection: second tap before start date resets start date to earlier day', () => {
  const result = handleRangeSelection('2026-10-05', null, '2026-10-02');
  assert.equal(result.startDate, '2026-10-02');
  assert.equal(result.endDate, null);
});

test('Range selection: tapping when a complete range exists starts a fresh selection', () => {
  const result = handleRangeSelection('2026-10-01', '2026-10-05', '2026-10-10');
  assert.equal(result.startDate, '2026-10-10');
  assert.equal(result.endDate, null);
});

// ── Overlap & Validation Tests ──────────────────────────────────────────────

test('Overlap detection: overlapping periods identified', () => {
  const p1 = { start_date: '2026-09-01', end_date: '2026-09-05' };
  const p2 = { start_date: '2026-09-04', end_date: '2026-09-08' }; // overlaps 09-04 and 09-05
  assert.equal(doPeriodsOverlap(p1, p2), true);
  assert.equal(doPeriodsOverlap(p2, p1), true);
});

test('Overlap detection: adjacent non-overlapping periods', () => {
  const p1 = { start_date: '2026-09-01', end_date: '2026-09-05' };
  const p2 = { start_date: '2026-09-06', end_date: '2026-09-10' };
  assert.equal(doPeriodsOverlap(p1, p2), false);
  assert.equal(doPeriodsOverlap(p2, p1), false);
});

test('Overlap detection: single day period overlap', () => {
  const p1 = { start_date: '2026-09-03', end_date: null }; // single day 09-03
  const p2 = { start_date: '2026-09-01', end_date: '2026-09-05' }; // covers 09-03
  assert.equal(doPeriodsOverlap(p1, p2), true);

  const p3 = { start_date: '2026-09-06', end_date: null }; // outside
  assert.equal(doPeriodsOverlap(p1, p3), false);
});

test('Validation: valid period passes', () => {
  const existing = [
    { id: 1, start_date: '2026-09-01', end_date: '2026-09-05' },
  ];
  const res = validatePeriodDates('2026-09-28', '2026-10-02', existing, null, TODAY);
  assert.equal(res.isValid, true);
});

test('Validation: end date before start date fails', () => {
  const res = validatePeriodDates('2026-10-05', '2026-10-02', [], null, TODAY);
  assert.equal(res.isValid, false);
  assert.equal(res.errorKey, 'endBeforeStart');
});

test('Validation: future start or end date fails', () => {
  // TODAY is 2026-10-15
  const resStartFuture = validatePeriodDates('2026-10-16', null, [], null, TODAY);
  assert.equal(resStartFuture.isValid, false);
  assert.equal(resStartFuture.errorKey, 'futureDate');

  const resEndFuture = validatePeriodDates('2026-10-14', '2026-10-18', [], null, TODAY);
  assert.equal(resEndFuture.isValid, false);
  assert.equal(resEndFuture.errorKey, 'futureDate');
});

test('Validation: overlapping period fails', () => {
  const existing = [
    { id: 1, start_date: '2026-09-01', end_date: '2026-09-05' },
  ];
  const res = validatePeriodDates('2026-09-03', '2026-09-07', existing, null, TODAY);
  assert.equal(res.isValid, false);
  assert.equal(res.errorKey, 'periodOverlap');
});

test('Validation: editing existing period does not self-collide', () => {
  const existing = [
    { id: 1, start_date: '2026-09-01', end_date: '2026-09-05' },
    { id: 2, start_date: '2026-09-28', end_date: '2026-10-02' },
  ];
  // Modifying log #1 to end a day earlier (2026-09-04)
  const res = validatePeriodDates('2026-09-01', '2026-09-04', existing, 1, TODAY);
  assert.equal(res.isValid, true);

  // Modifying log #1 to overlap with log #2
  const resOverlap = validatePeriodDates('2026-09-27', '2026-09-30', existing, 1, TODAY);
  assert.equal(resOverlap.isValid, false);
  assert.equal(resOverlap.errorKey, 'periodOverlap');
});

// ── Calendar Day State Tests ────────────────────────────────────────────────

test('Calendar day state: isDayInPeriod detects period days', () => {
  const log = { start_date: '2026-09-03', end_date: '2026-09-07' };
  assert.equal(isDayInPeriod(new Date('2026-09-02'), log), false);
  assert.equal(isDayInPeriod(new Date('2026-09-03'), log), true);
  assert.equal(isDayInPeriod(new Date('2026-09-05'), log), true);
  assert.equal(isDayInPeriod(new Date('2026-09-07'), log), true);
  assert.equal(isDayInPeriod(new Date('2026-09-08'), log), false);
});

test('Calendar day state: findPeriodForDay returns matching log', () => {
  const logs = [
    { id: 1, start_date: '2026-09-03', end_date: '2026-09-07' },
    { id: 2, start_date: '2026-10-01', end_date: '2026-10-05' },
  ];
  const found = findPeriodForDay(new Date('2026-09-05'), logs);
  assert.ok(found);
  assert.equal(found?.id, 1);

  const notFound = findPeriodForDay(new Date('2026-09-15'), logs);
  assert.equal(notFound, null);
});

test('Calendar day state: isDayInPredictedWindow matches window', () => {
  const predicted = new Date('2026-10-08');
  assert.equal(isDayInPredictedWindow(new Date('2026-10-08'), predicted, 2), true);
  assert.equal(isDayInPredictedWindow(new Date('2026-10-06'), predicted, 2), true);
  assert.equal(isDayInPredictedWindow(new Date('2026-10-10'), predicted, 2), true);
  assert.equal(isDayInPredictedWindow(new Date('2026-10-05'), predicted, 2), false);
  assert.equal(isDayInPredictedWindow(new Date('2026-10-11'), predicted, 2), false);
});

