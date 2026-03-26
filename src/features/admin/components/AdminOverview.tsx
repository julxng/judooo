'use client';

import { Calendar, FileCheck, Palette, UserCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { AdminCounts, AdminView } from '@/features/admin/types/admin.types';

type AdminOverviewProps = {
  counts: AdminCounts;
  onNavigate: (view: AdminView) => void;
};

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ElementType;
  onClick?: () => void;
  highlight?: boolean;
};

const StatCard = ({ label, value, icon: Icon, onClick, highlight }: StatCardProps) => (
  <Card
    className={`p-6 transition-colors ${onClick ? 'cursor-pointer hover:bg-secondary/30' : ''} ${highlight && value > 0 ? 'border-warning/50' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <Icon size={18} className="text-muted-foreground" />
    </div>
    <p className="mt-3 text-3xl font-semibold">{value}</p>
  </Card>
);

export const AdminOverview = ({ counts, onNavigate }: AdminOverviewProps) => (
  <div className="space-y-8">
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Platform overview and pending items.
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        label="Pending Events"
        value={counts.pendingEvents}
        icon={Calendar}
        onClick={() => onNavigate('events')}
        highlight
      />
      <StatCard
        label="Live Events"
        value={counts.approvedEvents}
        icon={FileCheck}
        onClick={() => onNavigate('events')}
      />
      <StatCard
        label="Pending Artworks"
        value={counts.pendingArtworks}
        icon={Palette}
        onClick={() => onNavigate('artworks')}
        highlight
      />
      <StatCard
        label="Live Artworks"
        value={counts.approvedArtworks}
        icon={FileCheck}
        onClick={() => onNavigate('artworks')}
      />
      <StatCard
        label="Creator Applications"
        value={counts.pendingApplications}
        icon={UserCheck}
        onClick={() => onNavigate('creators')}
        highlight
      />
      <StatCard
        label="Total Users"
        value={counts.totalUsers}
        icon={Users}
        onClick={() => onNavigate('users')}
      />
    </div>
  </div>
);
