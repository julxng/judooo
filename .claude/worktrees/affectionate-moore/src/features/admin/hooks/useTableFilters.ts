'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ModerationTab, SortDirection, TableSort } from '@/features/admin/types/admin.types';

export const useTableFilters = (defaultSortKey = 'title') => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ModerationTab>('pending');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<TableSort>({ key: defaultSortKey, direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSort = useCallback((key: string) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) return new Set<string>();
      return new Set(ids);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  return {
    search, setSearch,
    statusFilter, setStatusFilter,
    cityFilter, setCityFilter,
    categoryFilter, setCategoryFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    sort, toggleSort,
    selectedIds, toggleSelection, toggleAll, clearSelection, selectedCount,
  };
};
