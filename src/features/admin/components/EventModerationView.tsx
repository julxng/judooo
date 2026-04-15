'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ExternalLink, ImagePlus, Maximize2, Minimize2, Save, Trash2, X, ChevronDown, Plus } from 'lucide-react';
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
import type { ArtEvent, EventMedia } from '@/features/events/types/event.types';
import type { Locale } from '@/lib/i18n/translations';
import type { ModerationTab } from '@/features/admin/types/admin.types';

// ---------------------------------------------------------------------------
// Types
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

type ColType = 'text' | 'date' | 'number' | 'select' | 'textarea' | 'boolean' | 'readonly' | 'image' | 'gallery' | 'video';

type ColDef = {
  key: string;
  label: string;
  width: string;
  type: ColType;
  options?: { value: string; label: string }[];
  group: string;
};

// ---------------------------------------------------------------------------
// Column config
// ---------------------------------------------------------------------------

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

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
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
  { key: 'imageUrl', label: 'Cover Image', width: '220px', type: 'image', group: 'Media' },
  { key: 'media', label: 'Gallery', width: '280px', type: 'gallery', group: 'Media' },
  { key: 'socialvideo_url', label: 'Social Video', width: '220px', type: 'video', group: 'Media' },
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
// Image cell — URL input + thumbnail preview
// ---------------------------------------------------------------------------

const ImageCell = ({
  value,
  eventId,
  field,
  onChange,
}: {
  value: string;
  eventId: string;
  field: string;
  onChange: (id: string, field: string, value: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setLocal(value);
    setEditing(true);
    setTimeout(() => ref.current?.focus(), 0);
  };

  const commit = () => {
    setEditing(false);
    if (local.trim() !== value) onChange(eventId, field, local.trim());
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 p-1">
        <input
          ref={ref}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setEditing(false); setLocal(value); }
          }}
          placeholder="Paste image URL..."
          className="min-w-0 flex-1 rounded border border-primary/30 bg-background px-1.5 py-1 text-xs outline-none"
        />
      </div>
    );
  }

  return (
    <div
      onClick={startEdit}
      className="group flex cursor-pointer items-center gap-2 px-1.5 py-1 hover:bg-blue-50 dark:hover:bg-blue-950/20"
    >
      {value ? (
        <img src={value} alt="" className="h-8 w-12 shrink-0 rounded border border-border object-cover" />
      ) : (
        <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded border border-dashed border-border">
          <ImagePlus size={12} className="text-muted-foreground/40" />
        </div>
      )}
      <span className="truncate text-[10px] text-muted-foreground">
        {value ? value.replace(/^https?:\/\//, '').slice(0, 25) + '…' : 'Add image'}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Gallery cell — manage multiple images/videos
// ---------------------------------------------------------------------------

const GalleryCell = ({
  media,
  eventId,
  onMediaChange,
}: {
  media: EventMedia[];
  eventId: string;
  onMediaChange: (id: string, media: EventMedia[]) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [newUrl, setNewUrl] = useState('');

  const addItem = (type: 'image' | 'video', url: string) => {
    if (!url.trim()) return;
    onMediaChange(eventId, [...media, { type, url: url.trim() }]);
    setNewUrl('');
  };

  const removeItem = (idx: number) => {
    onMediaChange(eventId, media.filter((_, i) => i !== idx));
  };

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        className="flex cursor-pointer items-center gap-1.5 px-1.5 py-1 hover:bg-blue-50 dark:hover:bg-blue-950/20"
      >
        {media.length > 0 ? (
          <>
            <div className="flex -space-x-1.5">
              {media.slice(0, 4).map((m, i) => (
                m.type === 'image' ? (
                  <img key={i} src={m.url} alt="" className="h-7 w-7 rounded border border-background object-cover" />
                ) : (
                  <div key={i} className="flex h-7 w-7 items-center justify-center rounded border border-background bg-secondary text-[8px] font-medium">
                    VID
                  </div>
                )
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">{media.length} items</span>
          </>
        ) : (
          <span className="text-[10px] italic text-muted-foreground/40">No media</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1 p-1.5">
      {/* Existing items */}
      {media.map((m, i) => (
        <div key={i} className="flex items-center gap-1">
          {m.type === 'image' ? (
            <img src={m.url} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary text-[7px]">VID</div>
          )}
          <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">{m.url.replace(/^https?:\/\//, '').slice(0, 30)}</span>
          <button onClick={() => removeItem(i)} className="shrink-0 p-0.5 text-red-400 hover:text-red-500">
            <X size={10} />
          </button>
        </div>
      ))}
      {/* Add new */}
      <div className="flex items-center gap-1">
        <input
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Paste URL..."
          onKeyDown={(e) => { if (e.key === 'Enter') addItem('image', newUrl); }}
          className="min-w-0 flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] outline-none"
        />
        <button
          onClick={() => addItem('image', newUrl)}
          className="shrink-0 rounded bg-secondary p-0.5 text-muted-foreground hover:text-foreground"
          title="Add image"
        >
          <Plus size={10} />
        </button>
        <button
          onClick={() => addItem('video', newUrl)}
          className="shrink-0 rounded bg-secondary px-1 py-0.5 text-[8px] font-medium text-muted-foreground hover:text-foreground"
          title="Add video"
        >
          VID
        </button>
      </div>
      <button onClick={() => setExpanded(false)} className="text-[10px] text-muted-foreground hover:text-foreground">
        Collapse
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Video cell — URL + embed indicator
// ---------------------------------------------------------------------------

const VideoCell = ({
  value,
  eventId,
  field,
  onChange,
}: {
  value: string;
  eventId: string;
  field: string;
  onChange: (id: string, field: string, value: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    if (local.trim() !== value) onChange(eventId, field, local.trim());
  };

  if (editing) {
    return (
      <div className="p-1">
        <input
          ref={ref}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setEditing(false); setLocal(value); }
          }}
          placeholder="Paste video URL..."
          className="w-full rounded border border-primary/30 bg-background px-1.5 py-1 text-xs outline-none"
        />
      </div>
    );
  }

  const platform = value.includes('tiktok') ? 'TikTok'
    : value.includes('instagram') ? 'Instagram'
    : value.includes('youtube') || value.includes('youtu.be') ? 'YouTube'
    : value.includes('facebook') || value.includes('fb.') ? 'Facebook'
    : value ? 'Video' : '';

  return (
    <div
      onClick={() => { setLocal(value); setEditing(true); setTimeout(() => ref.current?.focus(), 0); }}
      className="flex cursor-pointer items-center gap-1.5 px-1.5 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/20"
    >
      {value ? (
        <>
          <span className="rounded bg-red-500/10 px-1 py-0.5 text-[9px] font-medium text-red-600">{platform}</span>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="truncate text-[10px] text-muted-foreground hover:text-foreground"
          >
            {value.replace(/^https?:\/\//, '').slice(0, 25)}…
          </a>
        </>
      ) : (
        <span className="text-[10px] italic text-muted-foreground/40">Add video URL</span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Status cell — inline dropdown
// ---------------------------------------------------------------------------

const StatusCell = ({
  value,
  eventId,
  onModerate,
}: {
  value: string;
  eventId: string;
  onModerate: (id: string, status: ModerationTab) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);

  const tone = value === 'pending' ? 'warning' as const
    : value === 'rejected' ? 'default' as const
    : 'success' as const;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full px-1 py-0.5">
        <Badge tone={tone} className="cursor-pointer text-[9px] px-1.5 py-0 hover:ring-1 hover:ring-primary/30">
          {value || 'approved'}
        </Badge>
      </button>
    );
  }

  return (
    <select
      autoFocus
      value={value || 'approved'}
      onChange={(e) => {
        void onModerate(eventId, e.target.value as ModerationTab);
        setOpen(false);
      }}
      onBlur={() => setOpen(false)}
      className="w-full border-0 bg-blue-50 px-1 py-1 text-[10px] font-medium outline-none dark:bg-blue-950/20"
    >
      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
};

// ---------------------------------------------------------------------------
// Generic cell (text, date, number, select, textarea, boolean, readonly)
// ---------------------------------------------------------------------------

// Navigate to adjacent cell helper
const navigateCell = (from: HTMLElement, direction: 'up' | 'down' | 'left' | 'right') => {
  const td = from.closest('td');
  if (!td) return;
  const tr = td.closest('tr');
  if (!tr) return;
  const idx = Array.from(tr.children).indexOf(td);

  let targetTd: Element | null = null;
  if (direction === 'left') targetTd = td.previousElementSibling;
  else if (direction === 'right') targetTd = td.nextElementSibling;
  else {
    const targetRow = direction === 'up' ? tr.previousElementSibling : tr.nextElementSibling;
    if (targetRow) targetTd = targetRow.children[idx] ?? null;
  }

  if (targetTd) {
    const input = targetTd.querySelector<HTMLElement>('input, textarea, select');
    input?.focus();
  }
};

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
  const [local, setLocal] = useState(String(value ?? ''));
  const synced = useRef(true);

  // Sync external value changes (e.g. after save) into local state
  useEffect(() => {
    if (synced.current) setLocal(String(value ?? ''));
  }, [value]);

  const commit = (el: HTMLElement) => {
    const strValue = local.trim();
    synced.current = true;
    if (strValue !== String(value ?? '')) {
      onChange(eventId, col.key, strValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && col.type !== 'textarea') {
      e.preventDefault();
      commit(e.target as HTMLElement);
      navigateCell(e.target as HTMLElement, e.shiftKey ? 'up' : 'down');
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      commit(e.target as HTMLElement);
      navigateCell(e.target as HTMLElement, e.shiftKey ? 'left' : 'right');
    }
    if (e.key === 'Escape') {
      setLocal(String(value ?? ''));
      synced.current = true;
      (e.target as HTMLElement).blur();
    }
    // Arrow key navigation when not mid-edit for non-text inputs
    if (col.type === 'date' || col.type === 'number') {
      if (e.key === 'ArrowUp') { e.preventDefault(); commit(e.target as HTMLElement); navigateCell(e.target as HTMLElement, 'up'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); commit(e.target as HTMLElement); navigateCell(e.target as HTMLElement, 'down'); }
    }
  };

  const cellClass = 'block min-w-0 w-full border-0 bg-transparent px-2 py-1.5 text-xs outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-primary/40 dark:focus:bg-blue-950/20';

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
          strVal || ''
        )}
      </div>
    );
  }

  if (col.type === 'select' && col.options) {
    return (
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(eventId, col.key, e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(cellClass, 'cursor-pointer')}
      >
        <option value="">—</option>
        {col.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  if (col.type === 'textarea') {
    return (
      <textarea
        value={local}
        onChange={(e) => { setLocal(e.target.value); synced.current = false; }}
        onBlur={(e) => commit(e.target)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setLocal(String(value ?? '')); synced.current = true; e.currentTarget.blur(); }
          if (e.key === 'Tab') { e.preventDefault(); commit(e.target as HTMLElement); navigateCell(e.target as HTMLElement, e.shiftKey ? 'left' : 'right'); }
        }}
        rows={1}
        onFocus={(e) => { e.currentTarget.rows = 3; }}
        className={cn(cellClass, 'resize-none')}
        placeholder="..."
      />
    );
  }

  return (
    <input
      type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
      value={local}
      onChange={(e) => { setLocal(e.target.value); synced.current = false; }}
      onBlur={(e) => commit(e.target)}
      onKeyDown={handleKeyDown}
      step={col.type === 'number' ? 'any' : undefined}
      className={cellClass}
      placeholder="..."
    />
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, string | boolean | EventMedia[]>>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
    new Set(['Basic', 'Dates', 'Location', 'Classification', 'Price', 'Media', 'Source', 'Contact', 'Flags']),
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [page, setPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Escape exits fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const today = useMemo(() => todayIso(), []);

  const cities = useMemo(() => {
    const set = new Set(events.map((e) => e.city).filter(Boolean));
    return Array.from(set).sort();
  }, [events]);

  const groups = useMemo(() => {
    const set = new Set(COLUMNS.map((c) => c.group));
    return Array.from(set);
  }, []);

  const titleCol = COLUMNS.find((c) => c.key === 'title')!;
  const visibleColumns = useMemo(
    () => COLUMNS.filter((c) => c.key !== 'title' && visibleGroups.has(c.group)),
    [visibleGroups],
  );

  // Fixed columns: checkbox(32) + thumb(40) + status(70) + title(220) + actions(90) = 452
  const FIXED_WIDTH = 32 + 40 + 70 + 220 + 90;
  const tableWidth = FIXED_WIDTH + visibleColumns.reduce((sum, c) => sum + parseInt(c.width), 0);

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

  const PAGE_SIZE = 100;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedEvents = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => {
    setPage(0);
  }, [filtered]);

  const onCellChange = useCallback((id: string, field: string, value: string | boolean | EventMedia[]) => {
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
      await onSave(id, changes as Partial<ArtEvent>);
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
    const val = Object.getOwnPropertyDescriptor(event, field)?.value;
    return val as string | number | boolean | undefined;
  };

  const getMediaValue = (event: ArtEvent): EventMedia[] => {
    const changes = pendingChanges[event.id];
    if (changes && 'media' in changes) return changes.media as EventMedia[];
    return event.media || [];
  };

  const handleBatchAction = (status: ModerationTab) => {
    const ids = Array.from(filters.selectedIds);
    if (status === 'rejected') setConfirmAction({ ids, status });
    else void onBatchModerate(ids, status).then(() => filters.clearSelection());
  };

  // Render the right cell type
  const renderCell = (event: ArtEvent, col: ColDef) => {
    if (col.type === 'image') {
      return (
        <ImageCell
          value={String(getCellValue(event, col.key) ?? '')}
          eventId={event.id}
          field={col.key}
          onChange={onCellChange}
        />
      );
    }
    if (col.type === 'gallery') {
      return (
        <GalleryCell
          media={getMediaValue(event)}
          eventId={event.id}
          onMediaChange={(id, media) => onCellChange(id, 'media', media)}
        />
      );
    }
    if (col.type === 'video') {
      return (
        <VideoCell
          value={String(getCellValue(event, col.key) ?? '')}
          eventId={event.id}
          field={col.key}
          onChange={onCellChange}
        />
      );
    }
    return (
      <Cell
        value={getCellValue(event, col.key)}
        col={col}
        eventId={event.id}
        onChange={onCellChange}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'min-w-0 space-y-3',
        isFullscreen && 'fixed inset-0 z-50 overflow-auto bg-background p-4',
      )}
    >
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

        <button
          onClick={() => setIsFullscreen((v) => !v)}
          className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </button>

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
      <div
        className="overflow-auto rounded-md border border-border"
        style={{ maxHeight: isFullscreen ? 'calc(100vh - 140px)' : 'calc(100vh - 220px)' }}
      >
        <table className="text-xs" style={{ tableLayout: 'fixed', width: `${tableWidth}px`, borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead className="sticky top-0 z-10 bg-secondary/80 backdrop-blur">
            <tr>
              <th className="sticky left-0 z-20 w-8 border-b border-r border-border bg-secondary/80 px-1.5 py-2 backdrop-blur">
                <input
                  type="checkbox"
                  checked={filteredIds.length > 0 && filteredIds.every((id) => filters.selectedIds.has(id))}
                  onChange={() => filters.toggleAll(filteredIds)}
                  className="h-3.5 w-3.5 rounded border-border"
                />
              </th>
              <th className="sticky left-8 z-20 w-10 border-b border-r border-border bg-secondary/80 px-1 py-2 backdrop-blur" />
              <th className="sticky left-[72px] z-20 w-[70px] border-b border-r border-border bg-secondary/80 px-1.5 py-2 text-left backdrop-blur">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</span>
              </th>
              <th
                className="sticky left-[142px] z-20 border-b border-r border-border bg-secondary/80 px-1.5 py-2 text-left backdrop-blur"
                style={{ width: '220px', minWidth: '220px', maxWidth: '220px' }}
              >
                <button
                  type="button"
                  onClick={() => filters.toggleSort('title')}
                  className="inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Title
                  {filters.sort.key === 'title' && (
                    filters.sort.direction === 'asc'
                      ? <ArrowUp size={10} />
                      : <ArrowDown size={10} />
                  )}
                </button>
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="border-b border-r border-border px-1.5 py-2 text-left"
                  style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
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
              <th className="sticky right-0 z-20 w-[90px] border-b border-l border-border bg-secondary/80 px-1 py-2 text-center backdrop-blur">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 4} className="px-4 py-12 text-center text-muted-foreground">
                  No events found.
                </td>
              </tr>
            ) : (
              pagedEvents.map((event, rowIdx) => {
                const changed = hasPending(event.id);
                const saving = savingIds.has(event.id);
                return (
                  <tr
                    key={event.id}
                    className={cn(
                      'border-b border-border/40 transition-colors',
                      changed && 'bg-amber-50/60 dark:bg-amber-950/10',
                      filters.selectedIds.has(event.id) && 'bg-blue-50/60 dark:bg-blue-950/10',
                      !changed && !filters.selectedIds.has(event.id) && rowIdx % 2 === 1 && 'bg-secondary/15',
                      !changed && !filters.selectedIds.has(event.id) && 'hover:bg-blue-50/40 dark:hover:bg-blue-950/15',
                    )}
                  >
                    <td className="sticky left-0 z-[5] border-r border-border/40 bg-inherit px-1.5 py-0">
                      <input
                        type="checkbox"
                        checked={filters.selectedIds.has(event.id)}
                        onChange={() => filters.toggleSelection(event.id)}
                        className="h-3.5 w-3.5 rounded border-border"
                      />
                    </td>
                    <td className="sticky left-8 z-[5] border-r border-border/40 bg-inherit px-1 py-0.5">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt="" className="h-7 w-7 rounded object-cover" />
                      ) : (
                        <div className="h-7 w-7 rounded bg-secondary" />
                      )}
                    </td>
                    {/* Status — editable dropdown */}
                    <td className="sticky left-[72px] z-[5] border-r border-border/40 bg-inherit">
                      <StatusCell
                        value={event.moderation_status || 'approved'}
                        eventId={event.id}
                        onModerate={onModerate}
                      />
                    </td>
                    {/* Title — frozen */}
                    <td className="sticky left-[142px] z-[5] border-r border-border/40 bg-inherit p-0">
                      <div className="overflow-hidden">{renderCell(event, titleCol)}</div>
                    </td>
                    {/* Dynamic cells */}
                    {visibleColumns.map((col) => (
                      <td key={col.key} className="border-r border-border/30 p-0">
                        <div className="overflow-hidden">{renderCell(event, col)}</div>
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

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <span className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} events
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

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
