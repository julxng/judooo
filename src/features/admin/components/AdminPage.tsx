'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, ChevronDown, ChevronRight, ExternalLink, Pencil, X } from 'lucide-react';
import { useAuth, useLanguage } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Field } from '@/components/shared/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { canAccessAdmin, getPendingRoleTarget, getRoleLabel, isCreatorApplicationPending } from '@/features/auth/utils/roles';
import { useEventsCatalog } from '@/features/events/hooks/useEventsCatalog';
import { getEventTitle } from '@/features/events/utils/event-utils';
import { getArtworkTitle } from '@/features/marketplace/utils/artwork-utils';
import type { User } from '@/features/auth/types/auth.types';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

type ModerationTab = 'pending' | 'approved' | 'rejected';

const emptyForm: Partial<ArtEvent> = {
  category: 'exhibition',
  city: 'Ho Chi Minh City',
  location: 'Ho Chi Minh City',
  lat: 10.7769,
  lng: 106.7009,
  moderation_status: 'approved',
};

interface AdminPageProps {
  initialEvents?: ArtEvent[];
  initialArtworks?: Artwork[];
}

type EventGroup = {
  gallery: string;
  sourceUrl: string | undefined;
  events: ArtEvent[];
};

type ArtworkGroup = {
  artist: string;
  sourceUrl: string | undefined;
  artworks: Artwork[];
};

const groupEventsByGallery = (events: ArtEvent[]): EventGroup[] => {
  const map = new Map<string, EventGroup>();
  for (const event of events) {
    const key = event.organizer || 'Unknown Gallery';
    const existing = map.get(key);
    if (existing) {
      existing.events.push(event);
    } else {
      map.set(key, { gallery: key, sourceUrl: event.sourceUrl, events: [event] });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.events.length - a.events.length);
};

const groupArtworksByArtist = (artworks: Artwork[]): ArtworkGroup[] => {
  const map = new Map<string, ArtworkGroup>();
  for (const artwork of artworks) {
    const key = artwork.artist || 'Unknown Artist';
    const existing = map.get(key);
    if (existing) {
      existing.artworks.push(artwork);
    } else {
      map.set(key, { artist: key, sourceUrl: artwork.sourceUrl, artworks: [artwork] });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.artworks.length - a.artworks.length);
};

export const AdminPage = ({ initialEvents = [], initialArtworks = [] }: AdminPageProps) => {
  const { currentUser, openAuthDialog } = useAuth();
  const { language } = useLanguage();
  const { events, refresh, createEvent, updateEvent, uploadImage } = useEventsCatalog(initialEvents, {
    currentUser,
    onAuthRequired: openAuthDialog,
    skipAutoRefresh: true,
  });
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [form, setForm] = useState<Partial<ArtEvent>>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bulkRows, setBulkRows] = useState('');
  const [eventTab, setEventTab] = useState<ModerationTab>('pending');
  const [artworkTab, setArtworkTab] = useState<ModerationTab>('pending');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ArtEvent>>({});

  const refreshArtworks = async () => {
    const nextArtworks = await api.getArtworks();
    setArtworks(nextArtworks);
  };

  const refreshProfiles = async () => {
    const nextProfiles = await api.getProfiles();
    setProfiles(nextProfiles);
  };

  useEffect(() => {
    if (!currentUser || !canAccessAdmin(currentUser.role)) return;
    void refresh();
    void refreshArtworks();
    void refreshProfiles();
  }, [currentUser, refresh]);

  const creatorApplications = useMemo(
    () => profiles.filter((profile) => isCreatorApplicationPending(profile.role)),
    [profiles],
  );

  const filterByStatus = (status: ModerationTab) => (item: { moderation_status?: string }) =>
    status === 'approved'
      ? !item.moderation_status || item.moderation_status === 'approved'
      : item.moderation_status === status;

  const eventsByTab = useMemo(() => events.filter(filterByStatus(eventTab)), [events, eventTab]);
  const artworksByTab = useMemo(() => artworks.filter(filterByStatus(artworkTab)), [artworks, artworkTab]);

  const eventGroups = useMemo(() => groupEventsByGallery(eventsByTab), [eventsByTab]);
  const artworkGroups = useMemo(() => groupArtworksByArtist(artworksByTab), [artworksByTab]);

  const pendingEventCount = useMemo(() => events.filter((e) => e.moderation_status === 'pending').length, [events]);
  const pendingArtworkCount = useMemo(() => artworks.filter((a) => a.moderation_status === 'pending').length, [artworks]);
  const approvedEventCount = useMemo(() => events.filter((e) => !e.moderation_status || e.moderation_status === 'approved').length, [events]);
  const approvedArtworkCount = useMemo(() => artworks.filter((a) => !a.moderation_status || a.moderation_status === 'approved').length, [artworks]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleApproveAllEvents = async (group: EventGroup) => {
    for (const event of group.events) {
      await updateEvent(event.id, { moderation_status: 'approved' });
    }
  };

  const handleRejectAllEvents = async (group: EventGroup) => {
    for (const event of group.events) {
      await updateEvent(event.id, { moderation_status: 'rejected' });
    }
  };

  const handleApproveAllArtworks = async (group: ArtworkGroup) => {
    for (const artwork of group.artworks) {
      await api.updateArtwork(artwork.id, { moderation_status: 'approved' });
    }
    await refreshArtworks();
  };

  const handleRejectAllArtworks = async (group: ArtworkGroup) => {
    for (const artwork of group.artworks) {
      await api.updateArtwork(artwork.id, { moderation_status: 'rejected' });
    }
    await refreshArtworks();
  };

  const handleArtworkModeration = async (
    artwork: Artwork,
    moderation_status: Artwork['moderation_status'],
  ) => {
    const updated = await api.updateArtwork(artwork.id, { moderation_status });
    if (!updated) return;
    setArtworks((current) => current.map((item) => (item.id === artwork.id ? updated : item)));
  };

  const handleRoleApplication = async (profile: User, approved: boolean) => {
    const nextRole = approved ? getPendingRoleTarget(profile.role) || 'art_lover' : 'art_lover';
    await api.syncUser({ ...profile, role: nextRole });
    await refreshProfiles();
  };

  const startEditEvent = (event: ArtEvent) => {
    setEditingEventId(event.id);
    setEditForm({
      title: event.title,
      organizer: event.organizer,
      description: event.description,
      city: event.city,
      startDate: event.startDate,
      endDate: event.endDate,
    });
  };

  const saveEditEvent = async () => {
    if (!editingEventId) return;
    await updateEvent(editingEventId, editForm);
    setEditingEventId(null);
    setEditForm({});
  };

  const handleCreateEvent = async (event: FormEvent) => {
    event.preventDefault();

    let imageUrl = form.imageUrl;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    await createEvent({
      ...form,
      id: `admin-${Date.now()}`,
      title: form.title || 'Untitled Event',
      organizer: form.organizer || 'Judooo Admin',
      startDate: form.startDate || new Date().toISOString().split('T')[0],
      endDate: form.endDate || form.startDate || new Date().toISOString().split('T')[0],
      location: form.location || form.address || form.city || 'Vietnam',
      imageUrl: imageUrl || '',
      description: form.description || '',
      moderation_status: 'approved',
    });

    setForm(emptyForm);
    setImageFile(null);
  };

  const handleBulkCreate = async () => {
    const rows = bulkRows
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean);

    for (const [index, row] of rows.entries()) {
      const cols = row.split(',').map((value) => value.trim());
      await createEvent({
        id: `bulk-${Date.now()}-${index}`,
        title: cols[0] || 'Untitled Event',
        organizer: cols[1] || 'Bulk Import',
        startDate: cols[2] || new Date().toISOString().split('T')[0],
        endDate: cols[3] || cols[2] || new Date().toISOString().split('T')[0],
        city: cols[4] || 'Ho Chi Minh City',
        district: cols[5] || '',
        location: cols[6] || cols[4] || 'Vietnam',
        imageUrl: cols[7] || '',
        description: cols[8] || '',
        event_type: cols[9] || '',
        art_medium: cols[10] || '',
        place_type: cols[11] || '',
        is_free: cols[12] === 'true',
        moderation_status: 'approved',
      });
    }

    setBulkRows('');
  };

  const tabButton = (label: string, count: number, isActive: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-foreground text-background'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label} ({count})
    </button>
  );

  if (!currentUser) {
    return (
      <SiteShell>
        <Container size="lg" className="py-12">
          <Card className="p-8">
            <p className="section-kicker">Admin</p>
            <h1 className="section-heading mt-4">Sign in to manage approvals.</h1>
            <Button className="mt-6" onClick={openAuthDialog}>Sign in</Button>
          </Card>
        </Container>
      </SiteShell>
    );
  }

  if (!canAccessAdmin(currentUser.role)) {
    return (
      <SiteShell>
        <Container size="lg" className="py-12">
          <Card className="p-8">
            <p className="section-kicker">Admin</p>
            <h1 className="section-heading mt-4">This dashboard is admin-only.</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Current role: {getRoleLabel(currentUser.role)}.
            </p>
          </Card>
        </Container>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <Container size="xl" className="space-y-8 py-8 sm:py-12">
        <section className="border-b border-border pb-8">
          <p className="section-kicker">Admin</p>
          <h1 className="section-heading mt-4 max-w-4xl">Moderation queue</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            Review crawled and submitted content grouped by gallery. Edit, approve, or reject before it goes live.
          </p>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="p-6">
            <p className="section-kicker">Applications</p>
            <p className="mt-3 text-4xl font-semibold">{creatorApplications.length}</p>
          </Card>
          <Card className="p-6">
            <p className="section-kicker">Pending Events</p>
            <p className="mt-3 text-4xl font-semibold">{pendingEventCount}</p>
          </Card>
          <Card className="p-6">
            <p className="section-kicker">Live Events</p>
            <p className="mt-3 text-4xl font-semibold">{approvedEventCount}</p>
          </Card>
          <Card className="p-6">
            <p className="section-kicker">Pending Artworks</p>
            <p className="mt-3 text-4xl font-semibold">{pendingArtworkCount}</p>
          </Card>
          <Card className="p-6">
            <p className="section-kicker">Live Artworks</p>
            <p className="mt-3 text-4xl font-semibold">{approvedArtworkCount}</p>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            {/* Creator Applications */}
            {creatorApplications.length > 0 ? (
              <Card className="p-6 sm:p-8">
                <div className="mb-6">
                  <p className="section-kicker">Creator Applications</p>
                  <h2 className="section-heading mt-4">Approve artist and gallery manager access.</h2>
                </div>
                <div className="space-y-4">
                  {creatorApplications.map((profile) => (
                    <Card key={profile.id} className="p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h2 className="text-lg font-semibold">{profile.name}</h2>
                          <p className="text-sm text-muted-foreground">{profile.email}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{getRoleLabel(profile.role)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => void handleRoleApplication(profile, true)}>Approve</Button>
                          <Button variant="outline" onClick={() => void handleRoleApplication(profile, false)}>
                            Return to collector
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ) : null}

            {/* Events Queue */}
            <Card className="p-6 sm:p-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="section-kicker">Events</p>
                  <h2 className="section-heading mt-2">Grouped by gallery</h2>
                </div>
                <div className="flex gap-1 rounded-lg bg-secondary p-1">
                  {tabButton('Pending', pendingEventCount, eventTab === 'pending', () => setEventTab('pending'))}
                  {tabButton('Approved', approvedEventCount, eventTab === 'approved', () => setEventTab('approved'))}
                  {tabButton('Rejected', events.filter((e) => e.moderation_status === 'rejected').length, eventTab === 'rejected', () => setEventTab('rejected'))}
                </div>
              </div>
              <div className="space-y-3">
                {eventGroups.length === 0 ? (
                  <Card className="border-dashed p-5">
                    <p className="text-sm text-muted-foreground">No {eventTab} events.</p>
                  </Card>
                ) : (
                  eventGroups.map((group) => {
                    const isExpanded = expandedGroups.has(`evt-${group.gallery}`);
                    return (
                      <Card key={group.gallery} className="overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleGroup(`evt-${group.gallery}`)}
                          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-secondary/50"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{group.gallery}</span>
                              <Badge tone="default">{group.events.length}</Badge>
                            </div>
                            {group.sourceUrl ? (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">{group.sourceUrl}</p>
                            ) : null}
                          </div>
                          {eventTab === 'pending' ? (
                            <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" onClick={() => void handleApproveAllEvents(group)}>
                                Approve all
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => void handleRejectAllEvents(group)}>
                                Reject all
                              </Button>
                            </div>
                          ) : null}
                        </button>
                        {isExpanded ? (
                          <div className="border-t border-border">
                            {group.events.map((event) => (
                              <div key={event.id} className="border-b border-border/50 p-4 last:border-b-0">
                                {editingEventId === event.id ? (
                                  <div className="space-y-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <Field label="Title">
                                        <Input
                                          value={editForm.title || ''}
                                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        />
                                      </Field>
                                      <Field label="Organizer">
                                        <Input
                                          value={editForm.organizer || ''}
                                          onChange={(e) => setEditForm({ ...editForm, organizer: e.target.value })}
                                        />
                                      </Field>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                      <Field label="City">
                                        <Input
                                          value={editForm.city || ''}
                                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                        />
                                      </Field>
                                      <Field label="Start date">
                                        <Input
                                          type="date"
                                          value={editForm.startDate || ''}
                                          onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                                        />
                                      </Field>
                                      <Field label="End date">
                                        <Input
                                          type="date"
                                          value={editForm.endDate || ''}
                                          onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                                        />
                                      </Field>
                                    </div>
                                    <Field label="Description">
                                      <Textarea
                                        value={editForm.description || ''}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        rows={3}
                                      />
                                    </Field>
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => void saveEditEvent()}>
                                        <Check size={14} className="mr-1" /> Save
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => setEditingEventId(null)}>
                                        <X size={14} className="mr-1" /> Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <div className="flex items-start gap-2">
                                        {event.imageUrl ? (
                                          <img
                                            src={event.imageUrl}
                                            alt=""
                                            className="h-12 w-12 shrink-0 rounded-md object-cover"
                                          />
                                        ) : null}
                                        <div className="min-w-0">
                                          <h3 className="font-medium">{getEventTitle(event, language)}</h3>
                                          <p className="text-xs text-muted-foreground">
                                            {event.city} • {event.startDate} → {event.endDate}
                                          </p>
                                          {event.sourceUrl ? (
                                            <a
                                              href={event.sourceUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                            >
                                              <ExternalLink size={10} /> source
                                            </a>
                                          ) : null}
                                        </div>
                                      </div>
                                      {event.description ? (
                                        <p className="line-clamp-2 text-xs text-muted-foreground">
                                          {event.description}
                                        </p>
                                      ) : null}
                                    </div>
                                    <div className="flex shrink-0 gap-1.5">
                                      <Button size="sm" variant="ghost" onClick={() => startEditEvent(event)}>
                                        <Pencil size={14} />
                                      </Button>
                                      {eventTab === 'pending' ? (
                                        <>
                                          <Button size="sm" onClick={() => void updateEvent(event.id, { moderation_status: 'approved' })}>
                                            <Check size={14} />
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => void updateEvent(event.id, { moderation_status: 'rejected' })}>
                                            <X size={14} />
                                          </Button>
                                        </>
                                      ) : eventTab === 'rejected' ? (
                                        <Button size="sm" onClick={() => void updateEvent(event.id, { moderation_status: 'approved' })}>
                                          Restore
                                        </Button>
                                      ) : null}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </Card>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Artworks Queue */}
            <Card className="p-6 sm:p-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="section-kicker">Artworks</p>
                  <h2 className="section-heading mt-2">Grouped by artist</h2>
                </div>
                <div className="flex gap-1 rounded-lg bg-secondary p-1">
                  {tabButton('Pending', pendingArtworkCount, artworkTab === 'pending', () => setArtworkTab('pending'))}
                  {tabButton('Approved', approvedArtworkCount, artworkTab === 'approved', () => setArtworkTab('approved'))}
                  {tabButton('Rejected', artworks.filter((a) => a.moderation_status === 'rejected').length, artworkTab === 'rejected', () => setArtworkTab('rejected'))}
                </div>
              </div>
              <div className="space-y-3">
                {artworkGroups.length === 0 ? (
                  <Card className="border-dashed p-5">
                    <p className="text-sm text-muted-foreground">No {artworkTab} artworks.</p>
                  </Card>
                ) : (
                  artworkGroups.map((group) => {
                    const isExpanded = expandedGroups.has(`art-${group.artist}`);
                    return (
                      <Card key={group.artist} className="overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleGroup(`art-${group.artist}`)}
                          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-secondary/50"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{group.artist}</span>
                              <Badge tone="default">{group.artworks.length}</Badge>
                            </div>
                            {group.sourceUrl ? (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">{group.sourceUrl}</p>
                            ) : null}
                          </div>
                          {artworkTab === 'pending' ? (
                            <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" onClick={() => void handleApproveAllArtworks(group)}>
                                Approve all
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => void handleRejectAllArtworks(group)}>
                                Reject all
                              </Button>
                            </div>
                          ) : null}
                        </button>
                        {isExpanded ? (
                          <div className="border-t border-border">
                            {group.artworks.map((artwork) => (
                              <div key={artwork.id} className="flex items-center gap-3 border-b border-border/50 p-4 last:border-b-0">
                                {artwork.imageUrl ? (
                                  <img
                                    src={artwork.imageUrl}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                                  />
                                ) : null}
                                <div className="min-w-0 flex-1">
                                  <h3 className="text-sm font-medium">{getArtworkTitle(artwork, language)}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    {artwork.medium} {artwork.price ? `• ${artwork.price} ${'VND'}` : ''}
                                  </p>
                                  {artwork.sourceUrl ? (
                                    <a
                                      href={artwork.sourceUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                      <ExternalLink size={10} /> source
                                    </a>
                                  ) : null}
                                </div>
                                <div className="flex shrink-0 gap-1.5">
                                  {artworkTab === 'pending' ? (
                                    <>
                                      <Button size="sm" onClick={() => void handleArtworkModeration(artwork, 'approved')}>
                                        <Check size={14} />
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => void handleArtworkModeration(artwork, 'rejected')}>
                                        <X size={14} />
                                      </Button>
                                    </>
                                  ) : artworkTab === 'rejected' ? (
                                    <Button size="sm" onClick={() => void handleArtworkModeration(artwork, 'approved')}>
                                      Restore
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </Card>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Right column: manual publish + bulk */}
          <div className="space-y-6">
            <Card className="p-6 sm:p-8">
              <p className="section-kicker">Publish manually</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Admin-published events go live immediately (auto-approved).
              </p>
              <form className="mt-6 grid gap-4" onSubmit={handleCreateEvent}>
                <Field label="Title">
                  <Input value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                </Field>
                <Field label="Organizer">
                  <Input value={form.organizer || ''} onChange={(event) => setForm({ ...form, organizer: event.target.value })} />
                </Field>
                <Field label="Category">
                  <Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ArtEvent['category'] })}>
                    <option value="exhibition">Exhibition</option>
                    <option value="auction">Auction</option>
                    <option value="workshop">Workshop</option>
                    <option value="performance">Performance</option>
                    <option value="talk">Talk</option>
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Start date">
                    <Input type="date" value={form.startDate || ''} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
                  </Field>
                  <Field label="End date">
                    <Input type="date" value={form.endDate || ''} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
                  </Field>
                </div>
                <Field label="Image file">
                  <Input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
                </Field>
                <Field label="Image URL">
                  <Input value={form.imageUrl || ''} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
                </Field>
                <Field label="City">
                  <Input value={form.city || ''} onChange={(event) => setForm({ ...form, city: event.target.value, location: event.target.value })} />
                </Field>
                <Field label="Gallery Contact" hint="WhatsApp number or email for inquiries">
                  <Input value={form.gallery_contact || ''} onChange={(event) => setForm({ ...form, gallery_contact: event.target.value })} />
                </Field>
                <Field label="Description">
                  <Textarea value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} />
                </Field>
                <Button type="submit">Publish event</Button>
              </form>
            </Card>

            <Card className="p-6 sm:p-8">
              <p className="section-kicker">Bulk paste</p>
              <p className="mt-3 text-sm text-muted-foreground">
                CSV: title, organizer, startDate, endDate, city, district, location, imageUrl, description, eventType, artMedium, placeType, isFree
              </p>
              <Textarea className="mt-4" value={bulkRows} onChange={(event) => setBulkRows(event.target.value)} />
              <Button className="mt-4" onClick={handleBulkCreate} disabled={!bulkRows.trim()}>
                Upload rows
              </Button>
            </Card>
          </div>
        </section>
      </Container>
    </SiteShell>
  );
};
