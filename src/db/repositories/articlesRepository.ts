import { type SQLiteDatabase } from 'expo-sqlite';
import { Article } from '../schema';

export async function getArticlesByTopic(
  db: SQLiteDatabase,
  topicId: number
): Promise<Article[]> {
  return await db.getAllAsync<Article>(
    'SELECT * FROM articles WHERE topic_id = ? ORDER BY id ASC',
    topicId
  );
}

export async function getFeaturedArticle(
  db: SQLiteDatabase
): Promise<Article | null> {
  return await db.getFirstAsync<Article>(
    'SELECT * FROM articles ORDER BY id ASC LIMIT 1'
  );
}

export async function markArticleAsRead(
  db: SQLiteDatabase,
  articleId: number
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO article_reads (article_id, read_at) VALUES (?, ?)',
    articleId,
    now
  );
}

