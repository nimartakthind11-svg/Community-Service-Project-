import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCyclePrediction } from '../src/db/hooks/useCyclePrediction.ts';
import { SEED_TOPICS, SEED_ARTICLES, SEED_MYTHS, SEED_QUESTIONS, SEED_PERIOD_LOGS } from '../src/db/seedData.ts';
import { Colors, Layout } from '../src/constants/theme.ts';
import en from '../src/i18n/locales/en.json' with { type: 'json' };
import hi from '../src/i18n/locales/hi.json' with { type: 'json' };

test('Theme tokens adhere to design specifications', () => {
  assert.equal(Colors.primary, '#B8234D');
  assert.equal(Colors.background, '#FFF5F6');
  assert.ok(Layout.minTouchTarget >= 44, 'Min touch target must be at least 44px');
});

test('calculateCyclePrediction handles empty logs', () => {
  const result = calculateCyclePrediction([], 29);
  assert.equal(result.hasLoggedPeriods, false);
  assert.equal(result.nextPeriodDate, null);
  assert.equal(result.formattedNextDate, '');
  assert.equal(result.averageCycleLength, 29);
});

test('calculateCyclePrediction calculates next period for single period log', () => {
  const logs = [{ id: 1, start_date: '2026-09-03', end_date: '2026-09-07' }];
  const result = calculateCyclePrediction(logs, 29);

  assert.equal(result.hasLoggedPeriods, true);
  assert.ok(result.nextPeriodDate !== null);
  // 2026-09-03 + 29 days = 2026-10-02
  assert.equal(result.formattedNextDate, 'Oct 2');
  assert.equal(result.averageCycleLength, 29);
});

test('calculateCyclePrediction calculates custom average cycle length across multiple logs', () => {
  const logs = [
    { id: 2, start_date: '2026-10-01', end_date: '2026-10-05' },
    { id: 1, start_date: '2026-09-01', end_date: '2026-09-05' }, // 30 days gap
  ];
  const result = calculateCyclePrediction(logs, 28);

  assert.equal(result.hasLoggedPeriods, true);
  assert.equal(result.averageCycleLength, 30);
  // 2026-10-01 + 30 days = 2026-10-31
  assert.equal(result.formattedNextDate, 'Oct 31');
  assert.equal(result.likelyRange, 'Oct 29–2');
});

test('Seed data integrity and medical source citation requirements', () => {
  assert.ok(SEED_TOPICS.length >= 4, 'Must seed at least 4 topics');
  for (const topic of SEED_TOPICS) {
    assert.ok(topic.title, 'Topic must have title');
    assert.ok(topic.slug, 'Topic must have slug');
  }

  assert.ok(SEED_ARTICLES.length > 0, 'Must seed articles');
  for (const article of SEED_ARTICLES) {
    assert.ok(article.source, `Article ${article.title} must have a clinical or educational source`);
  }

  assert.ok(SEED_MYTHS.length >= 3, 'Must seed myths');
  for (const myth of SEED_MYTHS) {
    assert.ok(myth.myth, 'Myth text required');
    assert.ok(myth.fact, 'Fact text required');
    assert.ok(myth.source, `Myth must carry a verifiable source: ${myth.myth}`);
  }

  assert.ok(SEED_QUESTIONS.length >= 4, 'Must seed common questions');
  for (const q of SEED_QUESTIONS) {
    assert.ok(q.question, 'Question required');
    assert.ok(q.answer, 'Answer required');
    assert.ok(q.source, `Question must cite a source: ${q.question}`);
  }
});

test('Translation parity between en and hi', () => {
  const enKeys = Object.keys(en);
  const hiKeys = Object.keys(hi);
  assert.deepEqual(enKeys.sort(), hiKeys.sort(), 'Top-level translation sections must match');

  for (const key of enKeys) {
    const enSub = Object.keys((en as Record<string, any>)[key]);
    const hiSub = Object.keys((hi as Record<string, any>)[key]);
    assert.deepEqual(enSub.sort(), hiSub.sort(), `Subkeys for ${key} must match between en and hi`);
  }
});

