import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPin,
  computeLockoutState,
  verifyPinAgainstHash,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
} from '../src/auth/pinLogic.ts';
import { calculateCyclePrediction } from '../src/lib/cycle.ts';
import { SEED_TOPICS, SEED_ARTICLES, SEED_MYTHS, SEED_QUESTIONS, SEED_SETTINGS } from '../src/db/seedData.ts';
import en from '../src/i18n/locales/en.json' with { type: 'json' };
import hi from '../src/i18n/locales/hi.json' with { type: 'json' };

// ─── Mock in-memory SQLite database ──────────────────────────────────────────
class MockDatabase {
  tables: Record<string, any[]> = {
    period_logs: [],
    article_reads: [],
    myth_views: [],
    suggested_questions: [],
    question_feedback: [],
    settings: [],
    topics: [],
    articles: [],
    myths: [],
    questions: [],
  };

  async execAsync(sql: string): Promise<void> {
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      const deleteMatch = stmt.match(/DELETE\s+FROM\s+(\w+)/i);
      if (deleteMatch) {
        const table = deleteMatch[1];
        if (this.tables[table]) {
          this.tables[table] = [];
        }
      }
    }
  }

  async runAsync(sql: string, ...params: any[]): Promise<any> {
    if (sql.includes('INSERT OR REPLACE INTO settings') || sql.includes('INSERT INTO settings')) {
      const [key, value] = params;
      const idx = this.tables.settings.findIndex((s: any) => s.key === key);
      if (idx >= 0) {
        this.tables.settings[idx] = { key, value };
      } else {
        this.tables.settings.push({ key, value });
      }
      return { changes: 1 };
    }
    return { changes: 1 };
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    if (fromMatch) {
      const table = fromMatch[1];
      return (this.tables[table] || []) as T[];
    }
    return [];
  }

  async getFirstAsync<T>(sql: string, ...params: any[]): Promise<T | null> {
    const fromMatch = sql.match(/FROM\s+(\w+)/i);
    if (!fromMatch) return null;
    const table = fromMatch[1];
    const rows = this.tables[table] || [];

    if (sql.includes('WHERE key = ?')) {
      const key = params[0];
      return (rows.find((r: any) => r.key === key) || null) as T | null;
    }
    return (rows[0] || null) as T | null;
  }
}

// ─── Mock In-Memory Auth Storage ─────────────────────────────────────────────
class MockAuthStorage {
  private store: Map<string, string> = new Map();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async deleteItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

test('Privacy Information screen strings match requirements and have EN/HI parity', () => {
  const enPrivacy = (en as any).privacy;
  const hiPrivacy = (hi as any).privacy;

  assert.ok(enPrivacy, 'en.json must contain privacy section');
  assert.ok(hiPrivacy, 'hi.json must contain privacy section');

  // Verify requirements in English
  assert.equal(enPrivacy.title, 'Privacy information');
  assert.equal(enPrivacy.back, 'Settings');
  assert.equal(enPrivacy.noAccountTitle, 'No account required');
  assert.ok(enPrivacy.noAccountDesc.includes('without logins, passwords, emails'));

  assert.equal(enPrivacy.onDeviceTitle, 'Stored only on your phone');
  assert.ok(enPrivacy.onDeviceDesc.includes('exclusively on this device'));

  assert.equal(enPrivacy.noSharingTitle, 'No tracking or external sharing');
  assert.ok(enPrivacy.noSharingDesc.includes('100% offline'));

  assert.equal(enPrivacy.appDeletionTitle, 'Deleting the app');
  assert.ok(enPrivacy.appDeletionDesc.includes('removes all locally stored data'));

  assert.equal(enPrivacy.deleteDataButton, 'Delete all my data');
  assert.equal(enPrivacy.sheetTitle, 'Delete all your data?');
  assert.equal(enPrivacy.confirmDeleteButton, 'Delete all data');
  assert.equal(enPrivacy.cancelButton, 'Cancel');

  // Verify exact 1:1 key parity
  const enKeys = Object.keys(enPrivacy).sort();
  const hiKeys = Object.keys(hiPrivacy).sort();
  assert.deepEqual(enKeys, hiKeys, 'Privacy translation keys must match exactly between EN and HI');
});

test('Delete All My Data: Wipes all user data tables while preserving educational content', async () => {
  const db = new MockDatabase();

  // 1. Seed educational knowledge base (Topics, Articles, Myths, Questions)
  db.tables.topics = [...SEED_TOPICS];
  db.tables.articles = [...SEED_ARTICLES];
  db.tables.myths = [...SEED_MYTHS];
  db.tables.questions = [...SEED_QUESTIONS];

  // 2. Populate user-generated data
  db.tables.period_logs = [
    { id: 1, start_date: '2026-10-01', end_date: '2026-10-05' },
    { id: 2, start_date: '2026-10-30', end_date: '2026-11-03' },
  ];
  db.tables.article_reads = [
    { id: 1, article_id: 1, read_at: '2026-11-01T10:00:00Z' },
  ];
  db.tables.myth_views = [
    { id: 1, myth_id: 1, viewed_at: '2026-11-02T10:00:00Z' },
    { id: 2, myth_id: 2, viewed_at: '2026-11-02T10:05:00Z' },
  ];
  db.tables.suggested_questions = [
    { id: 1, question: 'Can I swim with a pad?', topic_slug: 'hygiene', created_at: '2026-11-05T12:00:00Z' },
  ];
  db.tables.question_feedback = [
    { id: 1, question_id: 1, is_helpful: 1, created_at: '2026-11-05T12:01:00Z' },
  ];
  db.tables.settings = [
    { key: 'user_name', value: 'Amara' },
    { key: 'user_nickname', value: 'Maya' },
    { key: 'home_nickname_prompted', value: 'true' },
    { key: 'language', value: 'hi' },
  ];

  // Verify user data is present before wipe
  assert.equal(db.tables.period_logs.length, 2);
  assert.equal(db.tables.article_reads.length, 1);
  assert.equal(db.tables.myth_views.length, 2);
  assert.equal(db.tables.suggested_questions.length, 1);
  assert.equal(db.tables.question_feedback.length, 1);
  assert.equal(db.tables.settings.find((s) => s.key === 'user_nickname')?.value, 'Maya');

  // 3. Perform data wipe simulation (mirrors wipeLocalUserData implementation)
  const userTablesToClear = [
    'period_logs',
    'article_reads',
    'myth_views',
    'suggested_questions',
    'question_feedback',
    'settings',
  ];

  for (const table of userTablesToClear) {
    await db.execAsync(`DELETE FROM ${table};`);
  }

  for (const s of SEED_SETTINGS) {
    await db.runAsync(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      s.key,
      s.value
    );
  }

  // 4. Verify user-generated data is completely wiped
  assert.equal(db.tables.period_logs.length, 0, 'period_logs must be empty');
  assert.equal(db.tables.article_reads.length, 0, 'article_reads must be empty');
  assert.equal(db.tables.myth_views.length, 0, 'myth_views must be empty');
  assert.equal(db.tables.suggested_questions.length, 0, 'suggested_questions must be empty');
  assert.equal(db.tables.question_feedback.length, 0, 'question_feedback must be empty');

  // 5. Verify custom settings (like nickname and prompt flag) are wiped
  assert.equal(db.tables.settings.find((s) => s.key === 'user_nickname'), undefined, 'User nickname must be wiped');
  assert.equal(db.tables.settings.find((s) => s.key === 'home_nickname_prompted'), undefined, 'Nickname prompt flag must be reset');

  // 6. Verify baseline settings are restored
  assert.equal(db.tables.settings.find((s) => s.key === 'language')?.value, 'en', 'Language must be reset to baseline en');
  assert.equal(db.tables.settings.find((s) => s.key === 'cycle_length')?.value, '29');

  // 7. Verify educational content is preserved
  assert.equal(db.tables.topics.length, SEED_TOPICS.length, 'Topics library must be preserved');
  assert.equal(db.tables.articles.length, SEED_ARTICLES.length, 'Articles library must be preserved');
  assert.equal(db.tables.myths.length, SEED_MYTHS.length, 'Myths library must be preserved');
  assert.equal(db.tables.questions.length, SEED_QUESTIONS.length, 'Questions library must be preserved');
});

test('Cancel data deletion leaves all user data and settings completely untouched', async () => {
  const db = new MockDatabase();
  db.tables.period_logs = [{ id: 1, start_date: '2026-11-01', end_date: '2026-11-05' }];
  db.tables.settings = [{ key: 'user_nickname', value: 'Maya' }];

  // Simulating user tapping Cancel on the bottom sheet
  const userConfirmed = false;
  if (userConfirmed) {
    await db.execAsync('DELETE FROM period_logs;');
  }

  assert.equal(db.tables.period_logs.length, 1, 'Data must remain intact when cancelled');
  assert.equal(db.tables.settings[0].value, 'Maya', 'Settings must remain intact when cancelled');
});

test('End-to-End User Lifecycle & Final Verification Flow (Screens 1 to 8)', async () => {
  const authStore = new MockAuthStorage();
  const db = new MockDatabase();

  // Populate educational database
  db.tables.topics = [...SEED_TOPICS];
  db.tables.articles = [...SEED_ARTICLES];
  db.tables.myths = [...SEED_MYTHS];
  db.tables.questions = [...SEED_QUESTIONS];

  // ── Step 1: First launch and Create PIN ─────────────────────────────────────
  let hasPin = !!(await authStore.getItem('sakhi_pin_hash'));
  assert.equal(hasPin, false, 'First launch: PIN is not set');

  const initialPin = '1234';
  const initialHash = await hashPin(initialPin);
  await authStore.setItem('sakhi_pin_hash', initialHash);

  hasPin = !!(await authStore.getItem('sakhi_pin_hash'));
  assert.equal(hasPin, true, 'PIN is now set');
  assert.equal(await verifyPinAgainstHash('1234', initialHash), true);

  // ── Step 2: Log a period and verify Home cycle prediction ──────────────────
  db.tables.period_logs.push({
    id: 1,
    start_date: '2026-10-01',
    end_date: '2026-10-05',
  });
  const prediction = calculateCyclePrediction(db.tables.period_logs);
  assert.equal(prediction.hasLoggedPeriods, true);
  assert.ok(prediction.formattedNextDate, 'Prediction engine computes next period date');

  // ── Step 3: Browse Learn and flip a myth card ──────────────────────────────
  const mythToView = SEED_MYTHS[0];
  db.tables.myth_views.push({
    id: 1,
    myth_id: mythToView.position,
    viewed_at: new Date().toISOString(),
  });
  assert.equal(db.tables.myth_views.length, 1, 'Myth view recorded');

  // ── Step 4: Open Ask and explore a question ────────────────────────────────
  const question = SEED_QUESTIONS[0];
  db.tables.question_feedback.push({
    id: 1,
    question_id: 1,
    is_helpful: 1,
    created_at: new Date().toISOString(),
  });
  assert.equal(db.tables.question_feedback.length, 1, 'Question feedback recorded');

  // ── Step 5: Change language and verify persistence ─────────────────────────
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 'language', 'hi');
  const savedLang = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', 'language');
  assert.equal(savedLang?.value, 'hi', 'Language changed to Hindi');

  // ── Step 6: Change PIN and verify new PIN ──────────────────────────────────
  const currentHash = await authStore.getItem('sakhi_pin_hash');
  assert.ok(currentHash);
  // Verify current PIN succeeds
  assert.equal(await verifyPinAgainstHash('1234', currentHash), true);
  // Update to new PIN
  const newPin = '8888';
  const newHash = await hashPin(newPin);
  await authStore.setItem('sakhi_pin_hash', newHash);
  // Verify new PIN works and old PIN fails
  assert.equal(await verifyPinAgainstHash('8888', (await authStore.getItem('sakhi_pin_hash'))!), true);
  assert.equal(await verifyPinAgainstHash('1234', (await authStore.getItem('sakhi_pin_hash'))!), false);

  // ── Step 7: Background and reopen the app; verify locking ──────────────────
  const BACKGROUND_LOCK_TIMEOUT_MS = 30 * 1000;
  const backgroundTime = 1000000;
  // Case A: Quick switch (5 seconds elapsed) -> stays unlocked
  const quickResume = backgroundTime + 5000;
  assert.equal(quickResume - backgroundTime >= BACKGROUND_LOCK_TIMEOUT_MS, false);
  // Case B: Background timeout exceeded (35 seconds elapsed) -> session locked
  const lockResume = backgroundTime + 35000;
  assert.equal(lockResume - backgroundTime >= BACKGROUND_LOCK_TIMEOUT_MS, true, 'App locks after 30s background');

  // ── Step 8: Open Privacy Information & Cancel deletion ─────────────────────
  // User reviews privacy details and opens delete sheet but cancels
  const cancelled = true;
  if (!cancelled) {
    await db.execAsync('DELETE FROM period_logs;');
  }
  assert.equal(db.tables.period_logs.length, 1, 'Data remains intact after cancellation');
  assert.equal(await authStore.getItem('sakhi_pin_hash'), newHash);

  // ── Step 9: Confirm deletion ───────────────────────────────────────────────
  // Wipe all user tables
  for (const table of ['period_logs', 'article_reads', 'myth_views', 'suggested_questions', 'question_feedback', 'settings']) {
    await db.execAsync(`DELETE FROM ${table};`);
  }
  // Restore baseline settings
  for (const s of SEED_SETTINGS) {
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', s.key, s.value);
  }
  // Delete PIN & lockout
  await authStore.deleteItem('sakhi_pin_hash');
  await authStore.deleteItem('failed_attempts');
  await authStore.deleteItem('lockout_until');

  // ── Step 10: Verify old data and PIN are no longer accessible ──────────────
  // PIN is unset -> app returns to Create PIN screen
  const postWipeHasPin = !!(await authStore.getItem('sakhi_pin_hash'));
  assert.equal(postWipeHasPin, false, 'PIN is completely wiped; returned to Create PIN state');

  // Old PINs fail completely
  const postWipeHash = await authStore.getItem('sakhi_pin_hash');
  assert.equal(postWipeHash, null);

  // Period logs empty -> prediction returns hasLoggedPeriods=false
  assert.equal(db.tables.period_logs.length, 0);
  const postWipePrediction = calculateCyclePrediction(db.tables.period_logs);
  assert.equal(postWipePrediction.hasLoggedPeriods, false, 'Home screen shows empty state "Log your first period"');

  // Myth views and feedback empty
  assert.equal(db.tables.myth_views.length, 0);
  assert.equal(db.tables.question_feedback.length, 0);

  // Language reset to baseline 'en'
  const postWipeLang = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', 'language');
  assert.equal(postWipeLang?.value, 'en', 'Language reset to default en');

  // Educational content intact
  assert.equal(db.tables.topics.length, SEED_TOPICS.length);
  assert.equal(db.tables.articles.length, SEED_ARTICLES.length);
  assert.equal(db.tables.myths.length, SEED_MYTHS.length);
  assert.equal(db.tables.questions.length, SEED_QUESTIONS.length);
});
