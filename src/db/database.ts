import { type SQLiteDatabase } from 'expo-sqlite';
import {
  SEED_TOPICS,
  SEED_ARTICLES,
  SEED_MYTHS,
  SEED_QUESTIONS,
  SEED_PERIOD_LOGS,
  SEED_SETTINGS,
} from './seedData';

export const DATABASE_NAME = 'sakhi.db';

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // 1. Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS period_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT NOT NULL,
      end_date TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      icon TEXT NOT NULL,
      read_count INTEGER NOT NULL DEFAULT 0,
      category TEXT DEFAULT 'general'
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      read_minutes INTEGER NOT NULL DEFAULT 3,
      source TEXT NOT NULL,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS myths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER,
      myth TEXT NOT NULL,
      fact TEXT NOT NULL,
      source TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER,
      topic_slug TEXT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      source TEXT NOT NULL,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS article_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      read_at TEXT NOT NULL,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );
  `);

  // 2. Check if already seeded
  const existingTopics = await db.getAllAsync<{ id: number }>('SELECT id FROM topics LIMIT 1');
  if (existingTopics.length === 0) {
    // Seed Topics
    for (const t of SEED_TOPICS) {
      await db.runAsync(
        'INSERT OR IGNORE INTO topics (slug, title, subtitle, icon, read_count, category) VALUES (?, ?, ?, ?, ?, ?)',
        t.slug,
        t.title,
        t.subtitle,
        t.icon,
        t.read_count,
        t.category
      );
    }

    // Seed Articles
    for (const a of SEED_ARTICLES) {
      const topic = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM topics WHERE slug = ?',
        a.topic_slug
      );
      if (topic) {
        await db.runAsync(
          'INSERT INTO articles (topic_id, title, body, read_minutes, source) VALUES (?, ?, ?, ?, ?)',
          topic.id,
          a.title,
          a.body,
          a.read_minutes,
          a.source
        );
      }
    }

    // Seed Myths
    for (const m of SEED_MYTHS) {
      const topic = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM topics WHERE slug = ?',
        m.topic_slug
      );
      await db.runAsync(
        'INSERT INTO myths (topic_id, myth, fact, source, position) VALUES (?, ?, ?, ?, ?)',
        topic?.id ?? null,
        m.myth,
        m.fact,
        m.source,
        m.position
      );
    }

    // Seed Questions
    for (const q of SEED_QUESTIONS) {
      const topic = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM topics WHERE slug = ?',
        q.topic_slug
      );
      await db.runAsync(
        'INSERT INTO questions (topic_id, topic_slug, question, answer, source) VALUES (?, ?, ?, ?, ?)',
        topic?.id ?? null,
        q.topic_slug,
        q.question,
        q.answer,
        q.source
      );
    }

    // Seed Period Logs
    for (const p of SEED_PERIOD_LOGS) {
      await db.runAsync(
        'INSERT INTO period_logs (start_date, end_date) VALUES (?, ?)',
        p.start_date,
        p.end_date
      );
    }

    // Seed Settings
    for (const s of SEED_SETTINGS) {
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        s.key,
        s.value
      );
    }
  }
}

