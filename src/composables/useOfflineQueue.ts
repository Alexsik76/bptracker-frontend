import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { CreateMeasurementDto } from '../types/api';
import { useApi } from './useApi';

const DB_NAME = 'bp-tracker-offline';
const STORE_NAME = 'measurements-queue';

// Internal type for rows stored in IndexedDB.
// 'id' is the IDB autoIncrement key; 'timestamp' captures the actual measurement time.
interface QueuedMeasurement extends CreateMeasurementDto {
  id: number;
  timestamp: string;
}

export function useOfflineQueue() {
  const api = useApi();
  let db: Promise<IDBPDatabase>;

  db = openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    },
  });

  async function enqueue(data: CreateMeasurementDto) {
    const d = await db;
    await d.add(STORE_NAME, { ...data, timestamp: new Date().toISOString() });
  }

  async function sync() {
    if (!navigator.onLine) return;

    const d = await db;
    const all = (await d.getAll(STORE_NAME)) as QueuedMeasurement[];

    for (const item of all) {
      try {
        // Send only the DTO fields — exclude IDB's 'id' and 'timestamp'
        // to avoid sending stale keys to the backend and causing 400 errors.
        await api.addMeasurement({ sys: item.sys, dia: item.dia, pulse: item.pulse });
        await d.delete(STORE_NAME, item.id);
      } catch (err) {
        console.error('Failed to sync offline item', item, err);
      }
    }
  }

  return { enqueue, sync };
}
