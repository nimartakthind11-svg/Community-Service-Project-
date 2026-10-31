import { type SQLiteDatabase } from 'expo-sqlite';
import { PeriodLog } from '../schema';

export async function getAllPeriodLogs(db: SQLiteDatabase): Promise<PeriodLog[]> {
  return await db.getAllAsync<PeriodLog>(
    'SELECT * FROM period_logs ORDER BY date(start_date) DESC'
  );
}

export async function getLatestPeriodLog(db: SQLiteDatabase): Promise<PeriodLog | null> {
  return await db.getFirstAsync<PeriodLog>(
    'SELECT * FROM period_logs ORDER BY date(start_date) DESC LIMIT 1'
  );
}

export async function addPeriodLog(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string | null = null
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO period_logs (start_date, end_date) VALUES (?, ?)',
    startDate,
    endDate
  );
  return result.lastInsertRowId;
}

export async function updatePeriodLog(
  db: SQLiteDatabase,
  id: number,
  startDate: string,
  endDate: string | null = null
): Promise<void> {
  await db.runAsync(
    'UPDATE period_logs SET start_date = ?, end_date = ? WHERE id = ?',
    startDate,
    endDate,
    id
  );
}

export async function deletePeriodLog(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM period_logs WHERE id = ?', id);
}

