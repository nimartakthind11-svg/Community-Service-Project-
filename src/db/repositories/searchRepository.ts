import { type SQLiteDatabase } from 'expo-sqlite';
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
  query: string
): Promise<SearchResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const param = `%${trimmed}%`;
  const results: SearchResultItem[] = [];

  // 1. Search Articles
  try {
    const matchedArticles = await db.getAllAsync<{
      id: number;
      topic_id: number;
      title: string;
      body: string;
      read_minutes: number;
      source: string;
    }>(
      `SELECT id, topic_id, title, body, read_minutes, source
       FROM articles
       WHERE title LIKE ? OR body LIKE ?
       LIMIT 10`,
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
    const matchedTopics = await db.getAllAsync<{
      id: number;
      slug: string;
      title: string;
      subtitle: string;
      read_count: number;
    }>(
      `SELECT id, slug, title, subtitle, read_count
       FROM topics
       WHERE category = 'learn' AND (title LIKE ? OR subtitle LIKE ?)
       LIMIT 5`,
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
    const matchedMyths = await db.getAllAsync<{
      id: number;
      topic_id: number;
      myth: string;
      fact: string;
      source: string;
    }>(
      `SELECT id, topic_id, myth, fact, source
       FROM myths
       WHERE myth LIKE ? OR fact LIKE ?
       LIMIT 5`,
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

