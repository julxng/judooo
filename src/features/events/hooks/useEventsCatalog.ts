'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNotice } from '@/app/providers/NoticeProvider';
import { api } from '@/services/api';
import { hydrateLocalCatalogSnapshot } from '@/services/api/localDb';
import type { User } from '@/features/auth/types/auth.types';
import type { ArtEvent } from '../types/event.types';

const ROUTE_EVENTS_KEY_PREFIX = 'judooo.route-events';

const readStoredIds = (key: string): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
};

const writeStoredIds = (key: string, values: string[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(new Set(values))));
};

const getRouteStorageKey = (userId: string) => `${ROUTE_EVENTS_KEY_PREFIX}.${userId}`;

interface UseEventsCatalogOptions {
  currentUser?: User | null;
  onAuthRequired?: () => void;
  skipAutoRefresh?: boolean;
}

export const useEventsCatalog = (
  initialEvents: ArtEvent[] = [],
  options: UseEventsCatalogOptions = {},
) => {
  const { currentUser = null, onAuthRequired, skipAutoRefresh = false } = options;
  const { notify } = useNotice();
  const [events, setEvents] = useState<ArtEvent[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(initialEvents.length === 0);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [routeEventIds, setRouteEventIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialEvents.length === 0) return;
    hydrateLocalCatalogSnapshot({ events: initialEvents });
  }, [initialEvents]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const catalog = await api.getEvents();
      setEvents(catalog);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (skipAutoRefresh) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipAutoRefresh]);

  useEffect(() => {
    if (!currentUser) {
      setSavedEventIds([]);
      setRouteEventIds([]);
      return;
    }

    const loadSavedEvents = async () => {
      const ids = await api.getWatchlist(currentUser.id);
      setSavedEventIds(ids);
    };

    void loadSavedEvents();
    setRouteEventIds(readStoredIds(getRouteStorageKey(currentUser.id)));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    writeStoredIds(getRouteStorageKey(currentUser.id), routeEventIds);
  }, [currentUser, routeEventIds]);

  const requireAuth = () => {
    if (currentUser) return true;
    notify('Sign in to save events and build your route.', 'warning');
    onAuthRequired?.();
    return false;
  };

  const createEvent = async (event: Partial<ArtEvent>) => {
    const created = await api.createEvent(event);
    if (created) {
      setEvents((current) => [created, ...current.filter((item) => item.id !== created.id)]);
    }
    return created;
  };

  const updateEvent = async (id: string, next: Partial<ArtEvent>) => {
    const updated = await api.updateEvent(id, next);
    if (updated) {
      setEvents((current) => current.map((item) => (item.id === id ? updated : item)));
    }
    return updated;
  };

  const toggleSavedEvent = async (eventId: string) => {
    if (!requireAuth() || !currentUser) return 'auth-required' as const;

    const previousSavedIds = savedEventIds;
    const isSaved = previousSavedIds.includes(eventId);
    const nextSavedIds = isSaved
      ? previousSavedIds.filter((id) => id !== eventId)
      : [...previousSavedIds, eventId];

    setSavedEventIds(nextSavedIds);
    if (isSaved) {
      setRouteEventIds((current) => current.filter((id) => id !== eventId));
    }

    const persistedState = await api.toggleWatchlist(currentUser.id, eventId);
    if (persistedState === null) {
      setSavedEventIds(previousSavedIds);
      notify('Failed to update your saved events.', 'error');
      return 'updated' as const;
    }

    setSavedEventIds((current) => {
      const exists = current.includes(eventId);
      if (persistedState && !exists) return [...current, eventId];
      if (!persistedState && exists) return current.filter((id) => id !== eventId);
      return current;
    });

    notify(persistedState ? 'Saved to your route.' : 'Removed from your saved events.', 'success');
    return 'updated' as const;
  };

  const toggleRouteEvent = async (eventId: string) => {
    if (!requireAuth()) return 'auth-required' as const;

    if (!savedEventIds.includes(eventId)) {
      await toggleSavedEvent(eventId);
    }

    setRouteEventIds((current) =>
      current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId],
    );
    return 'updated' as const;
  };

  const moveRouteEvent = (eventId: string, direction: 'up' | 'down') => {
    setRouteEventIds((current) => {
      const index = current.indexOf(eventId);
      if (index === -1) return current;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const removeFromRoute = (eventId: string) => {
    setRouteEventIds((current) => current.filter((id) => id !== eventId));
  };

  const routeEvents = useMemo(
    () =>
      routeEventIds
        .map((eventId) => events.find((event) => event.id === eventId))
        .filter((event): event is ArtEvent => Boolean(event)),
    [events, routeEventIds],
  );

  const savedEvents = useMemo(
    () => events.filter((event) => savedEventIds.includes(event.id)),
    [events, savedEventIds],
  );

  return {
    events,
    isLoading,
    refresh,
    savedEventIds,
    routeEventIds,
    savedEvents,
    routeEvents,
    createEvent,
    updateEvent,
    uploadImage: api.uploadImage,
    toggleSavedEvent,
    toggleRouteEvent,
    moveRouteEvent,
    removeFromRoute,
  };
};
