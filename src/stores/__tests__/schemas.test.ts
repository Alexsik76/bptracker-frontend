import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSchemaStore } from '../schemas';
import type { TreatmentSchema } from '../../types/api';

const mockApi = {
  getSchemas: vi.fn(),
  createSchema: vi.fn(),
  updateSchema: vi.fn(),
  activateSchema: vi.fn(),
  deleteSchema: vi.fn(),
};

const mockToast = {
  error: vi.fn(),
  success: vi.fn(),
};

vi.mock('../../composables/useApi', () => ({
  useApi: () => mockApi,
}));

vi.mock('../../composables/useToast', () => ({
  useToast: () => mockToast,
}));

vi.mock('../../composables/useApiErrorMessage', () => ({
  useApiErrorMessage: () => ({
    toMessage: (_err: any, fallback: string) => fallback,
  }),
}));

describe('useSchemaStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const dummySchema = (id: string, isActive = false): TreatmentSchema => ({
    id,
    doctor: 'Dr. House',
    prescribedOn: '2026-06-09',
    createdAt: '2026-06-09T00:00:00Z',
    isActive,
    scheduleDocument: null,
  });

  it('initially has empty items', () => {
    const store = useSchemaStore();
    expect(store.items).toEqual([]);
    expect(store.active).toBeNull();
    expect(store.loading).toBe(false);
  });

  it('fetchSchemas fetches and sets items', async () => {
    const store = useSchemaStore();
    const items = [dummySchema('1'), dummySchema('2', true)];
    mockApi.getSchemas.mockResolvedValueOnce(items);

    await store.fetchSchemas();

    expect(store.loading).toBe(false);
    expect(store.items).toEqual(items);
    expect(store.active).toEqual(items[1]);
  });

  it('create calls api and refetches', async () => {
    const store = useSchemaStore();
    mockApi.createSchema.mockResolvedValueOnce(undefined);
    mockApi.getSchemas.mockResolvedValueOnce([dummySchema('1')]);

    await store.create({
      doctor: 'Dr. Smith',
      prescribedOn: '2026-06-09',
      schedule: {},
      setActive: true,
    });

    expect(mockApi.createSchema).toHaveBeenCalled();
    expect(mockApi.getSchemas).toHaveBeenCalled();
  });

  it('activate performs optimistic update and updates store', async () => {
    const store = useSchemaStore();
    store.items = [dummySchema('1', true), dummySchema('2', false)];
    mockApi.activateSchema.mockResolvedValueOnce(undefined);
    mockApi.getSchemas.mockResolvedValueOnce([
      dummySchema('1', false),
      dummySchema('2', true),
    ]);

    await store.activate('2');

    expect(store.items[1].isActive).toBe(true);
    expect(store.items[0].isActive).toBe(false);
    expect(mockApi.activateSchema).toHaveBeenCalledWith('2');
    expect(mockApi.getSchemas).toHaveBeenCalled();
  });

  it('remove deletes item and updates local items', async () => {
    const store = useSchemaStore();
    store.items = [dummySchema('1'), dummySchema('2')];
    mockApi.deleteSchema.mockResolvedValueOnce(undefined);

    await store.remove('2');

    expect(store.items).toEqual([dummySchema('1')]);
    expect(mockApi.deleteSchema).toHaveBeenCalledWith('2');
  });
});
