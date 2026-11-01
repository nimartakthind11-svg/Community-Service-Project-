/**
 * app/index.tsx — Root entry point / auth redirect gateway
 *
 * Expo Router needs a file at `app/index.tsx` (or equivalent) to know the
 * initial route. This file shows a loading splash while AuthContext resolves
 * whether a PIN is set, then immediately replaces itself with either:
 *   - /(auth)/lock  — if the session is not authenticated
 *   - /(tabs)       — if the session is already authenticated (e.g. after hot-reload)
 *
 * This avoids the "no initial route" flash and guarantees the PIN lock is
 * always shown on cold start.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/auth/AuthContext';
import { Colors } from '@/constants/theme';

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait for auth state to resolve

    if (isAuthenticated) {
      router.replace('/(tabs)' as any);
    } else {
      router.replace('/(auth)/lock' as any);
    }
  }, [isAuthenticated, isLoading, router]);

  // Show a centered spinner while the auth state loads (~50–100 ms on device)
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

