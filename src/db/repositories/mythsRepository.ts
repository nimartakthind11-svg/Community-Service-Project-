import { type SQLiteDatabase } from 'expo-sqlite';
import { Myth } from '../schema';

export async function getAllMyths(db: SQLiteDatabase): Promise<Myth[]> {
  return await db.getAllAsync<Myth>(
    'SELECT * FROM myths ORDER BY position ASC, id ASC'
  );
}

export async function getMythById(
  db: SQLiteDatabase,
  id: number
): Promise<Myth | null> {
  return await db.getFirstAsync<Myth>(
    'SELECT * FROM myths WHERE id = ?',
    id
  );
}

