import { type SQLiteDatabase } from 'expo-sqlite';
import i18next from '../../i18n';
import { extractSnippet } from '@/lib/searchUtils';

export interface SearchResultItem {
  id: number;
  type: 'article' | 'topic' | 'myth';
  title: string;
  subtitle?: string;
  snippet: string;
  badgeText: string;
  source?: string;
  slug?: string;
  articleId?: number;
}

export async function searchOfflineContent(
  db: SQLiteDatabase,
  query: string,
  lang: string = i18next?.language || 'en'
): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const param = `%${trimmed}%`;
  const results: SearchResultItem[] = [];

  // 1. Search Articles
  try {
    const isHindi = lang === 'hi';
    const selectCols = isHindi
      ? `id, topic_id, read_minutes, source,
         COALESCE(NULLIF(title_hi, ''), title) AS title,
         COALESCE(NULLIF(body_hi, ''), body) AS body`
      : `id, topic_id, read_minutes, source, title, body`;

    const matchedArticles = await db.getAllAsync<{
      id: number;
      topic_id: number;
      title: string;
      body: string;
      read_minutes: number;
      source: string;
    }>(
      `SELECT ${selectCols}
       FROM articles
       WHERE title LIKE ? OR body LIKE ? OR title_hi LIKE ? OR body_hi LIKE ?
       LIMIT 10`,
      param,
      param,
      param,
      param
    );

    for (const art of matchedArticles) {
      results.push({
        id: art.id,
        type: 'article',
        title: art.title,
        snippet: extractSnippet(art.body, trimmed, 90),
        badgeText: `${art.read_minutes} min`,
        source: art.source,
        articleId: art.id,
      });
    }
  } catch (err) {
    console.warn('Error searching articles:', err);
  }

  // 2. Search Topics (Learn category)
  try {
    const isHindi = lang === 'hi';
    const selectCols = isHindi
      ? `id, slug, read_count,
         COALESCE(NULLIF(title_hi, ''), title) AS title,
         COALESCE(NULLIF(subtitle_hi, ''), subtitle) AS subtitle`
      : `id, slug, title, subtitle, read_count`;

    const matchedTopics = await db.getAllAsync<{
      id: number;
      slug: string;
      title: string;
      subtitle: string;
      read_count: number;
    }>(
      `SELECT ${selectCols}
       FROM topics
       WHERE category = 'learn' AND (title LIKE ? OR subtitle LIKE ? OR title_hi LIKE ? OR subtitle_hi LIKE ?)
       LIMIT 5`,
      param,
      param,
      param,
      param
    );

    for (const top of matchedTopics) {
      results.push({
        id: top.id,
        type: 'topic',
        title: top.title,
        subtitle: top.subtitle,
        snippet: extractSnippet(top.subtitle, trimmed, 90),
        badgeText: `${top.read_count} reads`,
        slug: top.slug,
      });
    }
  } catch (err) {
    console.warn('Error searching topics:', err);
  }

  // 3. Search Myths vs Facts
  try {
    const isHindi = lang === 'hi';
    const selectCols = isHindi
      ? `id, topic_id, source,
         COALESCE(NULLIF(myth_hi, ''), myth) AS myth,
         COALESCE(NULLIF(fact_hi, ''), fact) AS fact`
      : `id, topic_id, myth, fact, source`;

    const matchedMyths = await db.getAllAsync<{
      id: number;
      topic_id: number;
      myth: string;
      fact: string;
      source: string;
    }>(
      `SELECT ${selectCols}
       FROM myths
       WHERE myth LIKE ? OR fact LIKE ? OR myth_hi LIKE ? OR fact_hi LIKE ?
       LIMIT 5`,
      param,
      param,
      param,
      param
    );

    for (const myth of matchedMyths) {
      results.push({
        id: myth.id,
        type: 'myth',
        title: myth.myth,
        subtitle: myth.fact,
        snippet: extractSnippet(myth.fact, trimmed, 90),
        badgeText: 'Myth vs Fact',
        source: myth.source,
        slug: 'myths-vs-facts',
      });
    }
  } catch (err) {
    console.warn('Error searching myths:', err);
  }

  return results;
}

