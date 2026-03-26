'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ExternalLink, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { getEventTitle } from '@/features/events/utils/event-utils';
import { useTableFilters } from '@/features/admin/hooks/useTableFilters';
import { filterByModerationStatus } from '@/features/admin/utils/admin-utils';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Locale } from '@/lib/i18n/translations';
import type { ModerationTab } from '@/features/admin/types/admin.types';

type EventModerationViewProps = {
  events: ArtEvent[];
  language: Locale;
  onModerate: (id: string, status: ModerationTab) => Promise<void>;
  onBatchModerate: (ids: string[], status: ModerationTab) => Promise<void>;
  onEdit: (event: ArtEvent) => void;
};

const statusTabs: { id: ModerationTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const statusBadgeTone = (status: string | undefined) => {
  if (status === 'pending') return 'warning' as const;
  if (status === 'rejected') return 'default' as const;
  return 'success' as const;
};

const SortHeader = ({ label, sortKey, currentSort, onToggle }: {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onToggle: (key: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onToggle(sortKey)}
    className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
  >
    {label}
    {currentSort.key === sortKey ? (
      currentSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
    ) : null}
  </button>
);

export const EventModerationView = ({
  events,
  language,
  onModerate,
  onBatchModerate,
  onEdit,
}: EventModerationViewProps) => {
  const filters = useTableFilters('title');
  const [confirmAction, setConfirmAction] = useState<{ ids: string[]; status: ModerationTab } | null>(null);

  const cities = useMemo(() => {
    const set = new Set(events.map((e) => e.city).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const categories = useMemo(() => {
    const set = new Set(events.map((e) => e.category).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    let result = events.filter(filterByModerationStatus(filters.statusFilter));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          getEventTitle(e, language).toLowerCase().includes(q) ||
          e.organizer?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q),
      );
    }
    if (filters.cityFilter) {
      result = result.filter((e) => e.city === filters.cityFilter);
    }
    if (filters.categoryFilter) {
      result = result.filter((e) => e.category === filters.categoryFilter);
    }
    if (filters.dateFrom) {
      result = result.filter((e) => e.startDate >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter((e) => e.endDate <= filters.dateTo);
    }

    const { key, direction } = filters.sort;
    const getField = (e: ArtEvent, k: string): string => {
      if (k === 'title') return getEventTitle(e, language);
      if (k === 'organizer') return e.organizer ?? '';
      if (k === 'city') return e.city ?? '';
      if (k === 'startDate') return e.startDate ?? '';
      return '';
    };
    result.sort((a, b) => {
      const aVal = getField(a, key);
      const bVal = getField(b, key);
      return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return result;
  }, [events, filters, language]);

  const filteredIds = useMemo(() => filtered.map((e) => e.id), [filtered]);

  const handleBatchAction = (status: ModerationTab) => {
    const ids = Array.from(filters.selectedIds);
    if (status === 'rejected') {
      setConfirmAction({ ids, status });
    } else {
      void onBatchModerate(ids, status).then(() => filters.clearSelection());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Event Moderation</h1>
        <Tabs value={filters.statusFilter} options={statusTabs} onChange={(v) => { filters.setStatusFilter(v); filters.clearSelection(); }} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search events..."
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={filters.cityFilter} onChange={(e) => filters.setCityFilter(e.target.value)}>
          <option value="">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={filters.categoryFilter} onChange={(e) => filters.setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => filters.setDateFrom(e.target.value)}
          className="w-40"
          placeholder="From"
        />
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => filters.setDateTo(e.target.value)}
          className="w-40"
          placeholder="To"
        />
      </div>

      {/* Batch actions */}
      {filters.selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/30 px-4 py-2">
          <span className="text-sm font-medium">{filters.selectedCount} selected</span>
          {filters.statusFilter === 'pending' && (
            <>
              <Button size="sm" onClick={() => handleBatchAction('approved')}>Approve selected</Button>
              <Button size="sm" variant="outline" onClick={() => handleBatchAction('rejected')}>Reject selected</Button>
            </>
          )}
          {filters.statusFilter === 'rejected' && (
            <Button size="sm" onClick={() => handleBatchAction('approved')}>Restore selected</Button>
          )}
          <Button size="sm" variant="ghost" onClick={filters.clearSelection}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={filteredIds.length > 0 && filteredIds.every((id) => filters.selectedIds.has(id))}
                  onChange={() => filters.toggleAll(filteredIds)}
                  className="h-4 w-4 rounded border-border"
                />
              </th>
              <th className="w-14 px-3 py-3" />
              <th className="px-3 py-3 text-left">
                <SortHeader label="Title" sortKey="title" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="px-3 py-3 text-left">
                <SortHeader label="Organizer" sortKey="organizer" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="hidden px-3 py-3 text-left md:table-cell">
                <SortHeader label="City" sortKey="city" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="hidden px-3 py-3 text-left lg:table-cell">
                <SortHeader label="Dates" sortKey="startDate" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="hidden px-3 py-3 text-left lg:table-cell">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                  No {filters.statusFilter} events found.
                </td>
              </tr>
            ) : (
              filtered.map((event) => (
                <tr
                  key={event.id}
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-secondary/20',
                    filters.selectedIds.has(event.id) && 'bg-secondary/40',
                  )}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={filters.selectedIds.has(event.id)}
                      onChange={() => filters.toggleSelection(event.id)}
                      className="h-4 w-4 rounded border-border"
                    />
                  </td>
                  <td className="px-3 py-3">
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-secondary" />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{getEventTitle(event, language)}</div>
                    {event.sourceUrl && (
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink size={10} /> source
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{event.organizer}</td>
                  <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">{event.city}</td>
                  <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">
                    {event.startDate} &rarr; {event.endDate}
                  </td>
                  <td className="hidden px-3 py-3 lg:table-cell">
                    <Badge tone={statusBadgeTone(event.moderation_status)}>
                      {event.moderation_status || 'approved'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(event)}>
                        <Pencil size={14} />
                      </Button>
                      {filters.statusFilter === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => void onModerate(event.id, 'approved')}>
                            <Check size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void onModerate(event.id, 'rejected')}>
                            <X size={14} />
                          </Button>
                        </>
                      )}
                      {filters.statusFilter === 'rejected' && (
                        <Button size="sm" variant="ghost" onClick={() => void onModerate(event.id, 'approved')}>
                          Restore
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</p>

      {confirmAction && (
        <ConfirmDialog
          title="Reject events"
          message={`Are you sure you want to reject ${confirmAction.ids.length} event(s)?`}
          confirmLabel="Reject"
          destructive
          onConfirm={() => {
            void onBatchModerate(confirmAction.ids, confirmAction.status).then(() => filters.clearSelection());
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};
