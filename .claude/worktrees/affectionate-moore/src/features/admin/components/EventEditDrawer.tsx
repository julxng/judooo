'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/shared/Field';
import type { ArtEvent, EventMedia } from '@/features/events/types/event.types';

type EventEditDrawerProps = {
  event: ArtEvent | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<ArtEvent>) => Promise<void>;
};

export const EventEditDrawer = ({ event, open, onClose, onSave }: EventEditDrawerProps) => {
  const [form, setForm] = useState<Partial<ArtEvent>>({});
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [mediaUrls, setMediaUrls] = useState<EventMedia[]>([]);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title,
        organizer: event.organizer,
        description: event.description,
        city: event.city,
        district: event.district,
        startDate: event.startDate,
        endDate: event.endDate,
        category: event.category,
        art_medium: event.art_medium,
        event_type: event.event_type,
        place_type: event.place_type,
        imageUrl: event.imageUrl,
        gallery_contact: event.gallery_contact,
        featured: event.featured,
        is_free: event.is_free,
        is_virtual: event.is_virtual,
        location: event.location,
        address: event.address,
        price: event.price,
        registration_link: event.registration_link,
        registration_required: event.registration_required,
        sourceUrl: event.sourceUrl,
        sourceItemUrl: event.sourceItemUrl,
        socialvideo_url: event.socialvideo_url,
        lat: event.lat,
        lng: event.lng,
        google_map_link: event.google_map_link,
      });
      setTagsInput((event.tags || []).join(', '));
      setMediaUrls(event.media || []);
    }
  }, [event]);

  const set = (key: keyof ArtEvent, value: string | boolean | number | undefined) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addMediaUrl = () => setMediaUrls((prev) => [...prev, { type: 'image', url: '' }]);

  const updateMediaUrl = (index: number, url: string) =>
    setMediaUrls((prev) => prev.map((item, i) => (i === index ? { ...item, url } : item)));

  const updateMediaType = (index: number, type: 'image' | 'video') =>
    setMediaUrls((prev) => prev.map((item, i) => (i === index ? { ...item, type } : item)));

  const removeMediaUrl = (index: number) =>
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const validMedia = mediaUrls.filter((m) => m.url.trim());
    await onSave(event.id, { ...form, tags, media: validMedia });
    setSaving(false);
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Edit Event">
      <div className="space-y-4">
        {/* --- Basic info --- */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Basic info</p>
        <Field label="Title">
          <Input value={form.title || ''} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Organizer">
          <Input value={form.organizer || ''} onChange={(e) => set('organizer', e.target.value)} />
        </Field>
        <Field label="Category">
          <Select value={form.category || 'exhibition'} onChange={(e) => set('category', e.target.value)}>
            <option value="exhibition">Exhibition</option>
            <option value="auction">Auction</option>
            <option value="workshop">Workshop</option>
            <option value="performance">Performance</option>
            <option value="talk">Talk</option>
          </Select>
        </Field>
        <Field label="Description">
          <Textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={4} />
        </Field>

        {/* --- Date & price --- */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Date & price</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date">
            <Input type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field label="End date">
            <Input type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (VND)" hint="Leave empty for 'Contact organizer'">
            <Input
              type="number"
              value={form.price ?? ''}
              onChange={(e) => set('price', e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
          <Field label="Registration link">
            <Input value={form.registration_link || ''} onChange={(e) => set('registration_link', e.target.value)} placeholder="https://..." />
          </Field>
        </div>
        <div className="flex gap-4">
          <Checkbox label="Free" checked={form.is_free || false} onChange={(e) => set('is_free', e.target.checked)} />
          <Checkbox label="Registration required" checked={form.registration_required || false} onChange={(e) => set('registration_required', e.target.checked)} />
        </div>

        {/* --- Location --- */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Location</p>
        <Field label="Address">
          <Input value={form.address || ''} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <Input value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="District">
            <Input value={form.district || ''} onChange={(e) => set('district', e.target.value)} />
          </Field>
        </div>
        <Field label="Location (legacy)">
          <Input value={form.location || ''} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Latitude">
            <Input type="number" step="any" value={form.lat ?? ''} onChange={(e) => set('lat', e.target.value ? Number(e.target.value) : undefined)} />
          </Field>
          <Field label="Longitude">
            <Input type="number" step="any" value={form.lng ?? ''} onChange={(e) => set('lng', e.target.value ? Number(e.target.value) : undefined)} />
          </Field>
        </div>
        <Field label="Google Maps link">
          <Input value={form.google_map_link || ''} onChange={(e) => set('google_map_link', e.target.value)} placeholder="https://maps.google.com/..." />
        </Field>
        <Checkbox label="Virtual event" checked={form.is_virtual || false} onChange={(e) => set('is_virtual', e.target.checked)} />

        {/* --- Tags & classification --- */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tags & classification</p>
        <Field label="Art Medium">
          <Input value={form.art_medium || ''} onChange={(e) => set('art_medium', e.target.value)} placeholder="e.g. Painting, Sculpture, Video Art" />
        </Field>
        <Field label="Event Type">
          <Input value={form.event_type || ''} onChange={(e) => set('event_type', e.target.value)} placeholder="e.g. Group Show, Solo Show" />
        </Field>
        <Field label="Place Type">
          <Input value={form.place_type || ''} onChange={(e) => set('place_type', e.target.value)} placeholder="e.g. Gallery, Studio, Museum" />
        </Field>
        <Field label="Tags" hint="Comma-separated, e.g. feminism, contemporary, craft">
          <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="tag1, tag2, tag3" />
        </Field>

        {/* --- Media --- */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Media</p>
        <Field label="Cover image URL">
          <Input value={form.imageUrl || ''} onChange={(e) => set('imageUrl', e.target.value)} />
        </Field>
        {form.imageUrl ? (
          <img src={form.imageUrl} alt="Cover preview" className="h-24 w-36 rounded-md border border-border object-cover" />
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Additional media</p>
          {mediaUrls.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={item.type}
                onChange={(e) => updateMediaType(index, e.target.value as 'image' | 'video')}
                className="w-24 shrink-0"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </Select>
              <Input
                value={item.url}
                onChange={(e) => updateMediaUrl(index, e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              <button type="button" onClick={() => removeMediaUrl(index)} className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addMediaUrl}>
            <Plus size={14} />
            Add media
          </Button>
        </div>

        <Field label="Social video URL" hint="Instagram reel, TikTok, etc.">
          <Input value={form.socialvideo_url || ''} onChange={(e) => set('socialvideo_url', e.target.value)} placeholder="https://..." />
        </Field>

        {/* --- Source & contact --- */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Source & contact</p>
        <Field label="Source URL" hint="Original website where data was crawled">
          <Input value={form.sourceUrl || ''} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Source item URL" hint="Direct link to this event's page">
          <Input value={form.sourceItemUrl || ''} onChange={(e) => set('sourceItemUrl', e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Gallery Contact" hint="WhatsApp number or email">
          <Input value={form.gallery_contact || ''} onChange={(e) => set('gallery_contact', e.target.value)} />
        </Field>

        {/* --- Flags --- */}
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Flags</p>
        <div className="flex gap-4">
          <Checkbox label="Featured" checked={form.featured || false} onChange={(e) => set('featured', e.target.checked)} />
        </div>

        {/* --- Save --- */}
        <div className="flex gap-2 border-t border-border pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Drawer>
  );
};
