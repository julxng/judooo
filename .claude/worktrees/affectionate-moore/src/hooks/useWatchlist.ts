import { useEffect, useState } from 'react';
import type { User } from '@/features/auth/types/auth.types';
import { api } from '@/services/api';
import { useNotice } from '@/app/providers/NoticeProvider';

export const useWatchlist = (currentUser: User | null) => {
  const { notify } = useNotice();
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setSavedEventIds([]);
      return;
    }

    const loadWatchlist = async () => {
      const ids = await api.getWatchlist(currentUser.id);
      setSavedEventIds(ids);
    };

    void loadWatchlist();
  }, [currentUser]);

  const toggleSavedEvent = async (eventId: string): Promise<'missing-user' | 'updated'> => {
    if (!currentUser) {
      return 'missing-user';
    }

    const previous = savedEventIds;
    const shouldSave = !previous.includes(eventId);
    const optimistic = shouldSave ? [...previous, eventId] : previous.filter((id) => id !== eventId);
    setSavedEventIds(optimistic);

    const persistedState = await api.toggleWatchlist(currentUser.id, eventId);
    if (persistedState === null) {
      setSavedEventIds(previous);
      notify('Failed to update your saved route.', 'error');
      return 'updated';
    }

    setSavedEventIds((current) => {
      const exists = current.includes(eventId);
      if (persistedState && !exists) return [...current, eventId];
      if (!persistedState && exists) return current.filter((id) => id !== eventId);
      return current;
    });

    notify(persistedState ? 'Added to your route.' : 'Removed from your route.', 'success');
    return 'updated';
  };

  return {
    savedEventIds,
    toggleSavedEvent,
  };
};
