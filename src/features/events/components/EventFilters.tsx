import { FilterToolbar } from '@components/shared/FilterToolbar';
import { Select, Tabs } from '@ui/index';
import type { EventCategory, EventTimeline } from '../types/event.types';

interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  category: EventCategory;
  onCategoryChange: (value: EventCategory) => void;
  timeline: EventTimeline;
  onTimelineChange: (value: EventTimeline) => void;
  viewMode: 'grid' | 'map';
  onViewModeChange: (value: 'grid' | 'map') => void;
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
  <FilterToolbar
    searchValue={searchQuery}
    onSearchChange={onSearchChange}
    searchPlaceholder="Search by title, city, or organizer"
    filters={
      <Select value={category} onChange={(event) => onCategoryChange(event.target.value as EventCategory)}>
        <option value="all">All categories</option>
        <option value="exhibition">Exhibition</option>
        <option value="workshop">Workshop</option>
        <option value="auction">Auction</option>
      </Select>
    }
    tabs={
      <>
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
          ]}
        />
      </>
    }
  />
);
