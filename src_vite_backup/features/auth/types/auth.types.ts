export type UserRole = 'art_lover' | 'artist' | 'art_dealer' | 'gallery' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}
