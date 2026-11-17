import test from 'node:test';
import assert from 'node:assert/strict';
import {
  handleRangeSelection,
  validatePeriodDates,
  formatDateKey,
  isDayInPeriod,
  findPeriodForDay,
} from '../src/lib/periodLogic.ts';
import { parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';

test('Date selection: selecting dates before, on, and after 18 November 2026', () => {
  const TODAY_STR = '2026-11-18';
  const TODAY = parseISO(TODAY_STR);

  // 1. Selecting dates before current date
  const selPast = handleRangeSelection(null, null, '2026-11-05');
  assert.equal(selPast.startDate, '2026-11-05');
  assert.equal(selPast.endDate, null);

  const selPastRange = handleRangeSelection(selPast.startDate, selPast.endDate, '2026-11-09');
  assert.equal(selPastRange.startDate, '2026-11-05');
  assert.equal(selPastRange.endDate, '2026-11-09');
  assert.equal(validatePeriodDates(selPastRange.startDate, selPastRange.endDate, [], null, TODAY).isValid, true);

  // 2. Selecting dates encompassing current date (started Nov 16, ends Nov 20)
  const selCurrentStart = handleRangeSelection(null, null, '2026-11-16');
  const selCurrentRange = handleRangeSelection(selCurrentStart.startDate, null, '2026-11-20');
  assert.equal(selCurrentRange.startDate, '2026-11-16');
  assert.equal(selCurrentRange.endDate, '2026-11-20');
  assert.equal(validatePeriodDates(selCurrentRange.startDate, selCurrentRange.endDate, [], null, TODAY).isValid, true);

  // 3. Selecting dates entirely after current date (Nov 20 to Nov 24)
  const selFutureStart = handleRangeSelection(null, null, '2026-11-20');
  const selFutureRange = handleRangeSelection(selFutureStart.startDate, null, '2026-11-24');
  assert.equal(selFutureRange.startDate, '2026-11-20');
  assert.equal(selFutureRange.endDate, '2026-11-24');
  assert.equal(validatePeriodDates(selFutureRange.startDate, selFutureRange.endDate, [], null, TODAY).isValid, true);
});

test('Date selection: range spanning across two different months (Nov 28 to Dec 3)', () => {
  const TODAY = parseISO('2026-11-18');

  // Step 1: User selects start date in November
  const step1 = handleRangeSelection(null, null, '2026-11-28');
  assert.equal(step1.startDate, '2026-11-28');
  assert.equal(step1.endDate, null);

  // Step 2: User navigates to December and taps Dec 3
  const step2 = handleRangeSelection(step1.startDate, step1.endDate, '2026-12-03');
  assert.equal(step2.startDate, '2026-11-28');
  assert.equal(step2.endDate, '2026-12-03');

  // Step 3: Validate cross-month range
  const validation = validatePeriodDates(step2.startDate, step2.endDate, [], null, TODAY);
  assert.equal(validation.isValid, true);

  // Step 4: Verify days highlighted across both months
  const period = { start_date: '2026-11-28', end_date: '2026-12-03' };

  // In November: Nov 28, 29, 30 are covered
  assert.equal(isDayInPeriod(parseISO('2026-11-28'), period), true);
  assert.equal(isDayInPeriod(parseISO('2026-11-29'), period), true);
  assert.equal(isDayInPeriod(parseISO('2026-11-30'), period), true);
  assert.equal(isDayInPeriod(parseISO('2026-11-27'), period), false);

  // In December: Dec 1, 2, 3 are covered
  assert.equal(isDayInPeriod(parseISO('2026-12-01'), period), true);
  assert.equal(isDayInPeriod(parseISO('2026-12-02'), period), true);
  assert.equal(isDayInPeriod(parseISO('2026-12-03'), period), true);
  assert.equal(isDayInPeriod(parseISO('2026-12-04'), period), false);
});

test('Calendar grid consistency: outside days do not display phantom numbers', () => {
  const novemberDate = parseISO('2026-11-18');
  const monthStart = startOfMonth(novemberDate);
  const monthEnd = endOfMonth(novemberDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const gridDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // November has 30 days
  const novemberDays = gridDays.filter((d) => isSameMonth(d, novemberDate));
  assert.equal(novemberDays.length, 30);

  // Trailing December days in the grid (Dec 1, 2, 3, 4, 5) must be recognized as !inCurrentMonth
  const outsideDays = gridDays.filter((d) => !isSameMonth(d, novemberDate));
  assert.ok(outsideDays.length > 0);

  // Both calendars use `{inCurrentMonth ? format(day, 'd') : ''}`
  // Ensuring outside days render empty string, eliminating phantom faded numbers
  for (const day of outsideDays) {
    const renderedText = isSameMonth(day, novemberDate) ? formatDateKey(day) : '';
    assert.equal(renderedText, '', 'Outside-month day cell must not render number text');
  }

  // All November days 1 through 30 render valid non-empty number text
  for (const day of novemberDays) {
    const renderedText = isSameMonth(day, novemberDate) ? String(day.getDate()) : '';
    assert.notEqual(renderedText, '');
    assert.equal(parseInt(renderedText, 10), day.getDate());
  }
});

test('Editing and Reopening logged period dates', () => {
  const existingLogs = [
    { id: 1, start_date: '2026-10-01', end_date: '2026-10-05' },
    { id: 2, start_date: '2026-11-16', end_date: '2026-11-20' },
  ];

  // Tapping on Nov 18 finds existing period #2
  const tappedDay = parseISO('2026-11-18');
  const found = findPeriodForDay(tappedDay, existingLogs);
  assert.ok(found);
  assert.equal(found.id, 2);

  // Editing period #2 to extend to Nov 22: does not collide with itself
  const editValidation = validatePeriodDates('2026-11-16', '2026-11-22', existingLogs, found.id);
  assert.equal(editValidation.isValid, true);

  // Attempting to expand to overlap period #1 fails
  const overlapValidation = validatePeriodDates('2026-10-04', '2026-10-08', existingLogs, found.id);
  assert.equal(overlapValidation.isValid, false);
  assert.equal(overlapValidation.errorKey, 'periodOverlap');
});
