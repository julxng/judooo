export type UserRole =
  | 'art_lover'
  | 'artist_pending'
  | 'artist'
  | 'gallery_manager_pending'
  | 'gallery_manager'
  | 'gallery'
  | 'admin';

export type SignUpRole = 'art_lover' | 'artist_pending' | 'gallery_manager_pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}
