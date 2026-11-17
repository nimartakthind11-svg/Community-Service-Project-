import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { Topic } from '../schema';
import {
  getTopicsByCategory,
  getTopicBySlug,
  incrementReadCount,
} from '../repositories/topicsRepository';

export function useTopics(category: 'learn' | 'ask' = 'learn') {
  const db = useSQLiteContext();
  const { i18n } = useTranslation();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTopics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTopicsByCategory(db, category, i18n.language);
      setTopics(data);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  }, [db, category, i18n.language]);

  useEffect(() => {
    let isMounted = true;
    getTopicsByCategory(db, category, i18n.language)
      .then((data) => {
        if (isMounted) {
          setTopics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load topics:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [db, category, i18n.language]);

  const markTopicRead = useCallback(
    async (topicId: number) => {
      await incrementReadCount(db, topicId);
      await refreshTopics();
    },
    [db, refreshTopics]
  );

  return { topics, loading, refreshTopics, markTopicRead };
}

export function useTopicDetail(slug: string) {
  const db = useSQLiteContext();
  const { i18n } = useTranslation();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getTopicBySlug(db, slug, i18n.language);
        if (isMounted) setTopic(data);
      } catch (err) {
        console.error('Failed to load topic detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [db, slug, i18n.language]);

  return { topic, loading };
}
