export type Maybe<T> = T | null | undefined;

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ID = string;

export type Timestamp = {
  createdAt: string;
  updatedAt: string;
};

export * from './app.types';
export * from '@/features/auth/types/auth.types';
export * from '@/features/events/types/event.types';
export * from '@/features/marketplace/types/artwork.types';
