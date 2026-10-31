import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { hasSavedPin, savePin, verifyPin, removePin } from './pinStorage';

interface AuthContextType {
  isAuthenticated: boolean;
  isPinSet: boolean;
  isLoading: boolean;
  unlockWithPin: (pin: string) => Promise<boolean>;
  setupNewPin: (pin: string) => Promise<void>;
  resetUserPin: () => Promise<void>;
  lockSession: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const BACKGROUND_LOCK_TIMEOUT_MS = 30 * 1000; // 30 seconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPinSet, setIsPinSet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const lastBackgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    hasSavedPin()
      .then((hasPin) => {
        if (isMounted) {
          setIsPinSet(hasPin);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        console.error('Error checking PIN status:', e);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle 30-second background timeout
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        lastBackgroundTimeRef.current = Date.now();
      } else if (nextAppState === 'active') {
        if (lastBackgroundTimeRef.current) {
          const elapsed = Date.now() - lastBackgroundTimeRef.current;
          if (elapsed >= BACKGROUND_LOCK_TIMEOUT_MS) {
            setIsAuthenticated(false);
          }
        }
        lastBackgroundTimeRef.current = null;
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    const isValid = await verifyPin(pin);
    if (isValid) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const setupNewPin = useCallback(async (pin: string): Promise<void> => {
    await savePin(pin);
    setIsPinSet(true);
    setIsAuthenticated(true);
  }, []);

  const resetUserPin = useCallback(async (): Promise<void> => {
    await removePin();
    setIsPinSet(false);
    setIsAuthenticated(false);
  }, []);

  const lockSession = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isPinSet,
        isLoading,
        unlockWithPin,
        setupNewPin,
        resetUserPin,
        lockSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
