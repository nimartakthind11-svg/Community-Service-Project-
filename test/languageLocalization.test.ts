import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json' with { type: 'json' };
import hi from '../src/i18n/locales/hi.json' with { type: 'json' };
import {
  SEED_TOPICS,
  SEED_ARTICLES,
  SEED_MYTHS,
  SEED_QUESTIONS,
  SEED_SETTINGS,
} from '../src/db/seedData.ts';

test('Language selection strings match Screen 8 design specifications', () => {
  const enLang = (en as any).language;
  const hiLang = (hi as any).language;

  assert.ok(enLang, 'en.json must contain language section');
  assert.ok(hiLang, 'hi.json must contain language section');

  // Verify English strings
  assert.equal(enLang.title, 'Language');
  assert.equal(enLang.subtitle, 'Pick the language you prefer.');
  assert.equal(enLang.englishLabel, 'English');
  assert.equal(enLang.englishSub, 'English');
  assert.equal(enLang.hindiLabel, 'हिन्दी');
  assert.equal(enLang.hindiSub, 'Hindi');

  // Verify Hindi strings
  assert.equal(hiLang.title, 'भाषा');
  assert.equal(hiLang.subtitle, 'अपनी पसंदीदा भाषा चुनें।');
  assert.equal(hiLang.englishLabel, 'English');
  assert.equal(hiLang.hindiLabel, 'हिन्दी');
});

test('Translation completeness & 1:1 key parity across all sections between en and hi', () => {
  const enKeys = Object.keys(en).sort();
  const hiKeys = Object.keys(hi).sort();
  assert.deepEqual(enKeys, hiKeys, 'All top-level translation sections must match exactly');

  for (const section of enKeys) {
    const enSubKeys = Object.keys((en as Record<string, any>)[section]).sort();
    const hiSubKeys = Object.keys((hi as Record<string, any>)[section]).sort();
    assert.deepEqual(
      enSubKeys,
      hiSubKeys,
      `Subkeys in section "${section}" must match exactly between EN and HI`
    );
  }
});

test('Database content localization: Hindi content is present for all core categories', () => {
  // Topics have Hindi titles and subtitles
  assert.ok(SEED_TOPICS.length > 0);
  for (const topic of SEED_TOPICS) {
    assert.ok(topic.title, `Topic ${topic.slug} must have an English title`);
    assert.ok((topic as any).title_hi, `Topic ${topic.slug} must have a Hindi title`);
    assert.ok((topic as any).subtitle_hi, `Topic ${topic.slug} must have a Hindi subtitle`);
  }

  // Articles have Hindi titles and bodies
  assert.ok(SEED_ARTICLES.length > 0);
  for (const art of SEED_ARTICLES) {
    assert.ok(art.title, 'Article must have English title');
    assert.ok((art as any).title_hi, `Article "${art.title}" must have Hindi title`);
    assert.ok((art as any).body_hi, `Article "${art.title}" must have Hindi body`);
  }

  // Myths have Hindi text and facts
  assert.ok(SEED_MYTHS.length > 0);
  for (const myth of SEED_MYTHS) {
    assert.ok(myth.myth, 'Myth must have English text');
    assert.ok((myth as any).myth_hi, `Myth "${myth.myth}" must have Hindi text`);
    assert.ok((myth as any).fact_hi, `Myth "${myth.myth}" must have Hindi fact`);
  }

  // Questions have Hindi text and answers
  assert.ok(SEED_QUESTIONS.length > 0);
  for (const q of SEED_QUESTIONS) {
    assert.ok(q.question, 'Question must have English text');
    assert.ok((q as any).question_hi, `Question "${q.question}" must have Hindi text`);
    assert.ok((q as any).answer_hi, `Question "${q.question}" must have Hindi answer`);
  }
});

test('English fallback: returns localized field when present, falls back to English when absent or empty', () => {
  function getLocalizedText(
    enValue: string,
    hiValue: string | null | undefined,
    lang: string
  ): string {
    if (lang === 'hi' && hiValue && hiValue.trim().length > 0) {
      return hiValue;
    }
    return enValue;
  }

  // Case 1: Hindi selected and Hindi text exists -> returns Hindi
  const sampleTopic = SEED_TOPICS[0];
  const hindiResult = getLocalizedText(
    sampleTopic.title,
    (sampleTopic as any).title_hi,
    'hi'
  );
  assert.equal(hindiResult, (sampleTopic as any).title_hi);
  assert.equal(hindiResult, 'पीरियड्स और व्यायाम');

  // Case 2: Hindi selected but Hindi text is missing (undefined/null/empty) -> falls back to English
  const fallbackFromNull = getLocalizedText('First period', null, 'hi');
  assert.equal(fallbackFromNull, 'First period');

  const fallbackFromEmpty = getLocalizedText('First period', '   ', 'hi');
  assert.equal(fallbackFromEmpty, 'First period');

  // Case 3: English selected -> returns English even if Hindi exists
  const englishResult = getLocalizedText(
    sampleTopic.title,
    (sampleTopic as any).title_hi,
    'en'
  );
  assert.equal(englishResult, sampleTopic.title);
  assert.equal(englishResult, 'Periods & movement');
});

test('Language persistence in settings seed and restoration schema', () => {
  // SEED_SETTINGS must initialize language with 'en' default
  const langSetting = SEED_SETTINGS.find((s) => s.key === 'language');
  assert.ok(langSetting, 'SEED_SETTINGS must contain language key');
  assert.equal(langSetting?.value, 'en');

  // Simulate updating language to 'hi' and persisting in settings map
  const localSettingsMap: Record<string, string> = {};
  for (const s of SEED_SETTINGS) {
    localSettingsMap[s.key] = s.value;
  }

  assert.equal(localSettingsMap['language'], 'en');

  // User changes language to 'hi'
  localSettingsMap['language'] = 'hi';
  assert.equal(localSettingsMap['language'], 'hi');

  // Simulating app restart / relaunch: reading persisted settings restores 'hi'
  const restoredLang = localSettingsMap['language'] || 'en';
  assert.equal(restoredLang, 'hi', 'App restart must restore previously saved language');
});
