import type { DataMode } from './types';

export const STORAGE_BUCKET = 'images';
export const LOCAL_DB_KEY = 'judooo_local_db_v1';

const rawDataMode = String(import.meta.env.VITE_DATA_MODE || 'auto').toLowerCase();

export const DATA_MODE: DataMode =
  rawDataMode === 'local' ? 'local' : rawDataMode === 'supabase' ? 'supabase' : 'auto';

export const hasBrowserStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const toIsoDate = (value?: string | null): string => {
  if (!value) return new Date().toISOString().split('T')[0];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
};

export const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const toId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const mergeById = <T extends { id: string }>(primary: T[], secondary: T[]): T[] => {
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const item of primary) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  for (const item of secondary) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  return merged;
};

export const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T | null> =>
  Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))]);
