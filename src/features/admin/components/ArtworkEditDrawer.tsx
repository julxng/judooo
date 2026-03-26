'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/shared/Field';
import type { Artwork } from '@/features/marketplace/types/artwork.types';

type ArtworkEditDrawerProps = {
  artwork: Artwork | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Artwork>) => Promise<void>;
};

export const ArtworkEditDrawer = ({ artwork, open, onClose, onSave }: ArtworkEditDrawerProps) => {
  const [form, setForm] = useState<Partial<Artwork>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (artwork) {
      setForm({
        title: artwork.title,
        artist: artwork.artist,
        medium: artwork.medium,
        dimensions: artwork.dimensions,
        description: artwork.description,
        price: artwork.price,
        saleType: artwork.saleType,
        city: artwork.city,
        style: artwork.style,
        imageUrl: artwork.imageUrl,
        yearCreated: artwork.yearCreated,
        available: artwork.available,
      });
    }
  }, [artwork]);

  const set = (key: keyof Artwork, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!artwork) return;
    setSaving(true);
    await onSave(artwork.id, form);
    setSaving(false);
    onClose();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Edit Artwork">
      <div className="space-y-4">
        <Field label="Title">
          <Input value={form.title || ''} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Artist">
          <Input value={form.artist || ''} onChange={(e) => set('artist', e.target.value)} />
        </Field>
        <Field label="Medium">
          <Input value={form.medium || ''} onChange={(e) => set('medium', e.target.value)} />
        </Field>
        <Field label="Dimensions">
          <Input value={form.dimensions || ''} onChange={(e) => set('dimensions', e.target.value)} />
        </Field>
        <Field label="Year Created">
          <Input
            type="number"
            value={form.yearCreated || ''}
            onChange={(e) => set('yearCreated', parseInt(e.target.value, 10) || 0)}
          />
        </Field>
        <Field label="Sale Type">
          <Select value={form.saleType || 'fixed'} onChange={(e) => set('saleType', e.target.value)}>
            <option value="fixed">Fixed Price</option>
            <option value="auction">Auction</option>
          </Select>
        </Field>
        <Field label="Price">
          <Input
            type="number"
            value={form.price || ''}
            onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="City">
          <Input value={form.city || ''} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="Style">
          <Input value={form.style || ''} onChange={(e) => set('style', e.target.value)} />
        </Field>
        <Field label="Image URL">
          <Input value={form.imageUrl || ''} onChange={(e) => set('imageUrl', e.target.value)} />
        </Field>
        <Field label="Description">
          <Textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={4} />
        </Field>
        <Checkbox
          label="Available"
          checked={form.available ?? true}
          onChange={(e) => set('available', e.target.checked)}
        />
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
