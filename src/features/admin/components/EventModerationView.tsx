'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ExternalLink, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { todayIso } from '@/lib/date';
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
  onDelete: (id: string) => Promise<void>;
  onBatchDelete: (ids: string[]) => Promise<void>;
  onEdit: (event: ArtEvent) => void;
  onSave: (id: string, updates: Partial<ArtEvent>) => Promise<void>;
};

type TimeFilter = 'all' | 'past' | 'now' | 'upcoming';

const statusTabs: { id: ModerationTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const timeTabs: { id: TimeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'now', label: 'Happening' },
  { id: 'past', label: 'Past' },
];

const statusBadgeTone = (status: string | undefined) => {
  if (status === 'pending') return 'warning' as const;
  if (status === 'rejected') return 'default' as const;
  return 'success' as const;
};

const SortHeader = ({ label, sortKey, currentSort, onToggle, className }: {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onToggle: (key: string) => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={() => onToggle(sortKey)}
    className={cn('inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground', className)}
  >
    {label}
    {currentSort.key === sortKey ? (
      currentSort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
    ) : null}
  </button>
);

// ---------------------------------------------------------------------------
// Inline editable cell
// ---------------------------------------------------------------------------

type EditableCellProps = {
  value: string;
  eventId: string;
  field: string;
  type?: 'text' | 'date' | 'select';
  options?: { value: string; label: string }[];
  onCellChange: (id: string, field: string, value: string) => void;
  className?: string;
  placeholder?: string;
};

const EditableCell = ({
  value,
  eventId,
  field,
  type = 'text',
  options,
  onCellChange,
  className,
  placeholder,
}: EditableCellProps) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const startEdit = () => {
    setLocalValue(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (localValue !== value) {
      onCellChange(eventId, field, localValue);
    }
  };

  const cancel = () => {
    setEditing(false);
    setLocalValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  };

  if (!editing) {
    return (
      <div
        onClick={startEdit}
        className={cn(
          'cursor-text rounded px-1.5 py-1 hover:bg-secondary/50 transition-colors min-h-[28px] text-sm truncate',
          !value && 'text-muted-foreground/50 italic',
          className,
        )}
        title={value || placeholder || 'Click to edit'}
      >
        {value || placeholder || '—'}
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onCellChange(eventId, field, e.target.value);
          setEditing(false);
        }}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-full rounded border border-primary/30 bg-background px-1.5 py-1 text-sm outline-none ring-1 ring-primary/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={cn(
        'w-full rounded border border-primary/30 bg-background px-1.5 py-1 text-sm outline-none ring-1 ring-primary/20',
        type === 'date' && 'w-36',
      )}
    />
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'auction', label: 'Auction' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'fair', label: 'Fair' },
  { value: 'opening', label: 'Opening' },
  { value: 'other', label: 'Other' },
];

export const EventModerationView = ({
  events,
  language,
  onModerate,
  onBatchModerate,
  onDelete,
  onBatchDelete,
  onEdit,
  onSave,
}: EventModerationViewProps) => {
  const filters = useTableFilters('startDate');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [confirmAction, setConfirmAction] = useState<{ ids: string[]; status: ModerationTab } | { ids: string[]; action: 'delete' } | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, string>>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const today = todayIso();

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

    // Time filter
    if (timeFilter === 'past') {
      result = result.filter((e) => (e.endDate || e.startDate) < today);
    } else if (timeFilter === 'now') {
      result = result.filter((e) => e.startDate <= today && (e.endDate || e.startDate) >= today);
    } else if (timeFilter === 'upcoming') {
      result = result.filter((e) => e.startDate > today);
    }

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
  }, [events, filters, language, timeFilter, today]);

  const filteredIds = useMemo(() => filtered.map((e) => e.id), [filtered]);

  const onCellChange = useCallback((id: string, field: string, value: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  }, []);

  const hasPendingChanges = (id: string) => {
    const changes = pendingChanges[id];
    return changes && Object.keys(changes).length > 0;
  };

  const saveRow = async (id: string) => {
    const changes = pendingChanges[id];
    if (!changes || Object.keys(changes).length === 0) return;

    setSavingIds((prev) => new Set(prev).add(id));
    try {
      await onSave(id, changes as Partial<ArtEvent>);
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const saveAllPending = async () => {
    const ids = Object.keys(pendingChanges).filter((id) => hasPendingChanges(id));
    for (const id of ids) {
      await saveRow(id);
    }
  };

  const pendingCount = Object.keys(pendingChanges).filter((id) => hasPendingChanges(id)).length;

  const handleBatchAction = (status: ModerationTab) => {
    const ids = Array.from(filters.selectedIds);
    if (status === 'rejected') {
      setConfirmAction({ ids, status });
    } else {
      void onBatchModerate(ids, status).then(() => filters.clearSelection());
    }
  };

  const getDisplayValue = (event: ArtEvent, field: keyof ArtEvent): string => {
    const changes = pendingChanges[event.id];
    if (changes && field in changes) return changes[field];
    return (event[field] as string) ?? '';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Event Moderation</h1>
        <div className="flex items-center gap-2">
          {/* Status tabs */}
          <div className="flex rounded-md border border-border">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { filters.setStatusFilter(tab.id); filters.clearSelection(); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  filters.statusFilter === tab.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Time tabs */}
          <div className="flex rounded-md border border-border">
            {timeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  timeFilter === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search events..."
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          className="w-56"
        />
        <Select value={filters.cityFilter} onChange={(e) => filters.setCityFilter(e.target.value)} className="w-36">
          <option value="">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select value={filters.categoryFilter} onChange={(e) => filters.setCategoryFilter(e.target.value)} className="w-40">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} events</span>
          {pendingCount > 0 && (
            <Button size="sm" onClick={saveAllPending}>
              <Save size={14} className="mr-1" />
              Save {pendingCount} change{pendingCount > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>

      {/* Batch actions */}
      {filters.selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
          <span className="font-medium">{filters.selectedCount} selected</span>
          {filters.statusFilter === 'pending' && (
            <>
              <Button size="sm" onClick={() => handleBatchAction('approved')}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => handleBatchAction('rejected')}>Reject</Button>
            </>
          )}
          {filters.statusFilter === 'rejected' && (
            <Button size="sm" onClick={() => handleBatchAction('approved')}>Restore</Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirmAction({ ids: Array.from(filters.selectedIds), action: 'delete' })}
          >
            <Trash2 size={14} className="mr-1" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={filters.clearSelection}>Clear</Button>
        </div>
      )}

      {/* Spreadsheet table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="w-8 px-2 py-2">
                <input
                  type="checkbox"
                  checked={filteredIds.length > 0 && filteredIds.every((id) => filters.selectedIds.has(id))}
                  onChange={() => filters.toggleAll(filteredIds)}
                  className="h-3.5 w-3.5 rounded border-border"
                />
              </th>
              <th className="min-w-[280px] px-2 py-2 text-left">
                <SortHeader label="Title" sortKey="title" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="min-w-[140px] px-2 py-2 text-left">
                <SortHeader label="Organizer" sortKey="organizer" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="w-[100px] px-2 py-2 text-left">
                <SortHeader label="City" sortKey="city" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="w-[100px] px-2 py-2 text-left">Category</th>
              <th className="w-[120px] px-2 py-2 text-left">
                <SortHeader label="Start" sortKey="startDate" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="w-[120px] px-2 py-2 text-left">End</th>
              <th className="w-[80px] px-2 py-2 text-left">Status</th>
              <th className="w-[100px] px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                  No events found.
                </td>
              </tr>
            ) : (
              filtered.map((event) => {
                const changed = hasPendingChanges(event.id);
                const saving = savingIds.has(event.id);
                return (
                  <tr
                    key={event.id}
                    className={cn(
                      'border-b border-border/50 transition-colors',
                      filters.selectedIds.has(event.id) && 'bg-secondary/40',
                      changed && 'bg-yellow-500/5',
                      !changed && !filters.selectedIds.has(event.id) && 'hover:bg-secondary/20',
                    )}
                  >
                    <td className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={filters.selectedIds.has(event.id)}
                        onChange={() => filters.toggleSelection(event.id)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-start gap-2">
                        {event.imageUrl ? (
                          <img src={event.imageUrl} alt="" className="mt-0.5 h-8 w-8 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="mt-0.5 h-8 w-8 shrink-0 rounded bg-secondary" />
                        )}
                        <div className="min-w-0 flex-1">
                          <EditableCell
                            value={getDisplayValue(event, 'title')}
                            eventId={event.id}
                            field="title"
                            onCellChange={onCellChange}
                            className="font-medium"
                          />
                          {event.sourceItemUrl && (
                            <a
                              href={event.sourceItemUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink size={9} /> source
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <EditableCell
                        value={getDisplayValue(event, 'organizer')}
                        eventId={event.id}
                        field="organizer"
                        onCellChange={onCellChange}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <EditableCell
                        value={getDisplayValue(event, 'city')}
                        eventId={event.id}
                        field="city"
                        onCellChange={onCellChange}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <EditableCell
                        value={getDisplayValue(event, 'category')}
                        eventId={event.id}
                        field="category"
                        type="select"
                        options={CATEGORY_OPTIONS}
                        onCellChange={onCellChange}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <EditableCell
                        value={getDisplayValue(event, 'startDate')}
                        eventId={event.id}
                        field="startDate"
                        type="date"
                        onCellChange={onCellChange}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <EditableCell
                        value={getDisplayValue(event, 'endDate')}
                        eventId={event.id}
                        field="endDate"
                        type="date"
                        onCellChange={onCellChange}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Badge tone={statusBadgeTone(event.moderation_status)} className="text-[10px]">
                        {event.moderation_status || 'approved'}
                      </Badge>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex justify-end gap-0.5">
                        {changed && (
                          <Button size="sm" variant="ghost" onClick={() => saveRow(event.id)} disabled={saving} title="Save changes">
                            <Save size={14} className={saving ? 'animate-pulse' : 'text-primary'} />
                          </Button>
                        )}
                        {filters.statusFilter === 'pending' && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => void onModerate(event.id, 'approved')} title="Approve">
                              <Check size={14} className="text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => void onModerate(event.id, 'rejected')} title="Reject">
                              <X size={14} className="text-red-500" />
                            </Button>
                          </>
                        )}
                        {filters.statusFilter === 'rejected' && (
                          <Button size="sm" variant="ghost" onClick={() => void onModerate(event.id, 'approved')} title="Restore">
                            <Check size={14} />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmAction({ ids: [event.id], action: 'delete' })}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {confirmAction && (
        <ConfirmDialog
          title={'action' in confirmAction ? 'Delete events' : 'Reject events'}
          message={
            'action' in confirmAction
              ? `Are you sure you want to permanently delete ${confirmAction.ids.length} event(s)? This cannot be undone.`
              : `Are you sure you want to reject ${confirmAction.ids.length} event(s)?`
          }
          confirmLabel={'action' in confirmAction ? 'Delete' : 'Reject'}
          destructive
          onConfirm={() => {
            if ('action' in confirmAction) {
              void onBatchDelete(confirmAction.ids).then(() => filters.clearSelection());
            } else {
              void onBatchModerate(confirmAction.ids, confirmAction.status).then(() => filters.clearSelection());
            }
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};
