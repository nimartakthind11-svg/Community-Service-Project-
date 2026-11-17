import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { Question } from '../schema';
import {
  getQuestions,
  searchQuestions,
  saveQuestionFeedback,
  getAllQuestionFeedback,
  saveSuggestedQuestion,
} from '../repositories/questionsRepository';

export function useQuestions(topicSlug?: string) {
  const db = useSQLiteContext();
  const { i18n } = useTranslation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Map<number, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [data, feedback] = await Promise.all([
        getQuestions(db, topicSlug, i18n.language),
        getAllQuestionFeedback(db),
      ]);
      setQuestions(data);
      setFeedbackMap(feedback);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  }, [db, topicSlug, i18n.language]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [data, feedback] = await Promise.all([
          getQuestions(db, topicSlug, i18n.language),
          getAllQuestionFeedback(db),
        ]);
        if (isMounted) {
          setQuestions(data);
          setFeedbackMap(feedback);
        }
      } catch (err) {
        console.error('Failed to load questions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [db, topicSlug, i18n.language]);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await loadAll();
        return;
      }
      try {
        setLoading(true);
        const data = await searchQuestions(db, query, topicSlug, i18n.language);
        setQuestions(data);
      } catch (err) {
        console.error('Failed to search questions:', err);
      } finally {
        setLoading(false);
      }
    },
    [db, topicSlug, loadAll, i18n.language]
  );

  const submitFeedback = useCallback(
    async (questionId: number, isHelpful: boolean) => {
      try {
        await saveQuestionFeedback(db, questionId, isHelpful);
        setFeedbackMap((prev) => {
          const next = new Map(prev);
          next.set(questionId, isHelpful);
          return next;
        });
      } catch (err) {
        console.error('Failed to save question feedback:', err);
      }
    },
    [db]
  );

  const suggestQuestion = useCallback(
    async (text: string) => {
      await saveSuggestedQuestion(db, text, topicSlug);
    },
    [db, topicSlug]
  );

  return {
    questions,
    loading,
    feedbackMap,
    refreshQuestions: loadAll,
    search,
    submitFeedback,
    suggestQuestion,
  };
}
