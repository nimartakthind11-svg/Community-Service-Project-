import { type SQLiteDatabase } from 'expo-sqlite';
import { Question } from '../schema';

export async function getQuestions(
  db: SQLiteDatabase,
  topicSlug?: string
): Promise<Question[]> {
  if (topicSlug) {
    return await db.getAllAsync<Question>(
      'SELECT * FROM questions WHERE topic_slug = ? ORDER BY id ASC',
      topicSlug
    );
  }
  return await db.getAllAsync<Question>(
    'SELECT * FROM questions ORDER BY id ASC'
  );
}

export async function searchQuestions(
  db: SQLiteDatabase,
  query: string
): Promise<Question[]> {
  const wildcard = `%${query.trim()}%`;
  return await db.getAllAsync<Question>(
    'SELECT * FROM questions WHERE question LIKE ? OR answer LIKE ? ORDER BY id ASC',
    wildcard,
    wildcard
  );
}

