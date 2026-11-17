import { type SQLiteDatabase } from 'expo-sqlite';
import i18next from '../../i18n';
import { Myth, MythWithTopic } from '../schema';

export async function getAllMyths(
  db: SQLiteDatabase,
  lang: string = i18next?.language || 'en'
): Promise<Myth[]> {
  if (lang === 'hi') {
    return await db.getAllAsync<Myth>(
      `SELECT id, topic_id, source, position,
              COALESCE(NULLIF(myth_hi, ''), myth) AS myth,
              COALESCE(NULLIF(fact_hi, ''), fact) AS fact,
              myth_hi, fact_hi
       FROM myths ORDER BY position ASC, id ASC`
    );
  }
  return await db.getAllAsync<Myth>(
    'SELECT * FROM myths ORDER BY position ASC, id ASC'
  );
}

export async function getMythById(
  db: SQLiteDatabase,
  id: number,
  lang: string = i18next?.language || 'en'
): Promise<Myth | null> {
  if (lang === 'hi') {
    return await db.getFirstAsync<Myth>(
      `SELECT id, topic_id, source, position,
              COALESCE(NULLIF(myth_hi, ''), myth) AS myth,
              COALESCE(NULLIF(fact_hi, ''), fact) AS fact,
              myth_hi, fact_hi
       FROM myths WHERE id = ?`,
      id
    );
  }
  return await db.getFirstAsync<Myth>(
    'SELECT * FROM myths WHERE id = ?',
    id
  );
}

export async function getAllMythsWithTopic(
  db: SQLiteDatabase,
  lang: string = i18next?.language || 'en'
): Promise<MythWithTopic[]> {
  if (lang === 'hi') {
    return await db.getAllAsync<MythWithTopic>(`
      SELECT m.id, m.topic_id, m.source, m.position,
             COALESCE(NULLIF(m.myth_hi, ''), m.myth) AS myth,
             COALESCE(NULLIF(m.fact_hi, ''), m.fact) AS fact,
             m.myth_hi, m.fact_hi,
             t.slug AS topic_slug,
             COALESCE(NULLIF(t.title_hi, ''), t.title) AS topic_title
      FROM myths m
      LEFT JOIN topics t ON m.topic_id = t.id
      ORDER BY m.position ASC, m.id ASC
    `);
  }
  return await db.getAllAsync<MythWithTopic>(`
    SELECT m.id, m.topic_id, m.myth, m.fact, m.source, m.position,
           t.slug AS topic_slug, t.title AS topic_title
    FROM myths m
    LEFT JOIN topics t ON m.topic_id = t.id
    ORDER BY m.position ASC, m.id ASC
  `);
}

export async function getMythsByTopicSlug(
  db: SQLiteDatabase,
  slug?: string | null,
  lang: string = i18next?.language || 'en'
): Promise<MythWithTopic[]> {
  if (!slug || slug === 'all') {
    return getAllMythsWithTopic(db, lang);
  }
  if (lang === 'hi') {
    return await db.getAllAsync<MythWithTopic>(`
      SELECT m.id, m.topic_id, m.source, m.position,
             COALESCE(NULLIF(m.myth_hi, ''), m.myth) AS myth,
             COALESCE(NULLIF(m.fact_hi, ''), m.fact) AS fact,
             m.myth_hi, m.fact_hi,
             t.slug AS topic_slug,
             COALESCE(NULLIF(t.title_hi, ''), t.title) AS topic_title
      FROM myths m
      INNER JOIN topics t ON m.topic_id = t.id
      WHERE t.slug = ?
      ORDER BY m.position ASC, m.id ASC
    `, slug);
  }
  return await db.getAllAsync<MythWithTopic>(`
    SELECT m.id, m.topic_id, m.myth, m.fact, m.source, m.position,
           t.slug AS topic_slug, t.title AS topic_title
    FROM myths m
    INNER JOIN topics t ON m.topic_id = t.id
    WHERE t.slug = ?
    ORDER BY m.position ASC, m.id ASC
  `, slug);
}

export async function markMythAsViewed(
  db: SQLiteDatabase,
  mythId: number
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO myth_views (myth_id, viewed_at) VALUES (?, ?)',
    mythId,
    new Date().toISOString()
  );
}

export async function getViewedMythIds(
  db: SQLiteDatabase
): Promise<Set<number>> {
  try {
    const rows = await db.getAllAsync<{ myth_id: number }>(
      'SELECT myth_id FROM myth_views'
    );
    return new Set(rows.map((r) => r.myth_id));
  } catch {
    return new Set();
  }
}

export async function clearAllMythViews(
  db: SQLiteDatabase
): Promise<void> {
  try {
    await db.runAsync('DELETE FROM myth_views');
  } catch {
    // Graceful fallback
  }
}
