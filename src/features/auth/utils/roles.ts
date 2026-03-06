import type { UserRole } from '../types/auth.types';

export const canAccessAdmin = (role?: UserRole): boolean =>
  role === 'gallery' || role === 'artist' || role === 'admin';
