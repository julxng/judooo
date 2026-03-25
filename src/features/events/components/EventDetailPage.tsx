'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, MapPinned, MessageCircle, Palette, Share2 } from 'lucide-react';
import { useAuth, useLanguage } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { EventCard } from './EventCard';
import { useEventsCatalog } from '../hooks/useEventsCatalog';
import {
  buildGoogleMapsUrl,
  getEventChips,
  getEventDescription,
  getEventDistrict,
  getEventAddress,
  getEventCity,
  getEventTitle,
  isApprovedEvent,
} from '../utils/event-utils';
import { getArtworkTitle, getArtworkMedium } from '@/features/marketplace/utils/artwork-utils';
import { ArtworkDetailModal } from '@/features/marketplace/components/ArtworkDetailModal';
import { formatCurrency } from '@/lib/format';
import { formatDateRange } from '@/lib/date';
import type { ArtEvent } from '../types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';

interface EventDetailPageProps {
  eventId: string;
  initialEvent?: ArtEvent | null;
  initialRelatedEvents?: ArtEvent[];
  initialArtworks?: Artwork[];
}

export const EventDetailPage = ({
  eventId,
  initialEvent = null,
  initialRelatedEvents = [],
  initialArtworks = [],
}: EventDetailPageProps) => {
  const router = useRouter();
  const { currentUser, openAuthDialog } = useAuth();
  const { language } = useLanguage();
  const initialEvents = useMemo(
    () =>
      [initialEvent, ...initialRelatedEvents].filter(
        (event, index, items): event is ArtEvent => {
          if (!event) {
            return false;
          }

          return items.findIndex((candidate) => candidate?.id === event.id) === index;
        },
      ),
    [initialEvent, initialRelatedEvents],
  );
  const { events, isLoading, savedEventIds, routeEventIds, toggleSavedEvent, toggleRouteEvent } =
    useEventsCatalog(initialEvents, {
      currentUser,
      onAuthRequired: openAuthDialog,
      skipAutoRefresh: true,
    });
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);

  const event = useMemo(
    () => events.find((item) => item.id === eventId && isApprovedEvent(item)) || null,
    [eventId, events],
  );
  const media = useMemo(() => {
    if (!event) return [];
    return [
      { type: 'image' as const, url: event.imageUrl },
      ...(event.media || []),
      ...(event.socialvideo_url ? [{ type: 'video' as const, url: event.socialvideo_url }] : []),
    ].filter(
      (item, index, items) =>
        item.url &&
        items.findIndex((candidate) => candidate.type === item.type && candidate.url === item.url) ===
          index,
    );
  }, [event]);
  const relatedEvents = useMemo(
    () =>
      events
        .filter((item) => item.id !== eventId && item.city === event?.city && isApprovedEvent(item))
        .slice(0, 3),
    [event, eventId, events],
  );

  const shareEvent = async () => {
    if (!event) return;

    const shareData = {
      title: getEventTitle(event, language),
      text: getEventDescription(event, language),
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
    } catch {
      //
    }
  };

  if (isLoading) {
    return (
      <SiteShell>
        <Container size="xl" className="py-12">
          <Card className="min-h-[26rem] animate-pulse bg-secondary" />
        </Container>
      </SiteShell>
    );
  }

  if (!event) {
    return (
      <SiteShell>
        <Container size="lg" className="py-12">
          <Card className="p-8">
            <p className="section-kicker">Missing Event</p>
            <h1 className="section-heading mt-4">This event could not be found.</h1>
            <Link href="/events" className="mt-6 inline-flex text-sm font-medium text-foreground hover:text-muted-foreground">
              Return to all events
            </Link>
          </Card>
        </Container>
      </SiteShell>
    );
  }

  const activeMedia = media[activeMediaIndex] || media[0];

  return (
    <SiteShell>
      <Container size="xl" className="space-y-8 py-8 sm:py-12">
        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden">
            <div className="relative min-h-[26rem] bg-secondary">
              {activeMedia?.type === 'video' ? (
                <video src={activeMedia.url} controls className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <img
                  src={activeMedia?.url || event.imageUrl}
                  alt={getEventTitle(event, language)}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>
            {media.length > 1 ? (
              <div className="flex gap-3 overflow-x-auto p-4">
                {media.map((item, index) => (
                  <button
                    key={`${item.url}-${index}`}
                    type="button"
                    className={`overflow-hidden rounded-md border ${index === activeMediaIndex ? 'border-foreground' : 'border-border'}`}
                    onClick={() => setActiveMediaIndex(index)}
                  >
                    {item.type === 'video' ? (
                      <div className="flex h-20 w-28 items-center justify-center bg-secondary text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Video
                      </div>
                    ) : (
                      <img src={item.url} alt={getEventTitle(event, language)} className="h-20 w-28 object-cover" />
                    )}
                  </button>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="p-8">
            <div className="space-y-4">
              <Badge tone="accent">{event.event_type || event.category}</Badge>
              <h1 className="section-heading">{getEventTitle(event, language)}</h1>
              <p className="text-sm leading-7 text-muted-foreground">{getEventDescription(event, language)}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Card className="bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Date & time
                </p>
                <p className="mt-2 text-sm font-medium">{formatDateRange(event.startDate, event.endDate)}</p>
              </Card>
              <Card className="bg-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Location
                </p>
                <p className="mt-2 text-sm font-medium">{getEventAddress(event, language)}</p>
              </Card>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant={savedEventIds.includes(event.id) ? 'default' : 'outline'} onClick={() => toggleSavedEvent(event.id)}>
                {savedEventIds.includes(event.id) ? 'Saved' : 'Save to route'}
              </Button>
              <Button variant={routeEventIds.includes(event.id) ? 'default' : 'secondary'} onClick={() => toggleRouteEvent(event.id)}>
                {routeEventIds.includes(event.id) ? 'In route' : 'Add to route'}
              </Button>
              <Button variant="ghost" onClick={shareEvent}>
                <Share2 size={16} />
                Share
              </Button>
              <a
                href={buildGoogleMapsUrl(event)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                <MapPinned size={16} />
                Get direction
              </a>
              {event.registration_link ? (
                <a
                  href={event.registration_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand"
                >
                  Register
                  <ExternalLink size={16} />
                </a>
              ) : null}
            </div>

            <div className="mt-6 space-y-4 border-t border-border pt-6">
              <div className="grid gap-3 text-sm text-muted-foreground">
                <p>City: <span className="font-medium text-foreground">{getEventCity(event, language) || 'Updating'}</span></p>
                <p>District: <span className="font-medium text-foreground">{getEventDistrict(event, language) || 'Updating'}</span></p>
                <p>Price: <span className="font-medium text-foreground">{event.is_free ? 'Free' : event.price ? `${event.price.toLocaleString()} VND` : 'Contact organizer'}</span></p>
              </div>
              <div className="flex flex-wrap gap-2">
                {getEventChips(event, language).map((chip) => (
                  <Badge key={chip}>{chip}</Badge>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {initialArtworks.length > 0 ? (
          <section className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-2">
                <Palette size={16} className="text-foreground" />
                <p className="section-kicker">
                  {language === 'en' ? 'Gallery Artworks' : 'Tac pham cua gallery'}
                </p>
              </div>
              <h2 className="section-heading">
                {language === 'en'
                  ? `Artworks from ${event.organizer}`
                  : `Tac pham tu ${event.organizer}`}
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {initialArtworks.slice(0, 5).map((artwork) => (
                <Card key={artwork.id} className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md" onClick={() => setActiveArtwork(artwork)}>
                  <div className="relative aspect-square">
                    <img
                      src={artwork.imageUrl}
                      alt={getArtworkTitle(artwork, language)}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="text-sm font-semibold">{getArtworkTitle(artwork, language)}</h3>
                    <p className="text-xs text-muted-foreground">{artwork.artist}</p>
                    <p className="text-xs text-muted-foreground">{getArtworkMedium(artwork, language)}</p>
                    {artwork.price ? (
                      <p className="text-sm font-medium">{formatCurrency(artwork.price)}</p>
                    ) : null}
                    {event.gallery_contact ? (
                      <a
                        href={
                          event.gallery_contact.includes('@')
                            ? `mailto:${event.gallery_contact}?subject=Inquiry: ${getArtworkTitle(artwork, language)}`
                            : `https://wa.me/${event.gallery_contact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi, I'm interested in "${getArtworkTitle(artwork, language)}"`)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                        onClick={() => window.plausible?.('inquire_click', { props: { gallery_name: event.organizer } })}
                      >
                        <MessageCircle size={12} />
                        {language === 'en' ? 'Inquire' : 'Lien he'}
                      </a>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {relatedEvents.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-kicker">Nearby context</p>
                <h2 className="section-heading">More events in {event.city}</h2>
              </div>
              <Link href="/events" className="text-sm font-medium text-foreground hover:text-muted-foreground">
                Back to directory
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {relatedEvents.map((relatedEvent) => (
                <EventCard
                  key={relatedEvent.id}
                  event={relatedEvent}
                  isSaved={savedEventIds.includes(relatedEvent.id)}
                  onOpen={() => router.push(`/events/${relatedEvent.id}`)}
                  onToggleSave={() => toggleSavedEvent(relatedEvent.id)}
                />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
      {activeArtwork ? (
        <ArtworkDetailModal
          artwork={activeArtwork}
          onClose={() => setActiveArtwork(null)}
          onAction={() => setActiveArtwork(null)}
        />
      ) : null}
    </SiteShell>
  );
};
