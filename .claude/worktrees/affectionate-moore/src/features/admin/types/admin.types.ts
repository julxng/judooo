import type { LucideIcon } from 'lucide-react';

export type AdminView = 'overview' | 'events' | 'artworks' | 'creators' | 'publish' | 'crawl' | 'users';

export type ModerationTab = 'pending' | 'approved' | 'rejected';

export type SortDirection = 'asc' | 'desc';

export type AdminNavItem = {
  id: AdminView;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export type TableSort = {
  key: string;
  direction: SortDirection;
};

export type AdminCounts = {
  pendingEvents: number;
  approvedEvents: number;
  rejectedEvents: number;
  pendingArtworks: number;
  approvedArtworks: number;
  rejectedArtworks: number;
  pendingApplications: number;
  totalUsers: number;
};
