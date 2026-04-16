'use client';

import { Calendar, Globe, LayoutDashboard, Palette, Upload, UserCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { AdminCounts, AdminNavItem, AdminView } from '@/features/admin/types/admin.types';

type AdminSidebarProps = {
  activeView: AdminView;
  counts: AdminCounts;
  onNavigate: (view: AdminView) => void;
};

const buildNavItems = (counts: AdminCounts): AdminNavItem[] => [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'events', label: 'Events', icon: Calendar, badge: counts.pendingEvents || undefined },
  { id: 'artworks', label: 'Artworks', icon: Palette, badge: counts.pendingArtworks || undefined },
  { id: 'creators', label: 'Applications', icon: UserCheck, badge: counts.pendingApplications || undefined },
  { id: 'publish', label: 'Publish', icon: Upload },
  { id: 'crawl', label: 'Crawl', icon: Globe },
  { id: 'users', label: 'Users', icon: Users },
];

export const AdminSidebar = ({ activeView, counts, onNavigate }: AdminSidebarProps) => {
  const items = buildNavItems(counts);

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block border-r border-border bg-background px-3 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin
        </p>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeView;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                  )}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge ? <Badge tone="warning">{item.badge}</Badge> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile horizontal tabs */}
      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-4 py-2 lg:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeView;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={14} />
              {item.label}
              {item.badge ? (
                <span className="ml-0.5 rounded-full bg-warning/20 px-1.5 text-xs font-semibold text-warning">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </>
  );
};
