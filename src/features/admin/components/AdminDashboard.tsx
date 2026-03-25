import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Field } from '@/components/shared/Field';
import { Button, Card, Input, Select, Table, Textarea } from '@/components/ui';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork, SaleType } from '@/features/marketplace/types/artwork.types';

interface AdminDashboardProps {
  events: ArtEvent[];
  artworks: Artwork[];
  onAddEvent: (event: ArtEvent) => Promise<ArtEvent | null>;
  onAddArtwork: (artwork: Artwork) => Promise<Artwork | null>;
  onUploadEvents: (events: ArtEvent[]) => Promise<ArtEvent[]>;
  onUploadArtworks: (artworks: Artwork[]) => Promise<Artwork[]>;
  onUpdateEvent: (id: string, event: Partial<ArtEvent>) => Promise<ArtEvent | null>;
  onUploadImage: (file: File) => Promise<string | null>;
}

const defaultEventForm: Partial<ArtEvent> = {
  category: 'exhibition',
  location: 'Ho Chi Minh City',
  lat: 10.7769,
  lng: 106.7009,
};

const defaultArtworkForm: Partial<Artwork> = {
  saleType: 'fixed',
  available: true,
};

export const AdminDashboard = ({
  events,
  artworks,
  onAddEvent,
  onAddArtwork,
  onUploadEvents,
  onUploadArtworks,
  onUpdateEvent,
  onUploadImage,
}: AdminDashboardProps) => {
  const [activeForm, setActiveForm] = useState<'none' | 'event' | 'artwork'>('none');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<Partial<ArtEvent>>(defaultEventForm);
  const [artworkForm, setArtworkForm] = useState<Partial<Artwork>>(defaultArtworkForm);
  const [mediaString, setMediaString] = useState('');
  const [eventHeroFile, setEventHeroFile] = useState<File | null>(null);
  const [artworkHeroFile, setArtworkHeroFile] = useState<File | null>(null);

  const parseMedia = (value: string) =>
    value
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({
        type: url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('youtube') ? 'video' : 'image',
        url,
      })) as ArtEvent['media'];

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventForm(defaultEventForm);
    setMediaString('');
    setEventHeroFile(null);
    setActiveForm('none');
  };

  const resetArtworkForm = () => {
    setArtworkForm(defaultArtworkForm);
    setArtworkHeroFile(null);
    setActiveForm('none');
  };

  const handleManualEvent = async (event: FormEvent) => {
    event.preventDefault();
    let heroUrl = eventForm.imageUrl;
    if (eventHeroFile) {
      const uploaded = await onUploadImage(eventHeroFile);
      if (uploaded) heroUrl = uploaded;
    }

    const payload: ArtEvent = {
      ...(eventForm as ArtEvent),
      id: editingEventId || `manual-e-${Date.now()}`,
      startDate: eventForm.startDate || new Date().toISOString().split('T')[0],
      endDate: eventForm.endDate || new Date().toISOString().split('T')[0],
      imageUrl: heroUrl || eventForm.imageUrl || '',
      media: parseMedia(mediaString),
      description: eventForm.description || '',
      organizer: eventForm.organizer || 'Gallery',
      title: eventForm.title || 'Untitled Event',
      location: eventForm.location || 'Ho Chi Minh City',
      lat: Number(eventForm.lat || 10.7769),
      lng: Number(eventForm.lng || 106.7009),
      category: eventForm.category || 'exhibition',
    };

    if (editingEventId) {
      await onUpdateEvent(editingEventId, payload);
    } else {
      await onAddEvent(payload);
    }

    resetEventForm();
  };

  const handleManualArtwork = async (event: FormEvent) => {
    event.preventDefault();
    let heroUrl = artworkForm.imageUrl;
    if (artworkHeroFile) {
      const uploaded = await onUploadImage(artworkHeroFile);
      if (uploaded) heroUrl = uploaded;
    }

    const payload: Artwork = {
      ...(artworkForm as Artwork),
      id: `manual-a-${Date.now()}`,
      title: artworkForm.title || 'Untitled Artwork',
      artist: artworkForm.artist || 'Unknown Artist',
      medium: artworkForm.medium || 'Mixed Media',
      dimensions: artworkForm.dimensions || 'N/A',
      description: artworkForm.description || '',
      saleType: artworkForm.saleType || 'fixed',
      available: artworkForm.available ?? true,
      price: Number(artworkForm.price) || 0,
      currentBid: artworkForm.saleType === 'auction' ? Number(artworkForm.price || 0) : undefined,
      bidCount: artworkForm.saleType === 'auction' ? 0 : undefined,
      imageUrl: heroUrl || artworkForm.imageUrl || '',
      eventId: artworkForm.eventId,
    };

    await onAddArtwork(payload);
    resetArtworkForm();
  };

  const parseCsvUpload = async (file: File, type: 'events' | 'artworks') => {
    const text = await file.text();
    const rows = text.split('\n').slice(1).filter((row) => row.trim() !== '');

    if (type === 'events') {
      const parsed = rows.map((row, index) => {
        const cols = row.split(',').map((value) => value.trim());
        return {
          id: `csv-e-${Date.now()}-${index}`,
          title: cols[0] || 'New Event',
          organizer: cols[1] || 'Gallery',
          startDate: cols[2] || new Date().toISOString().split('T')[0],
          endDate: cols[3] || new Date().toISOString().split('T')[0],
          location: cols[4] || 'Ho Chi Minh City',
          lat: parseFloat(cols[5]) || 10.7769,
          lng: parseFloat(cols[6]) || 106.7009,
          imageUrl: cols[7] || 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8',
          description: cols[8] || '',
          category: (cols[9] as ArtEvent['category']) || 'exhibition',
          media: cols[10] ? parseMedia(cols[10]) : [],
        } as ArtEvent;
      });
      await onUploadEvents(parsed);
      return;
    }

    const parsed = rows.map((row, index) => {
      const cols = row.split(',').map((value) => value.trim());
      return {
        id: `csv-a-${Date.now()}-${index}`,
        title: cols[0] || 'New Artwork',
        artist: cols[1] || 'Unknown Artist',
        price: parseFloat(cols[2]) || 1000000,
        saleType: (cols[3] as SaleType) || 'fixed',
        imageUrl: cols[4] || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19',
        medium: cols[5] || 'Oil on Canvas',
        dimensions: cols[6] || '50 x 50 cm',
        description: cols[7] || '',
        available: true,
        currentBid: cols[3] === 'auction' ? parseFloat(cols[2]) : undefined,
        bidCount: cols[3] === 'auction' ? 0 : undefined,
      } as Artwork;
    });
    await onUploadArtworks(parsed);
  };

  const eventColumns = useMemo(
    () => [
      {
        key: 'title',
        header: 'Event',
        render: (row: ArtEvent) => (
          <div>
            <strong>{row.title}</strong>
            <p className="muted-text">{row.organizer}</p>
          </div>
        ),
      },
      {
        key: 'schedule',
        header: 'Schedule',
        render: (row: ArtEvent) => `${row.startDate} → ${row.endDate}`,
      },
      {
        key: 'location',
        header: 'Location',
        render: (row: ArtEvent) => row.location,
      },
      {
        key: 'featured',
        header: 'Featured',
        render: (row: ArtEvent) => (row.featured ? '★' : '—'),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row: ArtEvent) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingEventId(row.id);
              setEventForm(row);
              setMediaString((row.media || []).map((item) => item.url).join(', '));
              setActiveForm('event');
            }}
          >
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <DashboardLayout
      title="Admin Operations"
      description="Create events, list artworks, and upload structured data without leaving the dashboard."
      actions={
        <div className="admin-actions">
          <Button
            variant={activeForm === 'event' ? 'primary' : 'ghost'}
            onClick={() => setActiveForm(activeForm === 'event' ? 'none' : 'event')}
          >
            {editingEventId ? 'Edit Event' : 'Create Event'}
          </Button>
          <Button
            variant={activeForm === 'artwork' ? 'primary' : 'ghost'}
            onClick={() => setActiveForm(activeForm === 'artwork' ? 'none' : 'artwork')}
          >
            List Artwork
          </Button>
        </div>
      }
    >
      {activeForm === 'event' ? (
        <Card className="admin-form">
          <form className="admin-form__grid" onSubmit={handleManualEvent}>
            <Field label="Event Title">
              <Input value={eventForm.title || ''} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} />
            </Field>
            <Field label="Organizer">
              <Input value={eventForm.organizer || ''} onChange={(event) => setEventForm({ ...eventForm, organizer: event.target.value })} />
            </Field>
            <Field label="Category">
              <Select value={eventForm.category} onChange={(event) => setEventForm({ ...eventForm, category: event.target.value as ArtEvent['category'] })}>
                <option value="exhibition">Exhibition</option>
                <option value="auction">Auction</option>
                <option value="workshop">Workshop</option>
              </Select>
            </Field>
            <Field label="Hero Image">
              <Input type="file" accept="image/*" onChange={(event) => setEventHeroFile(event.target.files?.[0] || null)} />
            </Field>
            <Field label="Hero Image URL">
              <Input value={eventForm.imageUrl || ''} onChange={(event) => setEventForm({ ...eventForm, imageUrl: event.target.value })} />
            </Field>
            <Field label="Open Date">
              <Input type="date" value={eventForm.startDate || ''} onChange={(event) => setEventForm({ ...eventForm, startDate: event.target.value })} />
            </Field>
            <Field label="Close Date">
              <Input type="date" value={eventForm.endDate || ''} onChange={(event) => setEventForm({ ...eventForm, endDate: event.target.value })} />
            </Field>
            <Field label="Location">
              <Input value={eventForm.location || ''} onChange={(event) => setEventForm({ ...eventForm, location: event.target.value })} />
            </Field>
            <Field label="Media URLs" hint="Comma-separated image/video URLs">
              <Textarea value={mediaString} onChange={(event) => setMediaString(event.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea value={eventForm.description || ''} onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })} />
            </Field>
            <Field label="Featured">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={eventForm.featured || false}
                  onChange={(event) => setEventForm({ ...eventForm, featured: event.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                Show on curated homepage
              </label>
            </Field>
            <div className="admin-form__actions">
              <Button variant="ghost" onClick={resetEventForm}>Cancel</Button>
              <Button variant="default" type="submit">{editingEventId ? 'Save Event' : 'Publish Event'}</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {activeForm === 'artwork' ? (
        <Card className="admin-form">
          <form className="admin-form__grid" onSubmit={handleManualArtwork}>
            <Field label="Artwork Title">
              <Input value={artworkForm.title || ''} onChange={(event) => setArtworkForm({ ...artworkForm, title: event.target.value })} />
            </Field>
            <Field label="Artist">
              <Input value={artworkForm.artist || ''} onChange={(event) => setArtworkForm({ ...artworkForm, artist: event.target.value })} />
            </Field>
            <Field label="Medium">
              <Input value={artworkForm.medium || ''} onChange={(event) => setArtworkForm({ ...artworkForm, medium: event.target.value })} />
            </Field>
            <Field label="Dimensions">
              <Input value={artworkForm.dimensions || ''} onChange={(event) => setArtworkForm({ ...artworkForm, dimensions: event.target.value })} />
            </Field>
            <Field label="Sale Type">
              <Select value={artworkForm.saleType} onChange={(event) => setArtworkForm({ ...artworkForm, saleType: event.target.value as SaleType })}>
                <option value="fixed">Fixed Price</option>
                <option value="auction">Auction</option>
              </Select>
            </Field>
            <Field label="Price (VND)">
              <Input type="number" value={artworkForm.price || ''} onChange={(event) => setArtworkForm({ ...artworkForm, price: Number(event.target.value) })} />
            </Field>
            <Field label="Hero Image">
              <Input type="file" accept="image/*" onChange={(event) => setArtworkHeroFile(event.target.files?.[0] || null)} />
            </Field>
            <Field label="Hero Image URL">
              <Input value={artworkForm.imageUrl || ''} onChange={(event) => setArtworkForm({ ...artworkForm, imageUrl: event.target.value })} />
            </Field>
            <Field label="Linked Event ID">
              <Input value={artworkForm.eventId || ''} onChange={(event) => setArtworkForm({ ...artworkForm, eventId: event.target.value })} />
            </Field>
            <Field label="Narrative">
              <Textarea value={artworkForm.description || ''} onChange={(event) => setArtworkForm({ ...artworkForm, description: event.target.value })} />
            </Field>
            <div className="admin-form__actions">
              <Button variant="ghost" onClick={resetArtworkForm}>Cancel</Button>
              <Button variant="default" type="submit">List Artwork</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="admin-upload-grid">
        <Card className="admin-upload">
          <p className="eyebrow">Bulk Upload Events</p>
          <p className="muted-text">CSV: Title, Gallery, Start, End, Location, Lat, Lng, HeroURL, Description, Category, Media</p>
          <Input type="file" accept=".csv" onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
              void parseCsvUpload(file, 'events');
            }
          }} />
        </Card>
        <Card className="admin-upload">
          <p className="eyebrow">Bulk Upload Artworks</p>
          <p className="muted-text">CSV: Title, Artist, Price, SaleType, HeroURL, Medium, Dimensions, Description</p>
          <Input type="file" accept=".csv" onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
              void parseCsvUpload(file, 'artworks');
            }
          }} />
        </Card>
      </div>

      <Card className="admin-table">
        <div className="admin-table__header">
          <div>
            <p className="eyebrow">Event Inventory</p>
            <p className="muted-text">{events.length} shows currently loaded.</p>
          </div>
          <p className="muted-text">{artworks.length} artworks available.</p>
        </div>
        <Table columns={eventColumns} rows={events} emptyLabel="No events yet." />
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;
