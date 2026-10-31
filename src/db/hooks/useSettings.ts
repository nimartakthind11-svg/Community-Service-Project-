import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getAllSettings, setSetting } from '../repositories/settingsRepository';

export function useSettings() {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllSettings(db);
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    let isMounted = true;
    getAllSettings(db)
      .then((data) => {
        if (isMounted) {
          setSettings(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [db]);

  const updateSetting = useCallback(
    async (key: string, value: string) => {
      await setSetting(db, key, value);
      await refreshSettings();
    },
    [db, refreshSettings]
  );

  return { settings, loading, refreshSettings, updateSetting };
}
