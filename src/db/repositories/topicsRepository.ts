import { type SQLiteDatabase } from 'expo-sqlite';
import i18next from '../../i18n';
import { Topic } from '../schema';

export async function getTopicsByCategory(
  db: SQLiteDatabase,
  category: 'learn' | 'ask' = 'learn',
  lang: string = i18next?.language || 'en'
): Promise<Topic[]> {
  if (lang === 'hi') {
    return await db.getAllAsync<Topic>(
      `SELECT id, slug, icon, read_count, category,
              COALESCE(NULLIF(title_hi, ''), title) AS title,
              COALESCE(NULLIF(subtitle_hi, ''), subtitle) AS subtitle,
              title_hi, subtitle_hi
       FROM topics WHERE category = ? ORDER BY id ASC`,
      category
    );
  }
  return await db.getAllAsync<Topic>(
    'SELECT * FROM topics WHERE category = ? ORDER BY id ASC',
    category
  );
}

export async function getTopicBySlug(
  db: SQLiteDatabase,
  slug: string,
  lang: string = i18next?.language || 'en'
): Promise<Topic | null> {
  if (lang === 'hi') {
    return await db.getFirstAsync<Topic>(
      `SELECT id, slug, icon, read_count, category,
              COALESCE(NULLIF(title_hi, ''), title) AS title,
              COALESCE(NULLIF(subtitle_hi, ''), subtitle) AS subtitle,
              title_hi, subtitle_hi
       FROM topics WHERE slug = ?`,
      slug
    );
  }
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

