import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'stk-defi-tester';
const DB_VERSION = 1;

export interface TestEntry {
  id: string;
  timestamp: number;
  deviceId: string;
  deviceLabel: string;
  category: 'aed' | 'defibrillator';
  measuredValues: number[];
  targetValues: number[];
  deviationsJ: string[];
  deviationsPct: string[];
  passed: boolean;
  tolerance: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('testHistory')) {
          const store = db.createObjectStore('testHistory', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('passed', 'passed');
        }
      },
    });
  }
  return dbPromise;
}

export async function addTestEntry(entry: TestEntry): Promise<void> {
  const db = await getDB();
  await db.add('testHistory', entry);
  
  // Cleanup: keep max 500 entries
  const count = await db.count('testHistory');
  if (count > 500) {
    const allKeys = await db.getAllKeys('testHistory');
    const tx = db.transaction('testHistory', 'readwrite');
    // GetAllKeys returns in insertion order (oldest first), delete the excess
    const toDelete = count - 500;
    for (let i = 0; i < toDelete; i++) {
      await tx.store.delete(allKeys[i]);
    }
    await tx.done;
  }
}

export async function getTestHistory(limit = 50): Promise<TestEntry[]> {
  const db = await getDB();
  const results = await db.getAllFromIndex('testHistory', 'timestamp');
  return results
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export async function getTestEntry(id: string): Promise<TestEntry | undefined> {
  const db = await getDB();
  return db.get('testHistory', id);
}

export async function clearHistory(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('testHistory', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

export async function getHistoryCount(): Promise<number> {
  const db = await getDB();
  return db.count('testHistory');
}
