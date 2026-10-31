import { type SQLiteDatabase } from 'expo-sqlite';
import { Setting } from '../schema';

export async function getSetting(
  db: SQLiteDatabase,
  key: string,
  defaultValue: string = ''
): Promise<string> {
  const row = await db.getFirstAsync<Setting>(
    'SELECT * FROM settings WHERE key = ?',
    key
  );
  return row ? row.value : defaultValue;
}

export async function setSetting(
  db: SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    key,
    value
  );
}

export async function getAllSettings(
  db: SQLiteDatabase
): Promise<Record<string, string>> {
  const rows = await db.getAllAsync<Setting>('SELECT * FROM settings');
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

