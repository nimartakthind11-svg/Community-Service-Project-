export const PIN_STORAGE_KEY = 'sakhi_user_pin_hash';
export const PIN_SALT = 'sakhi_offline_privacy_salt_2026';
export const FAILED_ATTEMPTS_KEY = 'sakhi_pin_failed_attempts';
export const LOCKOUT_UNTIL_KEY = 'sakhi_pin_lockout_until';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

/**
 * Pure SHA-256 hasher using standard WebCrypto (available in Node 20+ and modern web).
 * No dynamic imports to ensure compatibility with Hermes JS engine on Android/iOS.
 */
export async function hashPin(pin: string, salt: string = PIN_SALT): Promise<string> {
  const input = `${salt}:${pin}`;

  if (typeof globalThis.crypto?.subtle?.digest === 'function') {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Pure fallback if subtle is not available
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  failedCount: number;
}

export function computeLockoutState(
  failedCount: number,
  lockoutUntil: number,
  now: number = Date.now()
): LockoutStatus {
  if (lockoutUntil > now) {
    const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
    return {
      isLocked: true,
      remainingSeconds: Math.max(1, remainingSeconds),
      failedCount,
    };
  }
  return {
    isLocked: false,
    remainingSeconds: 0,
    failedCount,
  };
}
