import { useState, useEffect, useCallback, useRef } from 'react';
import * as db from '../db/db';
import type { TestEntry } from '../db/db';

interface UseHistoryReturn {
  entries: TestEntry[];
  loading: boolean;
  addEntry: (entry: Omit<TestEntry, 'id'>) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useHistory(): UseHistoryReturn {
  const [entries, setEntries] = useState<TestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const history = await db.getTestHistory(100);
        if (!cancelled) {
          setEntries(history);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const history = await db.getTestHistory(100);
      if (mountedRef.current) {
        setEntries(history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  const addEntry = useCallback(async (entry: Omit<TestEntry, 'id'>) => {
    const id = crypto.randomUUID();
    const fullEntry: TestEntry = { ...entry, id };
    await db.addTestEntry(fullEntry);
    if (mountedRef.current) {
      // Prepend and keep max 100
      setEntries(prev => [fullEntry, ...prev].slice(0, 100));
    }
  }, []);

  const clearAll = useCallback(async () => {
    await db.clearHistory();
    if (mountedRef.current) {
      setEntries([]);
    }
  }, []);

  return { entries, loading, addEntry, clearAll, refresh };
}
