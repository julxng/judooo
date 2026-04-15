import Link from 'next/link';
import { ArrowRight, CalendarDays, Search, Shapes } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { SiteShell } from '@/components/layout/SiteShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { formatDateRange } from '@/lib/date';
import { formatCurrency } from '@/lib/format';
import type { ArtEvent, Artwork } from '@/types';
import { searchCatalog } from '../api';
import type { SearchResultsPageProps } from '../types';

const getMarketplaceSearchHref = (query: string) =>
  `/marketplace?search=${encodeURIComponent(query)}`;

const getEventsSearchHref = (query: string) =>
  `/events?search=${encodeURIComponent(query)}`;

const getArtworkDescription = (description?: string, story?: string) =>
  description || story || '';

const getArtworkLocation = (city?: string, country?: string) =>
  city || country || 'Vietnam';

const getArtworkMedium = (medium?: string) =>
  medium || 'Mixed media';

const getEventTitle = (event: ArtEvent) =>
  event.name_en || event.name_vie || event.title;

const getEventDescription = (event: ArtEvent) =>
  event.description_en || event.description_vie || event.description;

const getEventLocation = (event: ArtEvent) =>
  event.location || event.city || event.address || 'Vietnam';

const ArtworkResultCard = ({ artwork, query }: { artwork: Artwork; query: string }) => (
  <Link
    href={getMarketplaceSearchHref(artwork.title)}
    className="group flex gap-0 overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/30 hover:shadow-md"
  >
    <div className="relative w-28 shrink-0 overflow-hidden bg-secondary sm:w-36">
      {artwork.imageUrl ? (
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
          <Shapes size={24} />
        </div>
      )}
    </div>
    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent" className="text-[0.6rem]">
            {artwork.saleType === 'auction' ? 'Auction' : 'Artwork'}
          </Badge>
          {(artwork.city || artwork.country) ? (
            <Badge className="text-[0.6rem]">{getArtworkLocation(artwork.city, artwork.country)}</Badge>
          ) : null}
        </div>
        <h3 className="line-clamp-1 font-display text-[1.1rem] leading-tight tracking-[-0.03em] text-foreground">
          {artwork.title}
        </h3>
        <p className="text-sm font-medium text-foreground/70">{artwork.artist}</p>
        <p className="text-xs text-muted-foreground">
          {getArtworkMedium(artwork.medium)}
          {artwork.dimensions ? ` · ${artwork.dimensions}` : ''}
        </p>
        {getArtworkDescription(artwork.description, artwork.story) ? (
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {getArtworkDescription(artwork.description, artwork.story)}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {artwork.saleType === 'auction' ? 'Current bid' : 'Price'}
          </p>
          <p className="font-display text-[1.1rem] leading-none tracking-[-0.02em] text-foreground">
            {formatCurrency(artwork.currentBid || artwork.price)}
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          View <ArrowRight size={12} />
        </span>
      </div>
    </div>
  </Link>
);

const EventResultCard = ({ event }: { event: ArtEvent }) => (
  <Link
    href={`/events/${event.slug}`}
    className="group flex gap-0 overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/30 hover:shadow-md"
  >
    <div className="relative w-28 shrink-0 overflow-hidden bg-secondary sm:w-36">
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={getEventTitle(event)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
          <CalendarDays size={24} />
        </div>
      )}
    </div>
    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {(event.event_type || event.category) ? (
            <Badge tone="accent" className="text-[0.6rem]">{event.event_type || event.category}</Badge>
          ) : null}
          {event.city ? <Badge className="text-[0.6rem]">{event.city}</Badge> : null}
          {event.is_free ? <Badge tone="success" className="text-[0.6rem]">Free</Badge> : null}
        </div>
        <h3 className="line-clamp-2 font-display text-[1.1rem] leading-tight tracking-[-0.03em] text-foreground">
          {getEventTitle(event)}
        </h3>
        <p className="text-xs text-muted-foreground">
          {formatDateRange(event.startDate, event.endDate, 'en-US')}
        </p>
        {event.organizer ? (
          <p className="text-sm font-medium text-foreground/70">{event.organizer}</p>
        ) : null}
        {getEventDescription(event) ? (
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {getEventDescription(event)}
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">{getEventLocation(event)}</p>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          View <ArrowRight size={12} />
        </span>
      </div>
    </div>
  </Link>
);

export const SearchResultsPage = ({
  initialArtworks = [],
  initialEvents = [],
  initialSearch,
}: SearchResultsPageProps) => {
  const { query, artworks, events } = searchCatalog({
    artworks: initialArtworks,
    events: initialEvents,
    query: initialSearch ?? '',
  });
  const totalResults = artworks.length + events.length;

  return (
    <SiteShell>
      <Container size="xl" className="space-y-8 py-8 md:py-12">
        {/* Search header */}
        <section className="space-y-4">
          <form action="/search" className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                defaultValue={query}
                placeholder="Search artworks, artists, venues, events…"
                className="pl-10"
                autoFocus={!query}
              />
            </div>
            <Button type="submit" className="shrink-0">Search</Button>
          </form>

          {query ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{totalResults}</span> result{totalResults === 1 ? '' : 's'} for{' '}
              <span className="font-medium text-foreground">"{query}"</span>
              {totalResults > 0 ? (
                <span className="text-muted-foreground/70">
                  {' '}— {artworks.length} artwork{artworks.length === 1 ? '' : 's'}, {events.length} event{events.length === 1 ? '' : 's'}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Search across artworks and events — by artist, venue, city, or event type.
            </p>
          )}
        </section>

        {/* Empty states */}
        {!query ? (
          <EmptyState
            title="Start with an artist, artwork, venue, city, or event type."
            description="Global search checks both artworks and art events, then routes you into the matching directory."
            action={
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/marketplace"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                >
                  Browse artworks
                </Link>
                <Link
                  href="/events"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                >
                  Browse events
                </Link>
              </div>
            }
          />
        ) : null}

        {query && totalResults === 0 ? (
          <EmptyState
            title="No matches found."
            description="Try a broader keyword, a city name, an artist, or an event type."
            action={
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/marketplace"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                >
                  Browse artworks
                </Link>
                <Link
                  href="/events"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                >
                  Browse events
                </Link>
              </div>
            }
          />
        ) : null}

        {/* Artwork results */}
        {artworks.length ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Shapes size={16} className="shrink-0 text-foreground" />
                <h2 className="text-base font-semibold text-foreground">
                  Artwork results
                  <span className="ml-2 text-sm font-normal text-muted-foreground">({artworks.length})</span>
                </h2>
              </div>
              <Link
                href={getMarketplaceSearchHref(query)}
                className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {artworks.map((artwork) => (
                <ArtworkResultCard key={artwork.id} artwork={artwork} query={query} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Event results */}
        {events.length ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <CalendarDays size={16} className="shrink-0 text-foreground" />
                <h2 className="text-base font-semibold text-foreground">
                  Event results
                  <span className="ml-2 text-sm font-normal text-muted-foreground">({events.length})</span>
                </h2>
              </div>
              <Link
                href={getEventsSearchHref(query)}
                className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {events.map((event) => (
                <EventResultCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </SiteShell>
  );
};
