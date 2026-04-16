import type { TabId } from '@types';

export const appTabs: Array<{
  id: TabId;
  label: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}> = [
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'events', label: 'Exhibitions' },
  { id: 'saved', label: 'Saved', requiresAuth: true },
  { id: 'admin', label: 'Admin', requiresAuth: true, adminOnly: true },
  { id: 'about', label: 'About' },
];
