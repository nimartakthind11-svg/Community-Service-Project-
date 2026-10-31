import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Question } from '../schema';
import { getQuestions, searchQuestions } from '../repositories/questionsRepository';

export function useQuestions(topicSlug?: string) {
  const db = useSQLiteContext();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getQuestions(db, topicSlug);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  }, [db, topicSlug]);

  useEffect(() => {
    let isMounted = true;
    getQuestions(db, topicSlug)
      .then((data) => {
        if (isMounted) {
          setQuestions(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load questions:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [db, topicSlug]);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await refreshQuestions();
        return;
      }
      try {
        setLoading(true);
        const data = await searchQuestions(db, query);
        setQuestions(data);
      } catch (err) {
        console.error('Failed to search questions:', err);
      } finally {
        setLoading(false);
      }
    },
    [db, refreshQuestions]
  );

  return { questions, loading, refreshQuestions, search };
}
