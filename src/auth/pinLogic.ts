export const PIN_STORAGE_KEY = 'sakhi_user_pin_hash';
export const PIN_SALT = 'sakhi_offline_privacy_salt_2026';
export const FAILED_ATTEMPTS_KEY = 'sakhi_pin_failed_attempts';
export const LOCKOUT_UNTIL_KEY = 'sakhi_pin_lockout_until';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

export async function hashPin(pin: string, salt: string = PIN_SALT): Promise<string> {
  const input = `${salt}:${pin}`;

  // Check if expo-crypto is available (React Native runtime)
  try {
    // Dynamic import so non-Expo environments (e.g. Node test runner) don't fail
    const Crypto = await import('expo-crypto');
    if (Crypto && typeof Crypto.digestStringAsync === 'function') {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        input
      );
    }
  } catch {
    // Fall back to Node.js crypto in test environments
  }

  // Node.js test runner environment
  try {
    const cryptoModule = 'node:crypto';
    const nodeCrypto = await import(/* webpackIgnore: true */ cryptoModule);
    return nodeCrypto.createHash('sha256').update(input).digest('hex');
  } catch {
    // Fallback if neither available
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return String(Math.abs(hash));
  }
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
