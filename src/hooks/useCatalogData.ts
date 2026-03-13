import { useEffect, useState } from 'react';
import type { User } from '@/features/auth/types/auth.types';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import { api } from '@/services/api';
import { supabase } from '@/services/supabase/client';
import { useNotice } from '@/app/providers/NoticeProvider';
import { canAccessAdmin } from '@/features/auth/utils/roles';
import { initialArtworks } from '@/features/marketplace/services/artworkFixtures';
import { initialEvents } from '@/features/events/services/eventFixtures';

export const useCatalogData = (currentUser: User | null) => {
  const { notify } = useNotice();
  const [events, setEvents] = useState<ArtEvent[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbReadError, setDbReadError] = useState<string | null>(null);
  const [pendingWritesCount, setPendingWritesCount] = useState(0);

  const refreshPendingWrites = () => setPendingWritesCount(api.getPendingWritesCount());

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setDbReadError(null);

      try {
        const [fetchedEvents, fetchedArtworks] = await Promise.all([api.getEvents(), api.getArtworks()]);
        setEvents(fetchedEvents);
        setArtworks(fetchedArtworks);

        if (supabase && fetchedArtworks.length === 0) {
          const diagnostics = await supabase.from('artworks').select('*', { count: 'exact', head: true });
          if (diagnostics.error) {
            setDbReadError(`Supabase artworks read failed: ${diagnostics.error.message}`);
          } else if ((diagnostics.count || 0) > 0) {
            setDbReadError(
              `Supabase has ${diagnostics.count} artworks, but the UI received none. Check FE mapping or filtering.`,
            );
          }
        }
      } catch (error) {
        console.error('Failed to fetch catalog data', error);
        setDbReadError('Failed to fetch data from Supabase. Showing local sample data.');
        setEvents(initialEvents);
        setArtworks(initialArtworks);
        notify('Falling back to local sample data.', 'warning');
      } finally {
        setIsLoading(false);
        refreshPendingWrites();
      }
    };

    void fetchData();
  }, [notify]);

  useEffect(() => {
    if (pendingWritesCount === 0) return;
    const interval = window.setInterval(refreshPendingWrites, 3000);
    return () => window.clearInterval(interval);
  }, [pendingWritesCount]);

  const getWritableUser = (): User | null => {
    if (!currentUser) {
      notify('Sign in to continue.', 'warning');
      return null;
    }
    return currentUser;
  };

  const createEvent = async (event: ArtEvent): Promise<ArtEvent | null> => {
    const user = getWritableUser();
    if (!user) return null;

    const created = await api.createEvent({ ...event, createdBy: user.id });
    if (!created) {
      notify('Failed to save event to Supabase. Check role and RLS policies.', 'error');
      return null;
    }

    setEvents((current) => [created, ...current]);
    refreshPendingWrites();
    notify('Event saved.', 'success');
    return created;
  };

  const createArtwork = async (artwork: Artwork): Promise<Artwork | null> => {
    const user = getWritableUser();
    if (!user) return null;

    const created = await api.createArtwork({ ...artwork, createdBy: user.id });
    if (!created) {
      notify('Failed to save artwork to Supabase. Check role and RLS policies.', 'error');
      return null;
    }

    setArtworks((current) => [created, ...current]);
    refreshPendingWrites();
    notify('Artwork saved.', 'success');
    return created;
  };

  const updateEvent = async (id: string, data: Partial<ArtEvent>): Promise<ArtEvent | null> => {
    if (!currentUser || !canAccessAdmin(currentUser.role)) {
      notify('Only gallery, artist, or admin accounts can edit events.', 'warning');
      return null;
    }

    const updated = await api.updateEvent(id, data);
    if (!updated) {
      notify('Failed to update event.', 'error');
      return null;
    }

    setEvents((current) => current.map((event) => (event.id === id ? updated : event)));
    refreshPendingWrites();
    notify('Event updated.', 'success');
    return updated;
  };

  const uploadEvents = async (newEvents: ArtEvent[]) => {
    const user = getWritableUser();
    if (!user) return [];

    const created = await Promise.all(
      newEvents.map((event) => api.createEvent({ ...event, createdBy: user.id })),
    );
    const successful = created.filter((event): event is ArtEvent => Boolean(event));
    if (successful.length > 0) {
      setEvents((current) => [...successful, ...current]);
      refreshPendingWrites();
      notify(`Saved ${successful.length}/${newEvents.length} events.`, 'success');
    }
    return successful;
  };

  const uploadArtworks = async (newArtworks: Artwork[]) => {
    const user = getWritableUser();
    if (!user) return [];

    const created = await Promise.all(
      newArtworks.map((artwork) => api.createArtwork({ ...artwork, createdBy: user.id })),
    );
    const successful = created.filter((artwork): artwork is Artwork => Boolean(artwork));
    if (successful.length > 0) {
      setArtworks((current) => [...successful, ...current]);
      refreshPendingWrites();
      notify(`Saved ${successful.length}/${newArtworks.length} artworks.`, 'success');
    }
    return successful;
  };

  const placeBid = async (artworkId: string, amount: number): Promise<boolean> => {
    if (!currentUser) {
      notify('Sign in to place a bid.', 'warning');
      return false;
    }

    const success = await api.placeBid(artworkId, currentUser.id, amount);
    if (!success) {
      notify('Bid failed. Try again after checking your connection.', 'error');
      return false;
    }

    setArtworks((current) =>
      current.map((artwork) =>
        artwork.id === artworkId
          ? {
              ...artwork,
              currentBid: amount,
              bidCount: (artwork.bidCount || 0) + 1,
            }
          : artwork,
      ),
    );
    refreshPendingWrites();
    return true;
  };

  return {
    events,
    artworks,
    isLoading,
    dbReadError,
    pendingWritesCount,
    createEvent,
    createArtwork,
    updateEvent,
    uploadEvents,
    uploadArtworks,
    uploadImage: api.uploadImage,
    placeBid,
  };
};
