'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/shared/Field';
import type { ArtEvent } from '@/features/events/types/event.types';

type EventEditDrawerProps = {
  event: ArtEvent | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<ArtEvent>) => Promise<void>;
};

export const EventEditDrawer = ({ event, open, onClose, onSave }: EventEditDrawerProps) => {
  const [form, setForm] = useState<Partial<ArtEvent>>({});
  const [saving, setSaving] = useState(false);

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
        location: event.location,
      });
    }
  }, [event]);

  const set = (key: keyof ArtEvent, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    await onSave(event.id, form);
    setSaving(false);
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Edit Event">
      <div className="space-y-4">
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start date">
            <Input type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field label="End date">
            <Input type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} />
          </Field>
        </div>
        <Field label="City">
          <Input value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="District">
          <Input value={form.district || ''} onChange={(e) => set('district', e.target.value)} />
        </Field>
        <Field label="Location">
          <Input value={form.location || ''} onChange={(e) => set('location', e.target.value)} />
        </Field>
        <Field label="Image URL">
          <Input value={form.imageUrl || ''} onChange={(e) => set('imageUrl', e.target.value)} />
        </Field>
        <Field label="Art Medium">
          <Input value={form.art_medium || ''} onChange={(e) => set('art_medium', e.target.value)} />
        </Field>
        <Field label="Event Type">
          <Input value={form.event_type || ''} onChange={(e) => set('event_type', e.target.value)} />
        </Field>
        <Field label="Place Type">
          <Input value={form.place_type || ''} onChange={(e) => set('place_type', e.target.value)} />
        </Field>
        <Field label="Gallery Contact" hint="WhatsApp number or email">
          <Input value={form.gallery_contact || ''} onChange={(e) => set('gallery_contact', e.target.value)} />
        </Field>
        <Field label="Description">
          <Textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={4} />
        </Field>
        <div className="flex gap-4">
          <Checkbox label="Featured" checked={form.featured || false} onChange={(e) => set('featured', e.target.checked)} />
          <Checkbox label="Free" checked={form.is_free || false} onChange={(e) => set('is_free', e.target.checked)} />
        </div>
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
