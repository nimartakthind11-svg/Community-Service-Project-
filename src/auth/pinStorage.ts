import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { SQLiteDatabase } from 'expo-sqlite';
import { SEED_SETTINGS } from '../db/seedData';
import {
  PIN_STORAGE_KEY,
  FAILED_ATTEMPTS_KEY,
  LOCKOUT_UNTIL_KEY,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  hashPin,
  computeLockoutState,
  LockoutStatus,
} from './pinLogic';

export * from './pinLogic';

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }
  return await SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function hasSavedPin(): Promise<boolean> {
  const hash = await getItem(PIN_STORAGE_KEY);
  return !!hash;
}

export async function savePin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  await setItem(PIN_STORAGE_KEY, hash);
  await resetFailedAttempts();
}

export async function verifyPin(pin: string): Promise<boolean> {
  const storedHash = await getItem(PIN_STORAGE_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPin(pin);
  return storedHash === inputHash;
}

export async function removePin(): Promise<void> {
  await deleteItem(PIN_STORAGE_KEY);
  await resetFailedAttempts();
}

export async function getLockoutStatus(): Promise<LockoutStatus> {
  const failedStr = await getItem(FAILED_ATTEMPTS_KEY);
  const lockoutUntilStr = await getItem(LOCKOUT_UNTIL_KEY);

  const failedCount = failedStr ? parseInt(failedStr, 10) : 0;
  const lockoutUntil = lockoutUntilStr ? parseInt(lockoutUntilStr, 10) : 0;

  const status = computeLockoutState(failedCount, lockoutUntil);
  if (!status.isLocked && lockoutUntil > 0) {
    // Lockout expired, reset failed attempts
    await resetFailedAttempts();
  }
  return status;
}

export async function recordFailedAttempt(): Promise<LockoutStatus> {
  const currentStatus = await getLockoutStatus();
  if (currentStatus.isLocked) {
    return currentStatus;
  }

  const newCount = currentStatus.failedCount + 1;
  await setItem(FAILED_ATTEMPTS_KEY, String(newCount));

  if (newCount >= MAX_FAILED_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    await setItem(LOCKOUT_UNTIL_KEY, String(lockoutUntil));
    return {
      isLocked: true,
      remainingSeconds: 30,
      failedCount: newCount,
    };
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    failedCount: newCount,
  };
}

export async function resetFailedAttempts(): Promise<void> {
  await deleteItem(FAILED_ATTEMPTS_KEY);
  await deleteItem(LOCKOUT_UNTIL_KEY);
}

export async function wipeLocalUserData(db?: SQLiteDatabase | null): Promise<void> {
  // Wipe PIN & Lockout
  await removePin();
  await resetFailedAttempts();

  // Wipe database tables if db instance provided
  if (db) {
    await db.execAsync(`
      DELETE FROM period_logs;
      DELETE FROM article_reads;
      DELETE FROM settings;
    `);

    // Restore baseline settings
    for (const s of SEED_SETTINGS) {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        s.key,
        s.value
      );
    }
  }
}
