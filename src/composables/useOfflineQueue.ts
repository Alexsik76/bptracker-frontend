import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { CreateMeasurementDto } from '../types/api';
import { useApi } from './useApi';

const DB_NAME = 'bp-tracker-offline';
const DB_VERSION = 2;
const MEASUREMENTS_STORE = 'measurements-queue';
const PHOTOS_STORE = 'photos-queue';
const PHOTO_MAX = 10;
const PHOTO_TTL_MS = 24 * 60 * 60 * 1000;

interface QueuedMeasurement extends CreateMeasurementDto {
  id: number;
  timestamp: string;
}

interface PhotoQueueEntry {
  id?: number;
  timestamp: string;
  sys: number;
  dia: number;
  pulse: number;
  photoBlob: Blob;
  aiSys: number;
  aiDia: number;
  aiPul: number;
  corrected: boolean;
}

export function useOfflineQueue() {
  const api = useApi();

  const db: Promise<IDBPDatabase> = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore(MEASUREMENTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (oldVersion < 2) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  async function enqueue(data: CreateMeasurementDto) {
    const d = await db;
    await d.add(MEASUREMENTS_STORE, { ...data, timestamp: new Date().toISOString() });
  }

  async function enqueuePhoto(entry: Omit<PhotoQueueEntry, 'id' | 'timestamp'>) {
    const d = await db;
    const count = await d.count(PHOTOS_STORE);
    if (count >= PHOTO_MAX) return;
    await d.add(PHOTOS_STORE, { ...entry, timestamp: new Date().toISOString() });
  }

  async function sync() {
    if (!navigator.onLine) return;
    const d = await db;

    const measurements = (await d.getAll(MEASUREMENTS_STORE)) as QueuedMeasurement[];
    for (const item of measurements) {
      try {
        await api.addMeasurement({ sys: item.sys, dia: item.dia, pulse: item.pulse, recordedAt: item.timestamp });
        await d.delete(MEASUREMENTS_STORE, item.id);
      } catch (err) {
        console.error('Failed to sync offline measurement', item, err);
      }
    }

    const now = Date.now();
    const photos = (await d.getAll(PHOTOS_STORE)) as (PhotoQueueEntry & { id: number })[];
    for (const item of photos) {
      if (now - new Date(item.timestamp).getTime() > PHOTO_TTL_MS) {
        await d.delete(PHOTOS_STORE, item.id);
        continue;
      }
      try {
        const saved = await api.addMeasurement({
          sys: item.sys,
          dia: item.dia,
          pulse: item.pulse,
          recordedAt: item.timestamp,
        });
        await d.delete(PHOTOS_STORE, item.id);
        api.uploadMeasurementPhoto(
          saved.id,
          item.photoBlob,
          { sys: item.sys, dia: item.dia, pul: item.pulse, recordedAt: saved.recordedAt },
          { sys: item.aiSys, dia: item.aiDia, pul: item.aiPul },
          item.corrected ? 'user_confirmed' : 'local_ocr',
        ).catch(() => {});
      } catch (err) {
        console.error('Failed to sync offline photo measurement', item, err);
      }
    }
  }

  return { enqueue, enqueuePhoto, sync };
}
