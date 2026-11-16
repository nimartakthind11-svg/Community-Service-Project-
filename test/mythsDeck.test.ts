import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_MYTHS, SEED_TOPICS } from '../src/db/seedData.ts';
import en from '../src/i18n/locales/en.json' with { type: 'json' };
import hi from '../src/i18n/locales/hi.json' with { type: 'json' };

test('Myths deck seed data has correct schema, order, and clinical sources', () => {
  assert.ok(SEED_MYTHS.length >= 4, 'Should contain at least 4 myths');

  // Verify ordering by position
  const positions = SEED_MYTHS.map((m) => m.position);
  const sortedPositions = [...positions].sort((a, b) => a - b);
  assert.deepEqual(positions, sortedPositions, 'Seed myths must be ordered by position ascending');

  // Verify that every myth has non-empty myth, fact, and verifiable clinical source
  for (const item of SEED_MYTHS) {
    assert.ok(item.myth.trim().length > 0, 'Myth text cannot be empty');
    assert.ok(item.fact.trim().length > 0, 'Fact text cannot be empty');
    assert.ok(item.source.trim().length > 0, `Myth "${item.myth}" must cite a clinical source`);
    assert.ok(
      item.source.startsWith('ACOG') ||
        item.source.startsWith('AAP') ||
        item.source.startsWith('WHO') ||
        item.source.startsWith('UNICEF') ||
        item.source.includes('Oxford Academic'),
      `Source "${item.source}" must be a recognized health or clinical authority`
    );
  }
});

test('Myths categories are properly represented in topics and filterable', () => {
  const mythTopicSlugs = new Set(SEED_MYTHS.map((m) => m.topic_slug));
  const topicSlugs = new Set(SEED_TOPICS.map((t) => t.slug));

  for (const slug of mythTopicSlugs) {
    assert.ok(
      topicSlugs.has(slug),
      `Topic slug "${slug}" referenced by myths must exist in SEED_TOPICS`
    );
  }

  // Ensure 'periods-movement' exists for Screen 5 & 6
  assert.ok(
    topicSlugs.has('periods-movement'),
    'SEED_TOPICS must contain "periods-movement" for the default filter chip'
  );

  const periodsMovementMyths = SEED_MYTHS.filter((m) => m.topic_slug === 'periods-movement');
  assert.ok(periodsMovementMyths.length >= 1, 'Should have at least 1 myth for Periods & movement');
  assert.equal(
    periodsMovementMyths[0].myth,
    "You can't exercise during your period.",
    'First myth in periods-movement must match Screen 5 design text'
  );
  assert.equal(
    periodsMovementMyths[0].fact.split('.')[0],
    'You can move if it feels good',
    'Fact headline in periods-movement must match Screen 6 design text'
  );
  assert.equal(
    periodsMovementMyths[0].source,
    'ACOG - Dysmenorrhea: Painful Periods',
    'Source in periods-movement must match Screen 6 design citation'
  );
});

test('UI strings maintain gentle, non-evaluative tone without scores or grades', () => {
  const enMyths = en.myths as Record<string, string>;

  // Check reassurance string
  assert.equal(enMyths.gentleReassurance, 'Just exploring. Nothing to get right.');
  assert.equal(enMyths.pace, 'At your pace');
  assert.equal(enMyths.mythBadge, 'A MYTH YOU MIGHT HEAR');
  assert.equal(enMyths.factBadge, 'THE FACT');
  assert.equal(enMyths.revealButton, 'Reveal the fact ↺');
  assert.equal(enMyths.nextCard, 'Next card →');

  // Verify that evaluative terms (score, grade, pass, fail, test, correct, incorrect) are absent
  const serialized = JSON.stringify(enMyths).toLowerCase();
  assert.ok(!serialized.includes('grade'), 'Myths UI must not contain grading terminology');
  assert.ok(!serialized.includes('score'), 'Myths UI must not contain scoring terminology');
  assert.ok(!serialized.includes('passed'), 'Myths UI must not contain pass/fail terminology');
  assert.ok(!serialized.includes('failed'), 'Myths UI must not contain pass/fail terminology');
});

test('Hindi translation parity for all new myths deck keys', () => {
  const enKeys = Object.keys(en.myths).sort();
  const hiKeys = Object.keys(hi.myths).sort();
  assert.deepEqual(enKeys, hiKeys, 'myths translation keys must match exactly between en and hi');
});
