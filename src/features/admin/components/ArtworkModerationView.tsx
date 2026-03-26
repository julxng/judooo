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
import { getArtworkTitle } from '@/features/marketplace/utils/artwork-utils';
import { useTableFilters } from '@/features/admin/hooks/useTableFilters';
import { filterByModerationStatus } from '@/features/admin/utils/admin-utils';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import type { Locale } from '@/lib/i18n/translations';
import type { ModerationTab } from '@/features/admin/types/admin.types';

type ArtworkModerationViewProps = {
  artworks: Artwork[];
  language: Locale;
  onModerate: (id: string, status: ModerationTab) => Promise<void>;
  onBatchModerate: (ids: string[], status: ModerationTab) => Promise<void>;
  onEdit: (artwork: Artwork) => void;
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

export const ArtworkModerationView = ({
  artworks,
  language,
  onModerate,
  onBatchModerate,
  onEdit,
}: ArtworkModerationViewProps) => {
  const filters = useTableFilters('title');
  const [confirmAction, setConfirmAction] = useState<{ ids: string[]; status: ModerationTab } | null>(null);

  const mediums = useMemo(() => {
    const set = new Set(artworks.map((a) => a.medium).filter(Boolean));
    return Array.from(set).sort();
  }, [artworks]);

  const filtered = useMemo(() => {
    let result = artworks.filter(filterByModerationStatus(filters.statusFilter));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          getArtworkTitle(a, language).toLowerCase().includes(q) ||
          a.artist?.toLowerCase().includes(q) ||
          a.medium?.toLowerCase().includes(q),
      );
    }
    if (filters.categoryFilter) {
      result = result.filter((a) => a.medium === filters.categoryFilter);
    }

    const { key, direction } = filters.sort;
    const getField = (a: Artwork, k: string): string | number => {
      if (k === 'title') return getArtworkTitle(a, language);
      if (k === 'artist') return a.artist ?? '';
      if (k === 'medium') return a.medium ?? '';
      if (k === 'price') return a.price ?? 0;
      return '';
    };
    result.sort((a, b) => {
      const aVal = getField(a, key);
      const bVal = getField(b, key);
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return direction === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [artworks, filters, language]);

  const filteredIds = useMemo(() => filtered.map((a) => a.id), [filtered]);

  const handleBatchAction = (status: ModerationTab) => {
    const ids = Array.from(filters.selectedIds);
    if (status === 'rejected') {
      setConfirmAction({ ids, status });
    } else {
      void onBatchModerate(ids, status).then(() => filters.clearSelection());
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return '-';
    return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Artwork Moderation</h1>
        <Tabs value={filters.statusFilter} options={statusTabs} onChange={(v) => { filters.setStatusFilter(v); filters.clearSelection(); }} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search artworks..."
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={filters.categoryFilter} onChange={(e) => filters.setCategoryFilter(e.target.value)}>
          <option value="">All mediums</option>
          {mediums.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
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
                <SortHeader label="Artist" sortKey="artist" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="hidden px-3 py-3 text-left md:table-cell">
                <SortHeader label="Medium" sortKey="medium" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="hidden px-3 py-3 text-left lg:table-cell">
                <SortHeader label="Price" sortKey="price" currentSort={filters.sort} onToggle={filters.toggleSort} />
              </th>
              <th className="hidden px-3 py-3 text-left lg:table-cell">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                  No {filters.statusFilter} artworks found.
                </td>
              </tr>
            ) : (
              filtered.map((artwork) => (
                <tr
                  key={artwork.id}
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-secondary/20',
                    filters.selectedIds.has(artwork.id) && 'bg-secondary/40',
                  )}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={filters.selectedIds.has(artwork.id)}
                      onChange={() => filters.toggleSelection(artwork.id)}
                      className="h-4 w-4 rounded border-border"
                    />
                  </td>
                  <td className="px-3 py-3">
                    {artwork.imageUrl ? (
                      <img src={artwork.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-secondary" />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{getArtworkTitle(artwork, language)}</div>
                    {artwork.sourceUrl && (
                      <a
                        href={artwork.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink size={10} /> source
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{artwork.artist}</td>
                  <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">{artwork.medium}</td>
                  <td className="hidden px-3 py-3 text-muted-foreground lg:table-cell">
                    {formatPrice(artwork.price)}
                  </td>
                  <td className="hidden px-3 py-3 lg:table-cell">
                    <Badge tone={statusBadgeTone(artwork.moderation_status)}>
                      {artwork.moderation_status || 'approved'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(artwork)}>
                        <Pencil size={14} />
                      </Button>
                      {filters.statusFilter === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => void onModerate(artwork.id, 'approved')}>
                            <Check size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void onModerate(artwork.id, 'rejected')}>
                            <X size={14} />
                          </Button>
                        </>
                      )}
                      {filters.statusFilter === 'rejected' && (
                        <Button size="sm" variant="ghost" onClick={() => void onModerate(artwork.id, 'approved')}>
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

      <p className="text-xs text-muted-foreground">{filtered.length} artwork{filtered.length !== 1 ? 's' : ''}</p>

      {confirmAction && (
        <ConfirmDialog
          title="Reject artworks"
          message={`Are you sure you want to reject ${confirmAction.ids.length} artwork(s)?`}
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
