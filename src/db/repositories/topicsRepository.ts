import { type SQLiteDatabase } from 'expo-sqlite';
import { Topic } from '../schema';

export async function getTopicsByCategory(
  db: SQLiteDatabase,
  category: 'learn' | 'ask' = 'learn'
): Promise<Topic[]> {
  return await db.getAllAsync<Topic>(
    'SELECT * FROM topics WHERE category = ? ORDER BY id ASC',
    category
  );
}

export async function getTopicBySlug(
  db: SQLiteDatabase,
  slug: string
): Promise<Topic | null> {
  return await db.getFirstAsync<Topic>(
    'SELECT * FROM topics WHERE slug = ?',
    slug
  );
}

export async function incrementReadCount(
  db: SQLiteDatabase,
  topicId: number
): Promise<void> {
  await db.runAsync(
    'UPDATE topics SET read_count = read_count + 1 WHERE id = ?',
    topicId
  );
}

