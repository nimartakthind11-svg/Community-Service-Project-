import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { PeriodLog } from '../schema';
import {
  getAllPeriodLogs,
  addPeriodLog,
  updatePeriodLog,
  deletePeriodLog,
} from '../repositories/periodRepository';

export function usePeriodLogs() {
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllPeriodLogs(db);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load period logs:', err);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    let isMounted = true;
    getAllPeriodLogs(db)
      .then((data) => {
        if (isMounted) {
          setLogs(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load period logs:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [db]);

  const addLog = useCallback(
    async (startDate: string, endDate: string | null = null) => {
      await addPeriodLog(db, startDate, endDate);
      await refreshLogs();
    },
    [db, refreshLogs]
  );

  const editLog = useCallback(
    async (id: number, startDate: string, endDate: string | null = null) => {
      await updatePeriodLog(db, id, startDate, endDate);
      await refreshLogs();
    },
    [db, refreshLogs]
  );

  const removeLog = useCallback(
    async (id: number) => {
      await deletePeriodLog(db, id);
      await refreshLogs();
    },
    [db, refreshLogs]
  );

  return { logs, loading, refreshLogs, addLog, editLog, removeLog };
}
