import { type SQLiteDatabase } from 'expo-sqlite';
import i18next from '../i18n';
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
      title_hi TEXT,
      subtitle_hi TEXT,
      icon TEXT NOT NULL,
      read_count INTEGER NOT NULL DEFAULT 0,
      category TEXT DEFAULT 'general'
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      title_hi TEXT,
      body_hi TEXT,
      read_minutes INTEGER NOT NULL DEFAULT 3,
      source TEXT NOT NULL,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS myths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER,
      myth TEXT NOT NULL,
      fact TEXT NOT NULL,
      myth_hi TEXT,
      fact_hi TEXT,
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
      question_hi TEXT,
      answer_hi TEXT,
      source TEXT NOT NULL,
      is_concerning INTEGER DEFAULT 0,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS article_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      read_at TEXT NOT NULL,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS myth_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      myth_id INTEGER UNIQUE NOT NULL,
      viewed_at TEXT NOT NULL,
      FOREIGN KEY (myth_id) REFERENCES myths(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS suggested_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      topic_slug TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS question_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL UNIQUE,
      is_helpful INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `);

  // 2. Migration for existing DBs: ensure localized columns exist
  try {
    await db.execAsync('ALTER TABLE topics ADD COLUMN title_hi TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE topics ADD COLUMN subtitle_hi TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE articles ADD COLUMN title_hi TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE articles ADD COLUMN body_hi TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE myths ADD COLUMN myth_hi TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE myths ADD COLUMN fact_hi TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE questions ADD COLUMN question_hi TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE questions ADD COLUMN answer_hi TEXT;');
  } catch {}

  // 3. Check if already seeded
  const existingTopics = await db.getAllAsync<{ id: number }>('SELECT id FROM topics LIMIT 1');
  if (existingTopics.length === 0) {
    // Seed Topics
    for (const t of SEED_TOPICS) {
      await db.runAsync(
        'INSERT OR IGNORE INTO topics (slug, title, subtitle, title_hi, subtitle_hi, icon, read_count, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        t.slug,
        t.title,
        t.subtitle,
        t.title_hi ?? null,
        t.subtitle_hi ?? null,
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
          'INSERT INTO articles (topic_id, title, body, title_hi, body_hi, read_minutes, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
          topic.id,
          a.title,
          a.body,
          a.title_hi ?? null,
          a.body_hi ?? null,
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
        'INSERT INTO myths (topic_id, myth, fact, myth_hi, fact_hi, source, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
        topic?.id ?? null,
        m.myth,
        m.fact,
        m.myth_hi ?? null,
        m.fact_hi ?? null,
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
        'INSERT INTO questions (topic_id, topic_slug, question, answer, question_hi, answer_hi, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
        topic?.id ?? null,
        q.topic_slug,
        q.question,
        q.answer,
        q.question_hi ?? null,
        q.answer_hi ?? null,
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

  // Ensure all seed articles exist and update Hindi localized fields
  for (const a of SEED_ARTICLES) {
    const topic = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM topics WHERE slug = ?',
      a.topic_slug
    );
    if (topic) {
      const existing = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM articles WHERE title = ?',
        a.title
      );
      if (!existing) {
        await db.runAsync(
          'INSERT INTO articles (topic_id, title, body, title_hi, body_hi, read_minutes, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
          topic.id,
          a.title,
          a.body,
          a.title_hi ?? null,
          a.body_hi ?? null,
          a.read_minutes,
          a.source
        );
      } else {
        await db.runAsync(
          'UPDATE articles SET title_hi = ?, body_hi = ? WHERE id = ?',
          a.title_hi ?? null,
          a.body_hi ?? null,
          existing.id
        );
      }
    }
  }

  // Ensure all seed topics exist and update Hindi localized fields
  for (const t of SEED_TOPICS) {
    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM topics WHERE slug = ?',
      t.slug
    );
    if (!existing) {
      await db.runAsync(
        'INSERT OR IGNORE INTO topics (slug, title, subtitle, title_hi, subtitle_hi, icon, read_count, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        t.slug,
        t.title,
        t.subtitle,
        t.title_hi ?? null,
        t.subtitle_hi ?? null,
        t.icon,
        t.read_count,
        t.category
      );
    } else {
      await db.runAsync(
        'UPDATE topics SET title_hi = ?, subtitle_hi = ? WHERE id = ?',
        t.title_hi ?? null,
        t.subtitle_hi ?? null,
        existing.id
      );
    }
  }

  // Ensure all seed myths exist and update Hindi localized fields
  for (const m of SEED_MYTHS) {
    const topic = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM topics WHERE slug = ?',
      m.topic_slug
    );
    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM myths WHERE myth = ?',
      m.myth
    );
    if (existing) {
      await db.runAsync(
        'UPDATE myths SET topic_id = ?, position = ?, source = ?, fact = ?, myth_hi = ?, fact_hi = ? WHERE id = ?',
        topic?.id ?? null,
        m.position,
        m.source,
        m.fact,
        m.myth_hi ?? null,
        m.fact_hi ?? null,
        existing.id
      );
    } else {
      await db.runAsync(
        'INSERT INTO myths (topic_id, myth, fact, myth_hi, fact_hi, source, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
        topic?.id ?? null,
        m.myth,
        m.fact,
        m.myth_hi ?? null,
        m.fact_hi ?? null,
        m.source,
        m.position
      );
    }
  }

  // Ensure is_concerning column exists in questions for existing DBs
  try {
    await db.execAsync('ALTER TABLE questions ADD COLUMN is_concerning INTEGER DEFAULT 0;');
  } catch {
    // Column already exists
  }

  // Ensure suggested_questions and question_feedback tables exist for existing DBs
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS suggested_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      topic_slug TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS question_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL UNIQUE,
      is_helpful INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `);

  // Ensure all seed questions exist and carry clinical sources, concern tags, and Hindi content
  for (const q of SEED_QUESTIONS) {
    const topic = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM topics WHERE slug = ?',
      q.topic_slug
    );
    const existing = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM questions WHERE question = ?',
      q.question
    );
    if (existing) {
      await db.runAsync(
        'UPDATE questions SET topic_id = ?, topic_slug = ?, answer = ?, source = ?, is_concerning = ?, question_hi = ?, answer_hi = ? WHERE id = ?',
        topic?.id ?? null,
        q.topic_slug,
        q.answer,
        q.source,
        (q as any).is_concerning ?? 0,
        q.question_hi ?? null,
        q.answer_hi ?? null,
        existing.id
      );
    } else {
      await db.runAsync(
        'INSERT INTO questions (topic_id, topic_slug, question, answer, question_hi, answer_hi, source, is_concerning) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        topic?.id ?? null,
        q.topic_slug,
        q.question,
        q.answer,
        q.question_hi ?? null,
        q.answer_hi ?? null,
        q.source,
        (q as any).is_concerning ?? 0
      );
    }
  }

  // Restore persisted language on launch
  try {
    const langSetting = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'language' LIMIT 1"
    );
    if (langSetting?.value && (langSetting.value === 'en' || langSetting.value === 'hi')) {
      if (i18next.language !== langSetting.value) {
        await i18next.changeLanguage(langSetting.value);
      }
    }
  } catch (err) {
    console.error('Failed to restore language setting:', err);
  }
}

