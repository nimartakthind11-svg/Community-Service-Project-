import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPin,
  computeLockoutState,
  PIN_SALT,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
} from '../src/auth/pinLogic.ts';

test('PIN hashing produces a secure, salted 64-character SHA-256 hex string', async () => {
  const pin = '1234';
  const hashed = await hashPin(pin);

  // Must not store plain text PIN
  assert.notEqual(hashed, pin);
  assert.equal(hashed.includes(pin), false);

  // Must be 64 hex characters (SHA-256)
  assert.equal(hashed.length, 64);
  assert.match(hashed, /^[0-9a-f]{64}$/);

  // Must be deterministic for the same PIN and salt
  const hashedAgain = await hashPin(pin);
  assert.equal(hashed, hashedAgain);

  // Different PINs produce different hashes
  const hashedDifferent = await hashPin('5678');
  assert.notEqual(hashed, hashedDifferent);
});

test('Lockout logic: Below maximum attempts is not locked', () => {
  const now = 100000;
  for (let failed = 0; failed < MAX_FAILED_ATTEMPTS; failed++) {
    const status = computeLockoutState(failed, 0, now);
    assert.equal(status.isLocked, false);
    assert.equal(status.remainingSeconds, 0);
    assert.equal(status.failedCount, failed);
  }
});

test('Lockout logic: Reaching 5 failed attempts locks for 30 seconds', () => {
  const now = 1000000;
  const lockoutUntil = now + LOCKOUT_DURATION_MS; // +30,000ms

  // At exact moment of lockout
  const status = computeLockoutState(MAX_FAILED_ATTEMPTS, lockoutUntil, now);
  assert.equal(status.isLocked, true);
  assert.equal(status.remainingSeconds, 30);
  assert.equal(status.failedCount, 5);

  // After 10 seconds elapsed (20s remaining)
  const statusAfter10s = computeLockoutState(MAX_FAILED_ATTEMPTS, lockoutUntil, now + 10000);
  assert.equal(statusAfter10s.isLocked, true);
  assert.equal(statusAfter10s.remainingSeconds, 20);

  // After 29.5 seconds elapsed (1s remaining)
  const statusNearEnd = computeLockoutState(MAX_FAILED_ATTEMPTS, lockoutUntil, now + 29500);
  assert.equal(statusNearEnd.isLocked, true);
  assert.equal(statusNearEnd.remainingSeconds, 1);
});

test('Lockout logic: Automatically unlocks when lockout duration has passed', () => {
  const now = 1000000;
  const lockoutUntil = now + LOCKOUT_DURATION_MS;

  // After 30 seconds exactly
  const statusExpired = computeLockoutState(MAX_FAILED_ATTEMPTS, lockoutUntil, now + 30000);
  assert.equal(statusExpired.isLocked, false);
  assert.equal(statusExpired.remainingSeconds, 0);

  // Well after expiration
  const statusWayPast = computeLockoutState(MAX_FAILED_ATTEMPTS, lockoutUntil, now + 50000);
  assert.equal(statusWayPast.isLocked, false);
  assert.equal(statusWayPast.remainingSeconds, 0);
});
