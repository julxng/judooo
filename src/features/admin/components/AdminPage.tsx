'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Field } from '@/components/shared/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { canAccessAdmin, getPendingRoleTarget, getRoleLabel, isCreatorApplicationPending } from '@/features/auth/utils/roles';
import { useEventsCatalog } from '@/features/events/hooks/useEventsCatalog';
import { getEventTitle } from '@/features/events/utils/event-utils';
import type { User } from '@/features/auth/types/auth.types';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import { api } from '@/services/api';
import { hydrateLocalCatalogSnapshot } from '@/services/api/localDb';

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

export const AdminPage = ({ initialEvents = [], initialArtworks = [] }: AdminPageProps) => {
  const { currentUser, openAuthDialog } = useAuth();
  const { events, createEvent, updateEvent, uploadImage } = useEventsCatalog(initialEvents, {
    currentUser,
    onAuthRequired: openAuthDialog,
  });
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [form, setForm] = useState<Partial<ArtEvent>>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bulkRows, setBulkRows] = useState('');

  useEffect(() => {
    if (initialArtworks.length === 0) return;
    hydrateLocalCatalogSnapshot({ artworks: initialArtworks });
  }, [initialArtworks]);

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
    void refreshArtworks();
    void refreshProfiles();
  }, [currentUser]);

  const creatorApplications = useMemo(
    () => profiles.filter((profile) => isCreatorApplicationPending(profile.role)),
    [profiles],
  );
  const pendingEvents = useMemo(
    () => events.filter((event) => event.moderation_status === 'pending'),
    [events],
  );
  const pendingArtworks = useMemo(
    () => artworks.filter((artwork) => artwork.moderation_status === 'pending'),
    [artworks],
  );
  const publishedArtworks = useMemo(
    () => artworks.filter((artwork) => !artwork.moderation_status || artwork.moderation_status === 'approved'),
    [artworks],
  );

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

  if (!currentUser) {
    return (
      <SiteShell>
        <Container size="lg" className="py-12">
          <Card className="p-8">
            <p className="section-kicker">Admin</p>
            <h1 className="section-heading mt-4">Sign in to manage approvals.</h1>
            <Button className="mt-6" onClick={openAuthDialog}>
              Sign in
            </Button>
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
          <h1 className="section-heading mt-4 max-w-4xl">Approvals, manual publishing, and creator access in one editorial control room.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            This is the operational layer for the current MVP: review creator applications, moderate submissions, and publish missing events directly when needed.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Card className="p-6">
            <p className="section-kicker">Applications</p>
            <p className="mt-3 text-4xl font-semibold">{creatorApplications.length}</p>
          </Card>
          <Card className="p-6">
            <p className="section-kicker">Pending Events</p>
            <p className="mt-3 text-4xl font-semibold">{pendingEvents.length}</p>
          </Card>
          <Card className="p-6">
            <p className="section-kicker">Pending Artworks</p>
            <p className="mt-3 text-4xl font-semibold">{pendingArtworks.length}</p>
          </Card>
          <Card className="p-6">
            <p className="section-kicker">Published Artworks</p>
            <p className="mt-3 text-4xl font-semibold">{publishedArtworks.length}</p>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card className="p-6 sm:p-8">
              <div className="mb-6">
                <p className="section-kicker">Creator Applications</p>
                <h2 className="section-heading mt-4">Approve artist and gallery manager access.</h2>
              </div>
              <div className="space-y-4">
                {creatorApplications.length === 0 ? (
                  <Card className="border-dashed p-5">
                    <p className="text-sm text-muted-foreground">No creator applications are waiting.</p>
                  </Card>
                ) : (
                  creatorApplications.map((profile) => (
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
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="mb-6">
                <p className="section-kicker">Pending Event Queue</p>
                <h2 className="font-display text-[1.9rem] leading-[0.96] tracking-[-0.04em]">Approve or reject submitted events.</h2>
              </div>
              <div className="space-y-4">
                {pendingEvents.length === 0 ? (
                  <Card className="border-dashed p-5">
                    <p className="text-sm text-muted-foreground">No pending events right now.</p>
                  </Card>
                ) : (
                  pendingEvents.map((event) => (
                    <Card key={event.id} className="p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">{getEventTitle(event)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {event.submitter_name || 'Unknown submitter'} • {event.submitter_email || 'No email'}
                          </p>
                          <p className="text-sm text-muted-foreground">{event.city || event.location}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => void updateEvent(event.id, { moderation_status: 'approved' })}>
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => void updateEvent(event.id, { moderation_status: 'rejected' })}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-6 sm:p-8">
              <div className="mb-6">
                <p className="section-kicker">Pending Artwork Queue</p>
                <h2 className="font-display text-[1.9rem] leading-[0.96] tracking-[-0.04em]">Approve or reject marketplace submissions.</h2>
              </div>
              <div className="space-y-4">
                {pendingArtworks.length === 0 ? (
                  <Card className="border-dashed p-5">
                    <p className="text-sm text-muted-foreground">No pending artworks right now.</p>
                  </Card>
                ) : (
                  pendingArtworks.map((artwork) => (
                    <Card key={artwork.id} className="p-5">
                      <div className="flex flex-col gap-4 md:grid md:grid-cols-[6rem_1fr]">
                        <img
                          src={artwork.imageUrl}
                          alt={artwork.title}
                          className="h-24 w-24 rounded-md object-cover"
                        />
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{artwork.title}</h3>
                            <p className="text-sm text-muted-foreground">{artwork.artist}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {artwork.city || artwork.country || 'Vietnam'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={() => void handleArtworkModeration(artwork, 'approved')}>
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => void handleArtworkModeration(artwork, 'rejected')}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 sm:p-8">
              <p className="section-kicker">Publish manually</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Use this when the directory needs a fast manual publish rather than a creator-submitted workflow.
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
                <Field label="Image file">
                  <Input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
                </Field>
                <Field label="Image URL">
                  <Input value={form.imageUrl || ''} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
                </Field>
                <Field label="City">
                  <Input value={form.city || ''} onChange={(event) => setForm({ ...form, city: event.target.value, location: event.target.value })} />
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
                CSV columns: `title, organizer, startDate, endDate, city, district, location, imageUrl, description, eventType, artMedium, placeType, isFree`
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
