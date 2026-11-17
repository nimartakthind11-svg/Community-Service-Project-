import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getMythsByTopicSlug,
  getViewedMythIds,
  markMythAsViewed,
  clearAllMythViews,
} from '../repositories/mythsRepository';
import { MythWithTopic } from '../schema';

export function useMyths(topicSlug?: string | null) {
  const db = useSQLiteContext();
  const { i18n } = useTranslation();
  const [myths, setMyths] = useState<MythWithTopic[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [data, views] = await Promise.all([
        getMythsByTopicSlug(db, topicSlug, i18n.language),
        getViewedMythIds(db),
      ]);
      setMyths(data);
      setViewedIds(views);
    } catch (err) {
      console.error('Failed to load myths:', err);
    } finally {
      setLoading(false);
    }
  }, [db, topicSlug, i18n.language]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [data, views] = await Promise.all([
          getMythsByTopicSlug(db, topicSlug, i18n.language),
          getViewedMythIds(db),
        ]);
        if (isMounted) {
          setMyths(data);
          setViewedIds(views);
        }
      } catch (err) {
        console.error('Failed to load myths:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [db, topicSlug, i18n.language]);

  const markViewed = useCallback(
    async (mythId: number) => {
      try {
        await markMythAsViewed(db, mythId);
        setViewedIds((prev) => {
          const next = new Set(prev);
          next.add(mythId);
          return next;
        });
      } catch (err) {
        console.error('Failed to mark myth viewed:', err);
      }
    },
    [db]
  );

  const resetViews = useCallback(async () => {
    try {
      await clearAllMythViews(db);
      setViewedIds(new Set());
    } catch (err) {
      console.error('Failed to clear myth views:', err);
    }
  }, [db]);

  return {
    myths,
    viewedIds,
    loading,
    refreshMyths: loadData,
    markViewed,
    resetViews,
  };
}
