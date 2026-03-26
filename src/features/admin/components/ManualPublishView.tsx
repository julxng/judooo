'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/shared/Field';
import type { ArtEvent } from '@/features/events/types/event.types';

type ManualPublishViewProps = {
  eventOps: {
    createEvent: (event: Partial<ArtEvent>) => Promise<ArtEvent | null>;
    uploadImage: (file: File) => Promise<string | null>;
  };
};

const emptyForm: Partial<ArtEvent> = {
  category: 'exhibition',
  city: 'Ho Chi Minh City',
  location: 'Ho Chi Minh City',
  lat: 10.7769,
  lng: 106.7009,
  moderation_status: 'approved',
};

export const ManualPublishView = ({ eventOps }: ManualPublishViewProps) => {
  const [form, setForm] = useState<Partial<ArtEvent>>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bulkRows, setBulkRows] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let imageUrl = form.imageUrl;
    if (imageFile) {
      const uploaded = await eventOps.uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    await eventOps.createEvent({
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
    setSubmitting(false);
  };

  const handleBulkCreate = async () => {
    setSubmitting(true);
    const rows = bulkRows
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean);

    for (const [index, row] of rows.entries()) {
      const cols = row.split(',').map((v) => v.trim());
      await eventOps.createEvent({
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
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Publish</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Admin-published events go live immediately (auto-approved).
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Manual event form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Create event</h2>
          <form className="mt-4 grid gap-4" onSubmit={handleCreateEvent}>
            <Field label="Title">
              <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Organizer">
              <Input value={form.organizer || ''} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ArtEvent['category'] })}>
                <option value="exhibition">Exhibition</option>
                <option value="auction">Auction</option>
                <option value="workshop">Workshop</option>
                <option value="performance">Performance</option>
                <option value="talk">Talk</option>
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date">
                <Input type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </Field>
              <Field label="End date">
                <Input type="date" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </Field>
            </div>
            <Field label="Image file">
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </Field>
            <Field label="Image URL">
              <Input value={form.imageUrl || ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </Field>
            <Field label="City">
              <Input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value, location: e.target.value })} />
            </Field>
            <Field label="Gallery Contact" hint="WhatsApp number or email">
              <Input value={form.gallery_contact || ''} onChange={(e) => setForm({ ...form, gallery_contact: e.target.value })} />
            </Field>
            <Field label="Description">
              <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish event'}
            </Button>
          </form>
        </Card>

        {/* Bulk CSV */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Bulk paste</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            CSV: title, organizer, startDate, endDate, city, district, location, imageUrl, description, eventType, artMedium, placeType, isFree
          </p>
          <Textarea className="mt-4" value={bulkRows} onChange={(e) => setBulkRows(e.target.value)} rows={12} />
          <Button className="mt-4" onClick={handleBulkCreate} disabled={!bulkRows.trim() || submitting}>
            {submitting ? 'Uploading...' : 'Upload rows'}
          </Button>
        </Card>
      </div>
    </div>
  );
};
