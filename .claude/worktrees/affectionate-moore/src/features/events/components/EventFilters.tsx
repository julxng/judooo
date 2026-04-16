import { Stack } from '@/components/layout/Stack';
import { Input, Select, Tabs } from '@/components/ui';
import type { EventCategory, EventTimeline } from '../types/event.types';

interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  category: EventCategory;
  onCategoryChange: (value: EventCategory) => void;
  timeline: EventTimeline;
  onTimelineChange: (value: EventTimeline) => void;
  viewMode: 'grid' | 'map' | 'route';
  onViewModeChange: (value: 'grid' | 'map' | 'route') => void;
}

export const EventFilters = ({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  timeline,
  onTimelineChange,
  viewMode,
  onViewModeChange,
}: EventFiltersProps) => (
  <div className="surface-toolbar">
    <Stack gap={12} className="surface-toolbar__row">
      <Input
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by title, city, or organizer"
      />
      <Select value={category} onChange={(event) => onCategoryChange(event.target.value as EventCategory)}>
        <option value="all">All categories</option>
        <option value="exhibition">Exhibition</option>
        <option value="workshop">Workshop</option>
        <option value="auction">Auction</option>
      </Select>
    </Stack>

    <div className="surface-toolbar__tabs">
      <Tabs
        value={timeline}
        onChange={onTimelineChange}
        options={[
          { id: 'active', label: 'Active' },
          { id: 'past', label: 'Past' },
        ]}
      />
      <Tabs
        value={viewMode}
        onChange={onViewModeChange}
        options={[
          { id: 'grid', label: 'Grid' },
          { id: 'map', label: 'Map' },
          { id: 'route', label: 'Route' },
        ]}
      />
    </div>
  </div>
);
