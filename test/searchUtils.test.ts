/**
 * searchUtils.test.ts
 *
 * Tests for search highlighting and snippet extraction.
 * Runs in Node with: node --test test/searchUtils.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { highlightMatches, extractSnippet } from '../src/lib/searchUtils.ts';

test('highlightMatches: empty query returns full text without matches', () => {
  const result = highlightMatches('Your first period guide', '');
  assert.equal(result.length, 1);
  assert.equal(result[0].text, 'Your first period guide');
  assert.equal(result[0].isMatch, false);
});

test('highlightMatches: highlights matched query case-insensitively', () => {
  const result = highlightMatches('Starting your period is normal', 'period');
  assert.deepEqual(result, [
    { text: 'Starting your ', isMatch: false },
    { text: 'period', isMatch: true },
    { text: ' is normal', isMatch: false },
  ]);

  // Case-insensitive match preserves original casing
  const resultUpper = highlightMatches('PERIOD basics and hygiene', 'period');
  assert.equal(resultUpper[0].text, 'PERIOD');
  assert.equal(resultUpper[0].isMatch, true);
});

test('highlightMatches: handles special regex characters safely', () => {
  const result = highlightMatches('Pain? Check (ACOG) info [here]', '(ACOG)');
  assert.equal(result.some((r) => r.isMatch && r.text === '(ACOG)'), true);
});

test('extractSnippet: centers snippet around query match', () => {
  const longText =
    'Starting your period is a normal and healthy sign that your body is growing. You might notice small changes first, like light spotting or feeling a bit more tired.';
  const snippet = extractSnippet(longText, 'spotting', 60);

  assert.ok(snippet.toLowerCase().includes('spotting'));
  assert.ok(snippet.length <= 80);
});

test('extractSnippet: fallback when query not in text returns truncated start', () => {
  const longText = 'Hello world, this is a very long text that exceeds thirty characters.';
  const snippet = extractSnippet(longText, 'cramps', 20);
  assert.ok(snippet.endsWith('…'));
});

