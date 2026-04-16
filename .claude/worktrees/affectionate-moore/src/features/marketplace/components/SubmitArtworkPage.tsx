'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/app/providers';
import { useNotice } from '@/app/providers/NoticeProvider';
import { SiteShell } from '@/components/layout/SiteShell';
import { Field } from '@/components/shared/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  canPublishWithoutApproval,
  canSubmitListings,
  hasCreatorWorkspaceAccess,
} from '@/features/auth/utils/roles';
import { api } from '@/services/api';

type SubmitArtworkFormState = {
  title: string;
  artist: string;
  medium: string;
  dimensions: string;
  description: string;
  story: string;
  price: string;
  saleType: 'fixed' | 'auction';
  city: string;
  country: string;
  yearCreated: string;
  style: string;
  provenance: string;
  authenticity: string;
  conditionReport: string;
  imageUrl: string;
  eventId: string;
};

const initialState: SubmitArtworkFormState = {
  title: '',
  artist: '',
  medium: '',
  dimensions: '',
  description: '',
  story: '',
  price: '',
  saleType: 'fixed',
  city: '',
  country: 'Vietnam',
  yearCreated: '',
  style: '',
  provenance: '',
  authenticity: '',
  conditionReport: '',
  imageUrl: '',
  eventId: '',
};

export const SubmitArtworkPage = () => {
  const { currentUser, openAuthDialog, requestCreatorRole } = useAuth();
  const { notify } = useNotice();
  const [form, setForm] = useState<SubmitArtworkFormState>(initialState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const hasCreatorAccess = hasCreatorWorkspaceAccess(currentUser?.role);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!currentUser) {
      openAuthDialog();
      return;
    }

    if (!canSubmitListings(currentUser.role)) {
      notify('Apply as an artist or gallery manager before submitting artworks.', 'warning');
      return;
    }

    setIsSubmitting(true);

    let imageUrl = form.imageUrl;
    if (imageFile) {
      const uploaded = await api.uploadImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    const created = await api.createArtwork({
      id: `artwork-submit-${Date.now()}`,
      title: form.title,
      artist: form.artist,
      medium: form.medium,
      dimensions: form.dimensions,
      description: form.description,
      story: form.story,
      price: Number(form.price || 0),
      saleType: form.saleType,
      city: form.city,
      country: form.country,
      yearCreated: form.yearCreated ? Number(form.yearCreated) : undefined,
      style: form.style || undefined,
      provenance: form.provenance || undefined,
      authenticity: form.authenticity || undefined,
      conditionReport: form.conditionReport || undefined,
      imageUrl,
      eventId: form.eventId || undefined,
      available: true,
      createdBy: currentUser.id,
      moderation_status: canPublishWithoutApproval(currentUser.role) ? 'approved' : 'pending',
    });

    setIsSubmitting(false);
    if (!created) {
      notify('Artwork submission failed.', 'error');
      return;
    }

    setIsSubmitted(true);
    setForm(initialState);
    setImageFile(null);
    notify(
      canPublishWithoutApproval(currentUser.role)
        ? 'Artwork published.'
        : 'Artwork submitted for admin review.',
      'success',
    );
  };

  return (
    <SiteShell>
      <Container size="xl" className="grid gap-6 py-8 sm:py-12 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-6 border-b border-border pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <p className="section-kicker">Submit Artwork</p>
          <h1 className="section-heading mt-4">Put new artwork into the marketplace pipeline.</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Artist and gallery manager applicants can submit works now. Verified creator accounts publish immediately, while everyone else goes into the admin approval queue.
          </p>
          {!currentUser ? (
            <Card className="mt-6 border-dashed p-5">
              <p className="text-sm text-muted-foreground">
                This page is only for artist or gallery manager accounts.
              </p>
              <Button className="mt-4" onClick={openAuthDialog}>
                Sign in / Sign up as creator
              </Button>
            </Card>
          ) : !hasCreatorAccess ? (
            <Card className="mt-6 border-dashed p-5">
              <p className="text-sm text-muted-foreground">
                Collector accounts cannot access artwork submissions. Apply as an artist or gallery manager first.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => void requestCreatorRole('artist_pending')}>
                  Apply as artist
                </Button>
                <Button variant="outline" onClick={() => void requestCreatorRole('gallery_manager_pending')}>
                  Apply as gallery manager
                </Button>
              </div>
            </Card>
          ) : null}
          {isSubmitted ? (
            <Card className="mt-6 border-dashed p-5">
              <p className="text-sm font-semibold">Submission received.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {canPublishWithoutApproval(currentUser?.role)
                  ? 'Your artwork is live immediately because this account is verified.'
                  : 'Your artwork is waiting for admin approval.'}
              </p>
            </Card>
          ) : null}
        </div>

        <Card className="p-6 sm:p-8">
          {!hasCreatorAccess ? null : (
            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="md:col-span-2">
                <p className="section-kicker">Artwork Info</p>
              </div>
              <Field label="Artwork title">
                <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              </Field>
              <Field label="Artist name">
                <Input value={form.artist} onChange={(event) => setForm({ ...form, artist: event.target.value })} required />
              </Field>
              <Field label="Sale type">
                <Select value={form.saleType} onChange={(event) => setForm({ ...form, saleType: event.target.value as SubmitArtworkFormState['saleType'] })}>
                  <option value="fixed">Fixed price</option>
                  <option value="auction">Auction</option>
                </Select>
              </Field>
              <Field label="Price">
                <Input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
              </Field>
              <Field label="Medium">
                <Input value={form.medium} onChange={(event) => setForm({ ...form, medium: event.target.value })} required />
              </Field>
              <Field label="Dimensions">
                <Input value={form.dimensions} onChange={(event) => setForm({ ...form, dimensions: event.target.value })} required />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} />
              </Field>
              <Field label="Country">
                <Input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} />
              </Field>
              <div className="md:col-span-2 border-t border-border pt-4">
                <p className="section-kicker">Provenance And Assets</p>
              </div>
              <Field label="Year created">
                <Input value={form.yearCreated} onChange={(event) => setForm({ ...form, yearCreated: event.target.value })} placeholder="2025" />
              </Field>
              <Field label="Style">
                <Input value={form.style} onChange={(event) => setForm({ ...form, style: event.target.value })} placeholder="Abstract, lacquer, figurative..." />
              </Field>
              <Field label="Provenance">
                <Input value={form.provenance} onChange={(event) => setForm({ ...form, provenance: event.target.value })} />
              </Field>
              <Field label="Authenticity">
                <Input value={form.authenticity} onChange={(event) => setForm({ ...form, authenticity: event.target.value })} />
              </Field>
              <Field label="Condition report">
                <Input value={form.conditionReport} onChange={(event) => setForm({ ...form, conditionReport: event.target.value })} />
              </Field>
              <Field label="Related event ID (optional)">
                <Input value={form.eventId} onChange={(event) => setForm({ ...form, eventId: event.target.value })} />
              </Field>
              <Field label="Hero image file">
                <Input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
              </Field>
              <Field label="Hero image URL">
                <Input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Story">
                  <Textarea value={form.story} onChange={(event) => setForm({ ...form, story: event.target.value })} />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit artwork'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </Container>
    </SiteShell>
  );
};
