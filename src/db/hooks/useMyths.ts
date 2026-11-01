import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { getAllMyths } from '../repositories/mythsRepository';
import { Myth } from '../schema';

export function useMyths() {
  const db = useSQLiteContext();
  const [myths, setMyths] = useState<Myth[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshMyths = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllMyths(db);
      setMyths(data);
    } catch (err) {
      console.error('Failed to load myths:', err);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    let isMounted = true;
    getAllMyths(db)
      .then((data) => {
        if (isMounted) {
          setMyths(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load myths:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [db]);

  return { myths, loading, refreshMyths };
}
