import { type SQLiteDatabase } from 'expo-sqlite';
import i18next from '../../i18n';
import { Article, ArticleRead } from '../schema';

export async function getArticlesByTopic(
  db: SQLiteDatabase,
  topicId: number,
  lang: string = i18next?.language || 'en'
): Promise<Article[]> {
  if (lang === 'hi') {
    return await db.getAllAsync<Article>(
      `SELECT id, topic_id, read_minutes, source,
              COALESCE(NULLIF(title_hi, ''), title) AS title,
              COALESCE(NULLIF(body_hi, ''), body) AS body,
              title_hi, body_hi
       FROM articles WHERE topic_id = ? ORDER BY id ASC`,
      topicId
    );
  }
  return await db.getAllAsync<Article>(
    'SELECT * FROM articles WHERE topic_id = ? ORDER BY id ASC',
    topicId
  );
}

export async function getArticlesByTopicSlug(
  db: SQLiteDatabase,
  slug: string,
  lang: string = i18next?.language || 'en'
): Promise<Article[]> {
  if (lang === 'hi') {
    return await db.getAllAsync<Article>(
      `SELECT a.id, a.topic_id, a.read_minutes, a.source,
              COALESCE(NULLIF(a.title_hi, ''), a.title) AS title,
              COALESCE(NULLIF(a.body_hi, ''), a.body) AS body,
              a.title_hi, a.body_hi
       FROM articles a
       INNER JOIN topics t ON a.topic_id = t.id
       WHERE t.slug = ?
       ORDER BY a.id ASC`,
      slug
    );
  }
  return await db.getAllAsync<Article>(
    `SELECT a.* FROM articles a
     INNER JOIN topics t ON a.topic_id = t.id
     WHERE t.slug = ?
     ORDER BY a.id ASC`,
    slug
  );
}

export async function getArticleById(
  db: SQLiteDatabase,
  id: number,
  lang: string = i18next?.language || 'en'
): Promise<Article | null> {
  if (lang === 'hi') {
    return await db.getFirstAsync<Article>(
      `SELECT id, topic_id, read_minutes, source,
              COALESCE(NULLIF(title_hi, ''), title) AS title,
              COALESCE(NULLIF(body_hi, ''), body) AS body,
              title_hi, body_hi
       FROM articles WHERE id = ?`,
      id
    );
  }
  return await db.getFirstAsync<Article>(
    'SELECT * FROM articles WHERE id = ?',
    id
  );
}

export async function getFeaturedArticle(
  db: SQLiteDatabase,
  lang: string = i18next?.language || 'en'
): Promise<Article | null> {
  if (lang === 'hi') {
    const firstPeriodArticle = await db.getFirstAsync<Article>(
      `SELECT a.id, a.topic_id, a.read_minutes, a.source,
              COALESCE(NULLIF(a.title_hi, ''), a.title) AS title,
              COALESCE(NULLIF(a.body_hi, ''), a.body) AS body,
              a.title_hi, a.body_hi
       FROM articles a
       INNER JOIN topics t ON a.topic_id = t.id
       WHERE t.slug = 'first-period'
       ORDER BY a.id ASC LIMIT 1`
    );
    if (firstPeriodArticle) return firstPeriodArticle;

    return await db.getFirstAsync<Article>(
      `SELECT id, topic_id, read_minutes, source,
              COALESCE(NULLIF(title_hi, ''), title) AS title,
              COALESCE(NULLIF(body_hi, ''), body) AS body,
              title_hi, body_hi
       FROM articles ORDER BY id ASC LIMIT 1`
    );
  }

  // Return "Your first period, without the guesswork" or first article
  const firstPeriodArticle = await db.getFirstAsync<Article>(
    `SELECT a.* FROM articles a
     INNER JOIN topics t ON a.topic_id = t.id
     WHERE t.slug = 'first-period'
     ORDER BY a.id ASC LIMIT 1`
  );
  if (firstPeriodArticle) return firstPeriodArticle;

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

export async function isArticleRead(
  db: SQLiteDatabase,
  articleId: number
): Promise<boolean> {
  const row = await db.getFirstAsync<ArticleRead>(
    'SELECT id FROM article_reads WHERE article_id = ? LIMIT 1',
    articleId
  );
  return !!row;
}

export async function getReadArticleIds(
  db: SQLiteDatabase
): Promise<Set<number>> {
  const rows = await db.getAllAsync<{ article_id: number }>(
    'SELECT DISTINCT article_id FROM article_reads'
  );
  return new Set(rows.map((r) => r.article_id));
}
