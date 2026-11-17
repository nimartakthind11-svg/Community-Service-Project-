import { type SQLiteDatabase } from 'expo-sqlite';
import i18next from '../../i18n';
import { Question, SuggestedQuestion } from '../schema';

export async function getQuestions(
  db: SQLiteDatabase,
  topicSlug?: string,
  lang: string = i18next?.language || 'en'
): Promise<Question[]> {
  const selectCols =
    lang === 'hi'
      ? `id, topic_id, topic_slug, source, is_concerning,
         COALESCE(NULLIF(question_hi, ''), question) AS question,
         COALESCE(NULLIF(answer_hi, ''), answer) AS answer,
         question_hi, answer_hi`
      : '*';

  if (topicSlug && topicSlug !== 'all') {
    // If filtering by hygiene, match both 'hygiene' and 'hygiene-ask'
    if (topicSlug === 'hygiene' || topicSlug === 'hygiene-ask') {
      return await db.getAllAsync<Question>(
        `SELECT ${selectCols} FROM questions WHERE topic_slug = 'hygiene' OR topic_slug = 'hygiene-ask' ORDER BY id ASC`
      );
    }
    return await db.getAllAsync<Question>(
      `SELECT ${selectCols} FROM questions WHERE topic_slug = ? ORDER BY id ASC`,
      topicSlug
    );
  }
  return await db.getAllAsync<Question>(
    `SELECT ${selectCols} FROM questions ORDER BY id ASC`
  );
}

export async function searchQuestions(
  db: SQLiteDatabase,
  query: string,
  topicSlug?: string,
  lang: string = i18next?.language || 'en'
): Promise<Question[]> {
  const wildcard = `%${query.trim()}%`;
  const selectCols =
    lang === 'hi'
      ? `id, topic_id, topic_slug, source, is_concerning,
         COALESCE(NULLIF(question_hi, ''), question) AS question,
         COALESCE(NULLIF(answer_hi, ''), answer) AS answer,
         question_hi, answer_hi`
      : '*';

  const matchCondition =
    `(question LIKE ? OR answer LIKE ? OR question_hi LIKE ? OR answer_hi LIKE ?)`;

  if (topicSlug && topicSlug !== 'all') {
    if (topicSlug === 'hygiene' || topicSlug === 'hygiene-ask') {
      return await db.getAllAsync<Question>(
        `SELECT ${selectCols} FROM questions WHERE (topic_slug = 'hygiene' OR topic_slug = 'hygiene-ask') AND ${matchCondition} ORDER BY id ASC`,
        wildcard,
        wildcard,
        wildcard,
        wildcard
      );
    }
    return await db.getAllAsync<Question>(
      `SELECT ${selectCols} FROM questions WHERE topic_slug = ? AND ${matchCondition} ORDER BY id ASC`,
      topicSlug,
      wildcard,
      wildcard,
      wildcard,
      wildcard
    );
  }
  return await db.getAllAsync<Question>(
    `SELECT ${selectCols} FROM questions WHERE ${matchCondition} ORDER BY id ASC`,
    wildcard,
    wildcard,
    wildcard,
    wildcard
  );
}

export async function getRelatedQuestions(
  db: SQLiteDatabase,
  questionId: number,
  topicSlug?: string,
  limit = 3,
  lang: string = i18next?.language || 'en'
): Promise<Question[]> {
  const selectCols =
    lang === 'hi'
      ? `id, topic_id, topic_slug, source, is_concerning,
         COALESCE(NULLIF(question_hi, ''), question) AS question,
         COALESCE(NULLIF(answer_hi, ''), answer) AS answer,
         question_hi, answer_hi`
      : '*';

  if (topicSlug) {
    if (topicSlug === 'hygiene' || topicSlug === 'hygiene-ask') {
      return await db.getAllAsync<Question>(
        `SELECT ${selectCols} FROM questions WHERE id != ? AND (topic_slug = 'hygiene' OR topic_slug = 'hygiene-ask') ORDER BY id ASC LIMIT ?`,
        questionId,
        limit
      );
    }
    return await db.getAllAsync<Question>(
      `SELECT ${selectCols} FROM questions WHERE id != ? AND topic_slug = ? ORDER BY id ASC LIMIT ?`,
      questionId,
      topicSlug,
      limit
    );
  }
  return await db.getAllAsync<Question>(
    `SELECT ${selectCols} FROM questions WHERE id != ? ORDER BY id ASC LIMIT ?`,
    questionId,
    limit
  );
}

export async function saveSuggestedQuestion(
  db: SQLiteDatabase,
  question: string,
  topicSlug?: string | null
): Promise<void> {
  await db.runAsync(
    'INSERT INTO suggested_questions (question, topic_slug, created_at) VALUES (?, ?, ?)',
    question.trim(),
    topicSlug ?? null,
    new Date().toISOString()
  );
}

export async function getSuggestedQuestions(
  db: SQLiteDatabase
): Promise<SuggestedQuestion[]> {
  try {
    return await db.getAllAsync<SuggestedQuestion>(
      'SELECT * FROM suggested_questions ORDER BY id DESC'
    );
  } catch {
    return [];
  }
}

export async function saveQuestionFeedback(
  db: SQLiteDatabase,
  questionId: number,
  isHelpful: boolean
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO question_feedback (question_id, is_helpful, created_at) VALUES (?, ?, ?)',
    questionId,
    isHelpful ? 1 : 0,
    new Date().toISOString()
  );
}

export async function getQuestionFeedback(
  db: SQLiteDatabase,
  questionId: number
): Promise<boolean | null> {
  try {
    const row = await db.getFirstAsync<{ is_helpful: number }>(
      'SELECT is_helpful FROM question_feedback WHERE question_id = ?',
      questionId
    );
    if (!row) return null;
    return row.is_helpful === 1;
  } catch {
    return null;
  }
}

export async function getAllQuestionFeedback(
  db: SQLiteDatabase
): Promise<Map<number, boolean>> {
  try {
    const rows = await db.getAllAsync<{ question_id: number; is_helpful: number }>(
      'SELECT question_id, is_helpful FROM question_feedback'
    );
    const map = new Map<number, boolean>();
    for (const r of rows) {
      map.set(r.question_id, r.is_helpful === 1);
    }
    return map;
  } catch {
    return new Map();
  }
}
