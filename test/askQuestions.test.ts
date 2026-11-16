import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_QUESTIONS, SEED_TOPICS } from '../src/db/seedData.ts';
import en from '../src/i18n/locales/en.json' with { type: 'json' };
import hi from '../src/i18n/locales/hi.json' with { type: 'json' };

test('Ask Q&A seed questions adhere to clinical guidelines and design specs', () => {
  assert.ok(SEED_QUESTIONS.length >= 8, 'Should have at least 8 curated seed questions');

  // Verify that every question has question, answer, and accredited medical source
  for (const q of SEED_QUESTIONS) {
    assert.ok(q.question.trim().length > 0, 'Question text required');
    assert.ok(q.answer.trim().length > 0, 'Answer text required');
    assert.ok(q.source.trim().length > 0, `Question "${q.question}" must have a medical source`);
    assert.ok(
      q.source.startsWith('ACOG') ||
        q.source.startsWith('AAP') ||
        q.source.startsWith('WHO') ||
        q.source.startsWith('UNICEF'),
      `Source "${q.source}" must be accredited`
    );
  }

  // Verify the 4 exact questions shown on Screen 7 of design mockup
  const questionTexts = SEED_QUESTIONS.map((q) => q.question);
  assert.ok(
    questionTexts.includes('What if my period starts at school?'),
    'Must include "What if my period starts at school?"'
  );
  assert.ok(
    questionTexts.includes("Why doesn't my period come on time?"),
    'Must include "Why doesn\'t my period come on time?"'
  );
  assert.ok(
    questionTexts.includes('How often should I change my pad?'),
    'Must include "How often should I change my pad?"'
  );
  assert.ok(
    questionTexts.includes('What can help when I have cramps?'),
    'Must include "What can help when I have cramps?"'
  );
});

test('Potentially concerning questions are properly tagged for healthcare callouts', () => {
  const concerning = SEED_QUESTIONS.filter((q: any) => q.is_concerning === 1);
  assert.ok(concerning.length >= 2, 'Must tag at least 2 questions as potentially concerning');

  for (const q of concerning) {
    assert.ok(
      q.question.toLowerCase().includes('pain') ||
        q.question.toLowerCase().includes('bleeding') ||
        q.question.toLowerCase().includes('cramp'),
      'Concerning questions should address severe symptoms'
    );
  }
});

test('Ask topics map to valid seed topics in the database', () => {
  const askTopics = SEED_TOPICS.filter((t) => t.category === 'ask');
  assert.equal(askTopics.length, 4, 'Must have 4 topics for the Ask screen');

  const slugs = askTopics.map((t) => t.slug);
  assert.ok(slugs.includes('first-periods'), 'Must include first-periods topic');
  assert.ok(slugs.includes('cycle-changes'), 'Must include cycle-changes topic');
  assert.ok(slugs.includes('hygiene-ask'), 'Must include hygiene-ask topic');
  assert.ok(slugs.includes('feelings-discomfort'), 'Must include feelings-discomfort topic');
});

test('Translation parity for all Ask section keys between en and hi', () => {
  const enAskKeys = Object.keys(en.ask).sort();
  const hiAskKeys = Object.keys(hi.ask).sort();
  assert.deepEqual(enAskKeys, hiAskKeys, 'Ask translation keys must match exactly between en and hi');
});
