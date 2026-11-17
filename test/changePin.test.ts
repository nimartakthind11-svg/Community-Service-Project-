import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPin,
  computeLockoutState,
  isValidPinFormat,
  verifyPinAgainstHash,
  validateNewPinConfirmation,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
} from '../src/auth/pinLogic.ts';
import en from '../src/i18n/locales/en.json' with { type: 'json' };
import hi from '../src/i18n/locales/hi.json' with { type: 'json' };

test('PIN format validation: only exact 4-digit numbers are valid', () => {
  assert.equal(isValidPinFormat('1234'), true);
  assert.equal(isValidPinFormat('0000'), true);
  assert.equal(isValidPinFormat('9876'), true);

  // Invalid formats
  assert.equal(isValidPinFormat(''), false);
  assert.equal(isValidPinFormat('123'), false);
  assert.equal(isValidPinFormat('12345'), false);
  assert.equal(isValidPinFormat('12a4'), false);
  assert.equal(isValidPinFormat('abcd'), false);
  assert.equal(isValidPinFormat(' 123'), false);
});

test('Current PIN verification against stored hash', async () => {
  const currentPin = '2468';
  const storedHash = await hashPin(currentPin);

  // Correct PIN matches hash
  const isValid = await verifyPinAgainstHash(currentPin, storedHash);
  assert.equal(isValid, true);

  // Incorrect PIN fails
  const isInvalid = await verifyPinAgainstHash('1357', storedHash);
  assert.equal(isInvalid, false);

  // Empty or invalid input fails safely
  assert.equal(await verifyPinAgainstHash('', storedHash), false);
  assert.equal(await verifyPinAgainstHash('2468', ''), false);
});

test('New PIN confirmation validation', () => {
  // Matching valid PINs
  const validMatch = validateNewPinConfirmation('4321', '4321');
  assert.equal(validMatch.isValid, true);
  assert.equal(validMatch.error, undefined);

  // Mismatched confirmation
  const mismatch = validateNewPinConfirmation('4321', '4322');
  assert.equal(mismatch.isValid, false);
  assert.equal(mismatch.error, 'mismatch');

  // Invalid format
  const invalidFormat = validateNewPinConfirmation('12', '12');
  assert.equal(invalidFormat.isValid, false);
  assert.equal(invalidFormat.error, 'invalid_format');
});

test('Complete Change PIN 3-step workflow with hash update', async () => {
  // Initial state: User has PIN '1111'
  const initialPin = '1111';
  let storedHash = await hashPin(initialPin);

  // Step 1: User tries incorrect current PIN ('9999')
  const attemptWrong = await verifyPinAgainstHash('9999', storedHash);
  assert.equal(attemptWrong, false, 'Incorrect current PIN must be rejected');

  // Step 1: User enters correct current PIN ('1111')
  const attemptRight = await verifyPinAgainstHash('1111', storedHash);
  assert.equal(attemptRight, true, 'Correct current PIN must be accepted');

  // Step 2: User chooses new PIN ('5555')
  const newPin = '5555';
  assert.equal(isValidPinFormat(newPin), true, 'New PIN must be valid 4 digits');

  // Step 3: User enters mismatched confirmation ('5556')
  const confirmMismatch = validateNewPinConfirmation(newPin, '5556');
  assert.equal(confirmMismatch.isValid, false);
  assert.equal(confirmMismatch.error, 'mismatch');

  // Stored hash must NOT have changed on mismatch
  assert.equal(await verifyPinAgainstHash(newPin, storedHash), false);
  assert.equal(await verifyPinAgainstHash(initialPin, storedHash), true);

  // Step 3: User enters matching confirmation ('5555')
  const confirmMatch = validateNewPinConfirmation(newPin, '5555');
  assert.equal(confirmMatch.isValid, true);

  // Hash update occurs only after successful step 1 and step 3
  storedHash = await hashPin(newPin);

  // Verification of the new PIN
  assert.equal(await verifyPinAgainstHash(newPin, storedHash), true);

  // Old PIN is no longer valid
  assert.equal(await verifyPinAgainstHash(initialPin, storedHash), false);

  // Security check: Hash must be 64-char hex string, not containing plain text
  assert.equal(storedHash.length, 64);
  assert.equal(storedHash.includes(newPin), false);
  assert.match(storedHash, /^[0-9a-f]{64}$/);
});

test('Incorrect PIN lockout rules during PIN verification', () => {
  const now = 1000000;

  // 1 through 4 failed attempts do not trigger lockout
  for (let attempt = 1; attempt < MAX_FAILED_ATTEMPTS; attempt++) {
    const status = computeLockoutState(attempt, 0, now);
    assert.equal(status.isLocked, false);
    assert.equal(status.remainingSeconds, 0);
  }

  // 5th failed attempt triggers 30-second lockout
  const lockoutUntil = now + LOCKOUT_DURATION_MS;
  const lockedStatus = computeLockoutState(MAX_FAILED_ATTEMPTS, lockoutUntil, now);
  assert.equal(lockedStatus.isLocked, true);
  assert.equal(lockedStatus.remainingSeconds, 30);
  assert.equal(lockedStatus.failedCount, 5);

  // Mid-way through lockout (15 seconds remaining)
  const midLockout = computeLockoutState(MAX_FAILED_ATTEMPTS, lockoutUntil, now + 15000);
  assert.equal(midLockout.isLocked, true);
  assert.equal(midLockout.remainingSeconds, 15);

  // Lockout expires after 30 seconds
  const expiredStatus = computeLockoutState(MAX_FAILED_ATTEMPTS, lockoutUntil, now + 30000);
  assert.equal(expiredStatus.isLocked, false);
  assert.equal(expiredStatus.remainingSeconds, 0);
});

test('Change PIN translation strings match requirements and have EN/HI parity', () => {
  const enChangePin = (en as any).changePin;
  const hiChangePin = (hi as any).changePin;

  assert.ok(enChangePin, 'en.json must contain changePin section');
  assert.ok(hiChangePin, 'hi.json must contain changePin section');

  // Verify essential English strings
  assert.equal(enChangePin.title, 'Change PIN');
  assert.equal(enChangePin.stepCurrentTitle, 'Enter current PIN');
  assert.equal(enChangePin.stepNewTitle, 'Enter new PIN');
  assert.equal(enChangePin.stepConfirmTitle, 'Confirm new PIN');
  assert.equal(enChangePin.successTitle, 'PIN updated');
  assert.equal(enChangePin.backToSettings, 'Back to Settings');

  // Verify parity between EN and HI keys
  const enKeys = Object.keys(enChangePin).sort();
  const hiKeys = Object.keys(hiChangePin).sort();
  assert.deepEqual(enKeys, hiKeys, 'Change PIN translation keys must match exactly between EN and HI');
});
