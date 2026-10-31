import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const PIN_STORAGE_KEY = 'sakhi_user_pin_hash';
const PIN_SALT = 'sakhi_offline_privacy_salt_2026';

async function hashPin(pin: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${PIN_SALT}:${pin}`
  );
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  }
  return await SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
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
}

export async function verifyPin(pin: string): Promise<boolean> {
  const storedHash = await getItem(PIN_STORAGE_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPin(pin);
  return storedHash === inputHash;
}

export async function removePin(): Promise<void> {
  await deleteItem(PIN_STORAGE_KEY);
}

