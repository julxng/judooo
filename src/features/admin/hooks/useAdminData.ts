'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth, useLanguage } from '@/app/providers';
import { canAccessAdmin, getPendingRoleTarget, isCreatorApplicationPending } from '@/features/auth/utils/roles';
import { useEventsCatalog } from '@/features/events/hooks/useEventsCatalog';
import type { User } from '@/features/auth/types/auth.types';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import type { AdminCounts, ModerationTab } from '@/features/admin/types/admin.types';
import { api } from '@/services/api';

export const useAdminData = () => {
  const { currentUser, openAuthDialog } = useAuth();
  const { language } = useLanguage();
  const { events, refresh, createEvent, updateEvent, uploadImage } = useEventsCatalog([], {
    currentUser,
    onAuthRequired: openAuthDialog,
    skipAutoRefresh: true,
  });

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshArtworks = useCallback(async () => {
    const next = await api.getArtworks();
    setArtworks(next);
  }, []);

  const refreshProfiles = useCallback(async () => {
    const next = await api.getProfiles();
    setProfiles(next);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([refresh(), refreshArtworks(), refreshProfiles()]);
    setIsLoading(false);
  }, [refresh, refreshArtworks, refreshProfiles]);

  useEffect(() => {
    if (!currentUser || !canAccessAdmin(currentUser.role)) return;
    void refreshAll();
  }, [currentUser, refreshAll]);

  const creatorApplications = useMemo(
    () => profiles.filter((p) => isCreatorApplicationPending(p.role)),
    [profiles],
  );

  const counts: AdminCounts = useMemo(() => ({
    pendingEvents: events.filter((e) => !e.moderation_status || e.moderation_status === 'pending').length,
    approvedEvents: events.filter((e) => e.moderation_status === 'approved').length,
    rejectedEvents: events.filter((e) => e.moderation_status === 'rejected').length,
    pendingArtworks: artworks.filter((a) => !a.moderation_status || a.moderation_status === 'pending').length,
    approvedArtworks: artworks.filter((a) => a.moderation_status === 'approved').length,
    rejectedArtworks: artworks.filter((a) => a.moderation_status === 'rejected').length,
    pendingApplications: creatorApplications.length,
    totalUsers: profiles.length,
  }), [events, artworks, creatorApplications, profiles]);

  const moderateEvent = useCallback(async (id: string, status: ModerationTab) => {
    await updateEvent(id, { moderation_status: status });
  }, [updateEvent]);

  const batchModerateEvents = useCallback(async (ids: string[], status: ModerationTab) => {
    for (const id of ids) {
      await updateEvent(id, { moderation_status: status });
    }
  }, [updateEvent]);

  const deleteEvent = useCallback(async (id: string) => {
    const success = await api.deleteEvent(id);
    if (success) await refresh();
  }, [refresh]);

  const batchDeleteEvents = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      await api.deleteEvent(id);
    }
    await refresh();
  }, [refresh]);

  const moderateArtwork = useCallback(async (id: string, status: ModerationTab) => {
    const updated = await api.updateArtwork(id, { moderation_status: status });
    if (updated) {
      setArtworks((cur) => cur.map((a) => (a.id === id ? updated : a)));
    }
  }, []);

  const batchModerateArtworks = useCallback(async (ids: string[], status: ModerationTab) => {
    for (const id of ids) {
      await api.updateArtwork(id, { moderation_status: status });
    }
    await refreshArtworks();
  }, [refreshArtworks]);

  const handleRoleApplication = useCallback(async (profile: User, approved: boolean) => {
    const nextRole = approved ? getPendingRoleTarget(profile.role) || 'art_lover' : 'art_lover';
    await api.syncUser({ ...profile, role: nextRole });
    await refreshProfiles();
  }, [refreshProfiles]);

  const updateUserRole = useCallback(async (profile: User, newRole: User['role']) => {
    await api.syncUser({ ...profile, role: newRole });
    await refreshProfiles();
  }, [refreshProfiles]);

  return {
    currentUser,
    language,
    events,
    artworks,
    profiles,
    creatorApplications,
    counts,
    isLoading,
    eventOps: { createEvent, updateEvent, uploadImage, moderateEvent, batchModerateEvents, deleteEvent, batchDeleteEvents },
    artworkOps: { moderateArtwork, batchModerateArtworks },
    profileOps: { handleRoleApplication, updateUserRole },
    refreshAll,
  };
};
