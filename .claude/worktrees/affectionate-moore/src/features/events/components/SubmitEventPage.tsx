'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Field } from '@/components/shared/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  canPublishWithoutApproval,
  canSubmitListings,
  hasCreatorWorkspaceAccess,
} from '@/features/auth/utils/roles';
import { useEventsCatalog } from '../hooks/useEventsCatalog';

type SubmitFormState = {
  title: string;
  description: string;
  organizer: string;
  category: 'exhibition' | 'auction' | 'workshop' | 'performance' | 'talk';
  event_type: string;
  art_medium: string;
  place_type: string;
  startDate: string;
  endDate: string;
  city: string;
  district: string;
  address: string;
  registration_link: string;
  imageUrl: string;
  tags: string;
  price: string;
  lat: string;
  lng: string;
  is_free: boolean;
  is_virtual: boolean;
  registration_required: boolean;
  submitter_name: string;
  submitter_email: string;
  submitter_organization: string;
};

const initialState: SubmitFormState = {
  title: '',
  description: '',
  organizer: '',
  category: 'exhibition',
  event_type: '',
  art_medium: '',
  place_type: '',
  startDate: '',
  endDate: '',
  city: '',
  district: '',
  address: '',
  registration_link: '',
  imageUrl: '',
  tags: '',
  price: '',
  lat: '',
  lng: '',
  is_free: true,
  is_virtual: false,
  registration_required: false,
  submitter_name: '',
  submitter_email: '',
  submitter_organization: '',
};

export const SubmitEventPage = () => {
  const { currentUser, openAuthDialog, requestCreatorRole } = useAuth();
  const { createEvent, uploadImage } = useEventsCatalog([], {
    currentUser,
    onAuthRequired: openAuthDialog,
  });
  const [form, setForm] = useState<SubmitFormState>(initialState);
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
      openAuthDialog();
      return;
    }

    setIsSubmitting(true);

    let heroImage = form.imageUrl;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (uploaded) heroImage = uploaded;
    }

    const created = await createEvent({
      id: `submit-${Date.now()}`,
      title: form.title,
      description: form.description,
      organizer: form.organizer,
      category: form.category,
      event_type: form.event_type,
      art_medium: form.art_medium,
      place_type: form.place_type,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      city: form.city,
      district: form.district,
      location: form.address || form.city || 'Vietnam',
      address: form.address,
      imageUrl: heroImage,
      registration_link: form.registration_link || undefined,
      price: form.price ? Number(form.price) : undefined,
      lat: Number(form.lat || 10.7769),
      lng: Number(form.lng || 106.7009),
      is_free: form.is_free,
      is_virtual: form.is_virtual,
      registration_required: form.registration_required,
      tags: form.tags
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      moderation_status: canPublishWithoutApproval(currentUser.role) ? 'approved' : 'pending',
      submitter_name: form.submitter_name,
      submitter_email: form.submitter_email,
      submitter_organization: form.submitter_organization || undefined,
    });

    setIsSubmitting(false);
    if (created) {
      setIsSubmitted(true);
      setForm(initialState);
      setImageFile(null);
    }
  };

  return (
    <SiteShell>
      <Container size="xl" className="grid gap-6 py-8 sm:py-12 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-6 border-b border-border pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
          <p className="section-kicker">Submit Your Event</p>
          <h1 className="section-heading mt-4">Send events into the admin review queue.</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            This form collects the event fields from your planning documents plus contact information for the person submitting it. Verified artists and gallery managers publish immediately; everyone else goes into admin review.
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
                Collector accounts cannot access submissions. Apply as an artist or gallery manager first.
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
                  ? 'Your event is live immediately because this account is verified.'
                  : 'The event has been added to the pending queue for review.'}
              </p>
            </Card>
          ) : null}
        </div>

        <Card className="p-6 sm:p-8">
          {!hasCreatorAccess ? null : (
            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="md:col-span-2">
                <p className="section-kicker">Event Info</p>
              </div>
              <Field label="Event title">
                <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              </Field>
              <Field label="Organizer">
                <Input value={form.organizer} onChange={(event) => setForm({ ...form, organizer: event.target.value })} required />
              </Field>
              <Field label="Category">
                <Select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as SubmitFormState['category'] })}>
                  <option value="exhibition">Exhibition</option>
                  <option value="auction">Auction</option>
                  <option value="workshop">Workshop</option>
                  <option value="performance">Performance</option>
                  <option value="talk">Talk</option>
                </Select>
              </Field>
              <Field label="Event type">
                <Input value={form.event_type} onChange={(event) => setForm({ ...form, event_type: event.target.value })} placeholder="Exhibition Opening, Talk, Workshop..." />
              </Field>
              <Field label="Art medium">
                <Input value={form.art_medium} onChange={(event) => setForm({ ...form, art_medium: event.target.value })} placeholder="Painting, Video Art, Installation..." />
              </Field>
              <Field label="Place type">
                <Input value={form.place_type} onChange={(event) => setForm({ ...form, place_type: event.target.value })} placeholder="Gallery, Studio, Virtual..." />
              </Field>
              <Field label="Start date">
                <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required />
              </Field>
              <Field label="End date">
                <Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
              </Field>
              <div className="md:col-span-2 border-t border-border pt-4">
                <p className="section-kicker">Location</p>
              </div>
              <Field label="City">
                <Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required />
              </Field>
              <Field label="District">
                <Input value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} />
              </Field>
              <Field label="Address" hint="Used for detail page and route planning.">
                <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              </Field>
              <Field label="Registration link">
                <Input value={form.registration_link} onChange={(event) => setForm({ ...form, registration_link: event.target.value })} placeholder="https://..." />
              </Field>
              <Field label="Latitude">
                <Input value={form.lat} onChange={(event) => setForm({ ...form, lat: event.target.value })} placeholder="10.7769" />
              </Field>
              <Field label="Longitude">
                <Input value={form.lng} onChange={(event) => setForm({ ...form, lng: event.target.value })} placeholder="106.7009" />
              </Field>
              <div className="md:col-span-2 border-t border-border pt-4">
                <p className="section-kicker">Assets And Contact</p>
              </div>
              <Field label="Hero image file">
                <Input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />
              </Field>
              <Field label="Hero image URL">
                <Input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." />
              </Field>
              <Field label="Price (optional)">
                <Input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="180000" />
              </Field>
              <Field label="Tags" hint="Comma-separated">
                <Input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="featured, free, hanoi" />
              </Field>
              <Field label="Your name">
                <Input value={form.submitter_name} onChange={(event) => setForm({ ...form, submitter_name: event.target.value })} required />
              </Field>
              <Field label="Your email">
                <Input type="email" value={form.submitter_email} onChange={(event) => setForm({ ...form, submitter_email: event.target.value })} required />
              </Field>
              <Field label="Organization (optional)">
                <Input value={form.submitter_organization} onChange={(event) => setForm({ ...form, submitter_organization: event.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
                </Field>
              </div>
              <div className="space-y-3 border-t border-border pt-4 md:col-span-2">
                <Checkbox label="Free event" checked={form.is_free} onChange={(event) => setForm({ ...form, is_free: event.target.checked })} />
                <Checkbox label="Virtual event" checked={form.is_virtual} onChange={(event) => setForm({ ...form, is_virtual: event.target.checked })} />
                <Checkbox
                  label="Registration required"
                  checked={form.registration_required}
                  onChange={(event) => setForm({ ...form, registration_required: event.target.checked })}
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit for review'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </Container>
    </SiteShell>
  );
};
