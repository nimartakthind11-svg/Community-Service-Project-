import test from 'node:test';
import assert from 'node:assert/strict';
import en from '../src/i18n/locales/en.json' with { type: 'json' };
import hi from '../src/i18n/locales/hi.json' with { type: 'json' };

test('Settings strings match Screen 8 design reference specifications', () => {
  const enSettings = en.settings as Record<string, string>;

  // Title and Subtitle
  assert.equal(enSettings.title, 'Settings');
  assert.equal(enSettings.subtitle, 'Make Sakhi feel right for you.');

  // Three card row strings
  assert.equal(enSettings.changePinTitle, 'Change PIN');
  assert.equal(enSettings.changePinSubtitle, 'Choose a new PIN to open Sakhi.');

  assert.equal(enSettings.languageTitle, 'Language');
  assert.equal(enSettings.languageSubtitle, 'Pick the language you prefer.');
  assert.equal(enSettings.languageValue, 'English');

  assert.equal(enSettings.privacyTitle, 'Privacy information');
  assert.equal(enSettings.privacySubtitle, "Read Sakhi's privacy information.");

  // About Sakhi section
  assert.equal(enSettings.aboutVersion, 'Sakhi v1.0.0');
  assert.equal(enSettings.aboutDisclaimer, 'An awareness and education tool, not medical advice.');
});

test('Translation parity for all Settings keys between en and hi', () => {
  const enKeys = Object.keys(en.settings).sort();
  const hiKeys = Object.keys(hi.settings).sort();
  assert.deepEqual(enKeys, hiKeys, 'Settings translation keys must match exactly between en and hi');
});
