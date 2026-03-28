'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ExternalLink, Save, Trash2, X, ChevronDown } from 'lucide-react';
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Column definition
// ---------------------------------------------------------------------------

type ColDef = {
  key: string;
  label: string;
  width: string;
  type: 'text' | 'date' | 'number' | 'select' | 'textarea' | 'boolean' | 'readonly';
  options?: { value: string; label: string }[];
  group: string;
};

const CATEGORY_OPTIONS = [
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'auction', label: 'Auction' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'fair', label: 'Fair' },
  { value: 'opening', label: 'Opening' },
  { value: 'other', label: 'Other' },
];

const EVENT_TYPE_OPTIONS = [
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'fair', label: 'Fair' },
  { value: 'auction', label: 'Auction' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'opening', label: 'Opening' },
  { value: 'other', label: 'Other' },
];

const COLUMNS: ColDef[] = [
  // Basic
  { key: 'title', label: 'Title', width: '260px', type: 'text', group: 'Basic' },
  { key: 'organizer', label: 'Organizer', width: '160px', type: 'text', group: 'Basic' },
  { key: 'category', label: 'Category', width: '120px', type: 'select', options: CATEGORY_OPTIONS, group: 'Basic' },
  { key: 'description', label: 'Description', width: '240px', type: 'textarea', group: 'Basic' },
  // Dates
  { key: 'startDate', label: 'Start Date', width: '130px', type: 'date', group: 'Dates' },
  { key: 'endDate', label: 'End Date', width: '130px', type: 'date', group: 'Dates' },
  // Location
  { key: 'city', label: 'City', width: '120px', type: 'text', group: 'Location' },
  { key: 'district', label: 'District', width: '120px', type: 'text', group: 'Location' },
  { key: 'location', label: 'Address', width: '180px', type: 'text', group: 'Location' },
  { key: 'lat', label: 'Lat', width: '90px', type: 'number', group: 'Location' },
  { key: 'lng', label: 'Lng', width: '90px', type: 'number', group: 'Location' },
  { key: 'google_map_link', label: 'Maps Link', width: '160px', type: 'text', group: 'Location' },
  // Classification
  { key: 'art_medium', label: 'Art Medium', width: '140px', type: 'text', group: 'Classification' },
  { key: 'event_type', label: 'Event Type', width: '120px', type: 'select', options: EVENT_TYPE_OPTIONS, group: 'Classification' },
  { key: 'place_type', label: 'Place Type', width: '120px', type: 'text', group: 'Classification' },
  // Price & Registration
  { key: 'price', label: 'Price (VND)', width: '110px', type: 'number', group: 'Price' },
  { key: 'is_free', label: 'Free', width: '60px', type: 'boolean', group: 'Price' },
  { key: 'registration_link', label: 'Reg. Link', width: '160px', type: 'text', group: 'Price' },
  // Media
  { key: 'imageUrl', label: 'Cover Image', width: '200px', type: 'text', group: 'Media' },
  { key: 'socialvideo_url', label: 'Social Video', width: '160px', type: 'text', group: 'Media' },
  // Source
  { key: 'sourceUrl', label: 'Source URL', width: '160px', type: 'readonly', group: 'Source' },
  { key: 'sourceItemUrl', label: 'Item URL', width: '160px', type: 'readonly', group: 'Source' },
  // Contact
  { key: 'gallery_contact', label: 'Contact', width: '140px', type: 'text', group: 'Contact' },
  { key: 'submitter_name', label: 'Submitter', width: '120px', type: 'readonly', group: 'Contact' },
  { key: 'submitter_email', label: 'Sub. Email', width: '160px', type: 'readonly', group: 'Contact' },
  // Flags
  { key: 'featured', label: 'Featured', width: '70px', type: 'boolean', group: 'Flags' },
  { key: 'is_virtual', label: 'Virtual', width: '60px', type: 'boolean', group: 'Flags' },
];

// ---------------------------------------------------------------------------
// Inline cell
// ---------------------------------------------------------------------------

const Cell = ({
  value,
  col,
  eventId,
  onChange,
}: {
  value: string | number | boolean | undefined;
  col: ColDef;
  eventId: string;
  onChange: (id: string, field: string, value: string | boolean) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(String(value ?? ''));
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  const startEdit = () => {
    if (col.type === 'readonly') return;
    if (col.type === 'boolean') return; // handled by checkbox
    setLocal(String(value ?? ''));
    setEditing(true);
    setTimeout(() => ref.current?.focus(), 0);
  };

  const commit = () => {
    setEditing(false);
    const strValue = local.trim();
    if (strValue !== String(value ?? '')) {
      onChange(eventId, col.key, col.type === 'number' ? strValue : strValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && col.type !== 'textarea') commit();
    if (e.key === 'Escape') { setEditing(false); setLocal(String(value ?? '')); }
    if (e.key === 'Tab') commit();
  };

  // Boolean → simple checkbox
  if (col.type === 'boolean') {
    return (
      <div className="flex h-full items-center justify-center">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(eventId, col.key, e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border accent-primary"
        />
      </div>
    );
  }

  // Readonly
  if (col.type === 'readonly') {
    const strVal = String(value ?? '');
    const isUrl = strVal.startsWith('http');
    return (
      <div className="truncate px-2 py-1.5 text-xs text-muted-foreground" title={strVal}>
        {isUrl ? (
          <a href={strVal} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
            <ExternalLink size={10} />
            <span className="truncate">{strVal.replace(/^https?:\/\//, '').slice(0, 30)}</span>
          </a>
        ) : (
          strVal || '—'
        )}
      </div>
    );
  }

  // Display mode
  if (!editing) {
    return (
      <div
        onClick={startEdit}
        className={cn(
          'cursor-text truncate px-2 py-1.5 text-xs transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/20',
          !value && value !== 0 && 'italic text-muted-foreground/40',
        )}
        title={String(value ?? '')}
      >
        {col.type === 'date'
          ? (String(value ?? '')).slice(0, 10) || '—'
          : (String(value ?? '') || '—')}
      </div>
    );
  }

  // Edit: select
  if (col.type === 'select' && col.options) {
    return (
      <select
        ref={ref as React.RefObject<HTMLSelectElement>}
        value={local}
        onChange={(e) => { onChange(eventId, col.key, e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
        className="h-full w-full border-0 bg-blue-50 px-2 py-1.5 text-xs outline-none dark:bg-blue-950/20"
      >
        <option value="">—</option>
        {col.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  // Edit: textarea
  if (col.type === 'textarea') {
    return (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Escape') { setEditing(false); setLocal(String(value ?? '')); } }}
        rows={3}
        className="h-full w-full resize-none border-0 bg-blue-50 px-2 py-1.5 text-xs outline-none dark:bg-blue-950/20"
      />
    );
  }

  // Edit: text / date / number
  return (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      step={col.type === 'number' ? 'any' : undefined}
      className="h-full w-full border-0 bg-blue-50 px-2 py-1.5 text-xs outline-none dark:bg-blue-950/20"
    />
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusBadgeTone = (status: string | undefined) => {
  if (status === 'pending') return 'warning' as const;
  if (status === 'rejected') return 'default' as const;
  return 'success' as const;
};

const statusTabs: { id: ModerationTab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const timeTabs: { id: TimeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'now', label: 'Now' },
  { id: 'past', label: 'Past' },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
  const [confirmAction, setConfirmAction] = useState<
    { ids: string[]; status: ModerationTab } | { ids: string[]; action: 'delete' } | null
  >(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, string | boolean>>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
    new Set(['Basic', 'Dates', 'Location', 'Classification']),
  );

  const today = todayIso();

  const cities = useMemo(() => {
    const set = new Set(events.map((e) => e.city).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const groups = useMemo(() => {
    const set = new Set(COLUMNS.map((c) => c.group));
    return Array.from(set);
  }, []);

  const visibleColumns = useMemo(
    () => COLUMNS.filter((c) => visibleGroups.has(c.group)),
    [visibleGroups],
  );

  const toggleGroup = (g: string) =>
    setVisibleGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  const filtered = useMemo(() => {
    let result = events.filter(filterByModerationStatus(filters.statusFilter));

    if (timeFilter === 'past') result = result.filter((e) => (e.endDate || e.startDate) < today);
    else if (timeFilter === 'now') result = result.filter((e) => e.startDate <= today && (e.endDate || e.startDate) >= today);
    else if (timeFilter === 'upcoming') result = result.filter((e) => e.startDate > today);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          getEventTitle(e, language).toLowerCase().includes(q) ||
          e.organizer?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q),
      );
    }
    if (filters.cityFilter) result = result.filter((e) => e.city === filters.cityFilter);
    if (filters.categoryFilter) result = result.filter((e) => e.category === filters.categoryFilter);

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

  const onCellChange = useCallback((id: string, field: string, value: string | boolean) => {
    setPendingChanges((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  }, []);

  const hasPending = (id: string) => {
    const c = pendingChanges[id];
    return c && Object.keys(c).length > 0;
  };

  const saveRow = async (id: string) => {
    const changes = pendingChanges[id];
    if (!changes) return;
    setSavingIds((prev) => new Set(prev).add(id));
    try {
      await onSave(id, changes as unknown as Partial<ArtEvent>);
      setPendingChanges((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } finally {
      setSavingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const saveAll = async () => {
    for (const id of Object.keys(pendingChanges)) {
      if (hasPending(id)) await saveRow(id);
    }
  };

  const pendingCount = Object.keys(pendingChanges).filter(hasPending).length;

  const getCellValue = (event: ArtEvent, field: string): string | number | boolean | undefined => {
    const changes = pendingChanges[event.id];
    if (changes && field in changes) return changes[field] as string | number | boolean;
    // Access event fields dynamically — field names come from our own COLUMNS definition
    const val = Object.getOwnPropertyDescriptor(event, field)?.value;
    return val as string | number | boolean | undefined;
  };

  const handleBatchAction = (status: ModerationTab) => {
    const ids = Array.from(filters.selectedIds);
    if (status === 'rejected') setConfirmAction({ ids, status });
    else void onBatchModerate(ids, status).then(() => filters.clearSelection());
  };

  return (
    <div className="min-w-0 space-y-3">
      {/* ---- Toolbar ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-lg font-semibold">Events</h1>

        {/* Status pills */}
        <div className="flex overflow-hidden rounded-md border border-border text-xs">
          {statusTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { filters.setStatusFilter(t.id); filters.clearSelection(); }}
              className={cn(
                'px-2.5 py-1 font-medium transition-colors',
                filters.statusFilter === t.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Time pills */}
        <div className="flex overflow-hidden rounded-md border border-border text-xs">
          {timeTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeFilter(t.id)}
              className={cn(
                'px-2.5 py-1 font-medium transition-colors',
                timeFilter === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        <Input
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          className="h-7 w-44 text-xs"
        />
        <Select
          value={filters.cityFilter}
          onChange={(e) => filters.setCityFilter(e.target.value)}
          className="h-7 w-28 text-xs"
        >
          <option value="">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>

        {/* Column groups toggle */}
        <div className="relative ml-auto">
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
              Columns <ChevronDown size={12} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 z-20 mt-1 min-w-[160px] rounded-md border border-border bg-background p-2 shadow-lg">
              {groups.map((g) => (
                <label key={g} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-secondary/50">
                  <input
                    type="checkbox"
                    checked={visibleGroups.has(g)}
                    onChange={() => toggleGroup(g)}
                    className="h-3 w-3 rounded border-border accent-primary"
                  />
                  {g}
                </label>
              ))}
            </div>
          </details>
        </div>

        <span className="text-xs text-muted-foreground">{filtered.length} events</span>

        {pendingCount > 0 && (
          <Button size="sm" onClick={saveAll} className="h-7 text-xs">
            <Save size={12} className="mr-1" />
            Save {pendingCount}
          </Button>
        )}
      </div>

      {/* ---- Batch bar ---- */}
      {filters.selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded border border-border bg-secondary/30 px-3 py-1.5 text-xs">
          <span className="font-medium">{filters.selectedCount} selected</span>
          {filters.statusFilter === 'pending' && (
            <>
              <Button size="sm" className="h-6 text-xs" onClick={() => handleBatchAction('approved')}>Approve</Button>
              <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => handleBatchAction('rejected')}>Reject</Button>
            </>
          )}
          {filters.statusFilter === 'rejected' && (
            <Button size="sm" className="h-6 text-xs" onClick={() => handleBatchAction('approved')}>Restore</Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs"
            onClick={() => setConfirmAction({ ids: Array.from(filters.selectedIds), action: 'delete' })}
          >
            <Trash2 size={12} className="mr-1" />Delete
          </Button>
          <button onClick={filters.clearSelection} className="text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

      {/* ---- Spreadsheet ---- */}
      <div className="overflow-auto rounded-md border border-border" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        <table className="w-max min-w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur">
            <tr>
              {/* Fixed: checkbox */}
              <th className="sticky left-0 z-20 w-8 border-b border-r border-border bg-secondary/80 px-1.5 py-2 backdrop-blur">
                <input
                  type="checkbox"
                  checked={filteredIds.length > 0 && filteredIds.every((id) => filters.selectedIds.has(id))}
                  onChange={() => filters.toggleAll(filteredIds)}
                  className="h-3.5 w-3.5 rounded border-border"
                />
              </th>
              {/* Fixed: image */}
              <th className="sticky left-8 z-20 w-10 border-b border-r border-border bg-secondary/80 px-1 py-2 backdrop-blur" />
              {/* Fixed: status */}
              <th className="sticky left-[72px] z-20 w-[70px] border-b border-r border-border bg-secondary/80 px-1.5 py-2 text-left backdrop-blur">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</span>
              </th>
              {/* Dynamic columns */}
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="border-b border-r border-border px-1.5 py-2 text-left"
                  style={{ minWidth: col.width, width: col.width }}
                >
                  <button
                    type="button"
                    onClick={() => filters.toggleSort(col.key)}
                    className="inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    {col.label}
                    {filters.sort.key === col.key && (
                      filters.sort.direction === 'asc'
                        ? <ArrowUp size={10} />
                        : <ArrowDown size={10} />
                    )}
                  </button>
                </th>
              ))}
              {/* Actions */}
              <th className="sticky right-0 z-20 w-[90px] border-b border-l border-border bg-secondary/80 px-1 py-2 text-center backdrop-blur">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 4}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No events found.
                </td>
              </tr>
            ) : (
              filtered.map((event) => {
                const changed = hasPending(event.id);
                const saving = savingIds.has(event.id);
                return (
                  <tr
                    key={event.id}
                    className={cn(
                      'border-b border-border/40 transition-colors',
                      changed && 'bg-amber-50/60 dark:bg-amber-950/10',
                      filters.selectedIds.has(event.id) && 'bg-blue-50/60 dark:bg-blue-950/10',
                      !changed && !filters.selectedIds.has(event.id) && 'hover:bg-secondary/30',
                    )}
                  >
                    {/* Checkbox */}
                    <td className="sticky left-0 z-[5] border-r border-border/40 bg-inherit px-1.5 py-0">
                      <input
                        type="checkbox"
                        checked={filters.selectedIds.has(event.id)}
                        onChange={() => filters.toggleSelection(event.id)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                    </td>
                    {/* Image */}
                    <td className="sticky left-8 z-[5] border-r border-border/40 bg-inherit px-1 py-0.5">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt="" className="h-7 w-7 rounded object-cover" />
                      ) : (
                        <div className="h-7 w-7 rounded bg-secondary" />
                      )}
                    </td>
                    {/* Status */}
                    <td className="sticky left-[72px] z-[5] border-r border-border/40 bg-inherit px-1.5 py-0">
                      <Badge tone={statusBadgeTone(event.moderation_status)} className="text-[9px] px-1.5 py-0">
                        {event.moderation_status || 'approved'}
                      </Badge>
                    </td>
                    {/* Editable cells */}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className="border-r border-border/40 p-0"
                        style={{ minWidth: col.width, width: col.width, maxWidth: col.width }}
                      >
                        <Cell
                          value={getCellValue(event, col.key)}
                          col={col}
                          eventId={event.id}
                          onChange={onCellChange}
                        />
                      </td>
                    ))}
                    {/* Actions */}
                    <td className="sticky right-0 z-[5] border-l border-border/40 bg-inherit px-1 py-0">
                      <div className="flex items-center justify-center gap-0.5">
                        {changed && (
                          <button
                            onClick={() => saveRow(event.id)}
                            disabled={saving}
                            className="rounded p-1 text-primary hover:bg-primary/10"
                            title="Save"
                          >
                            <Save size={13} className={saving ? 'animate-pulse' : ''} />
                          </button>
                        )}
                        {filters.statusFilter === 'pending' && (
                          <>
                            <button
                              onClick={() => void onModerate(event.id, 'approved')}
                              className="rounded p-1 text-green-600 hover:bg-green-500/10"
                              title="Approve"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => void onModerate(event.id, 'rejected')}
                              className="rounded p-1 text-red-500 hover:bg-red-500/10"
                              title="Reject"
                            >
                              <X size={13} />
                            </button>
                          </>
                        )}
                        {filters.statusFilter === 'rejected' && (
                          <button
                            onClick={() => void onModerate(event.id, 'approved')}
                            className="rounded p-1 text-green-600 hover:bg-green-500/10"
                            title="Restore"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmAction({ ids: [event.id], action: 'delete' })}
                          className="rounded p-1 text-red-400 hover:bg-red-500/10 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Confirm dialog ---- */}
      {confirmAction && (
        <ConfirmDialog
          title={'action' in confirmAction ? 'Delete events' : 'Reject events'}
          message={
            'action' in confirmAction
              ? `Permanently delete ${confirmAction.ids.length} event(s)? This cannot be undone.`
              : `Reject ${confirmAction.ids.length} event(s)?`
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
