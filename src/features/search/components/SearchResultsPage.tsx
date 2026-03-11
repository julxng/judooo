import Link from 'next/link';
import { ArrowRight, CalendarDays, Search, Shapes } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { SiteShell } from '@/components/layout/SiteShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { formatDateRange } from '@/lib/date';
import { formatCurrency } from '@/lib/format';
import type { ArtEvent } from '@/types';
import { searchCatalog } from '../api';
import type { SearchResultsPageProps } from '../types';

const getMarketplaceSearchHref = (query: string) =>
  `/marketplace?search=${encodeURIComponent(query)}`;

const getEventsSearchHref = (query: string) =>
  `/events?search=${encodeURIComponent(query)}`;

const getArtworkTitle = (title: string) => title;

const getArtworkDescription = (description?: string, story?: string) =>
  description || story || 'No artwork description is available yet.';

const getArtworkLocation = (city?: string, country?: string) =>
  city || country || 'Vietnam';

const getArtworkMedium = (medium?: string) =>
  medium || 'Unknown medium';

const getEventTitle = (event: ArtEvent) =>
  event.name_en || event.name_vie || event.title;

const getEventDescription = (event: ArtEvent) =>
  event.description_en || event.description_vie || event.description;

const getEventLocation = (event: ArtEvent) =>
  event.location || event.city || event.address || 'Vietnam';

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
      <Container size="xl" className="space-y-10 py-8 md:py-10">
        <section className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <p className="section-kicker">Global Search</p>
            <h1 className="section-heading max-w-4xl">Search artworks and art events in one place.</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Search across the marketplace and event calendar, then jump straight into the section that matches what you found.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Badge tone="accent">{artworks.length} artworks</Badge>
            <Badge>{events.length} events</Badge>
          </div>
        </section>

        <section className="space-y-4">
          <form action="/search" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                defaultValue={query}
                placeholder="Search all artworks and events"
                className="pl-11"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {query ? (
            <p className="text-sm text-muted-foreground">
              {totalResults} result{totalResults === 1 ? '' : 's'} for "{query}"
            </p>
          ) : null}
          {query && totalResults > 0 ? (
            <p className="text-sm text-muted-foreground">
              Showing up to {artworks.length} artwork and {events.length} event matches on this page.
            </p>
          ) : null}
        </section>

        {!query ? (
          <EmptyState
            title="Start with an artist, artwork, venue, city, or event type."
            description="Global search checks both artworks and art events, then routes you into the matching directory."
            action={
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/marketplace"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                >
                  Browse artworks
                </Link>
                <Link
                  href="/events"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
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
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                >
                  Browse artworks
                </Link>
                <Link
                  href="/events"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                >
                  Browse events
                </Link>
              </div>
            }
          />
        ) : null}

        {artworks.length ? (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shapes size={18} className="text-foreground" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Artwork results</h2>
                  <p className="text-sm text-muted-foreground">Matching works pulled from the marketplace catalog.</p>
                </div>
              </div>
              <Link
                href={getMarketplaceSearchHref(query)}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
              >
                View in marketplace
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {artworks.map((artwork) => (
                <Card key={artwork.id} className="overflow-hidden border-border">
                  <div className="grid gap-0 md:grid-cols-[12rem_minmax(0,1fr)]">
                    <div className="aspect-[4/5] bg-secondary">
                      <img
                        src={artwork.imageUrl}
                        alt={getArtworkTitle(artwork.title)}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="accent">{artwork.saleType === 'auction' ? 'Auction' : 'Artwork'}</Badge>
                        {(artwork.city || artwork.country) ? (
                          <Badge>{getArtworkLocation(artwork.city, artwork.country)}</Badge>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-display text-[1.5rem] leading-[0.98] tracking-[-0.04em] text-foreground">
                          {getArtworkTitle(artwork.title)}
                        </h3>
                        <p className="text-base font-medium text-foreground">{artwork.artist}</p>
                        <p className="text-sm text-muted-foreground">
                          {getArtworkMedium(artwork.medium)}
                          {artwork.dimensions ? ` • ${artwork.dimensions}` : ''}
                        </p>
                        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {getArtworkDescription(artwork.description, artwork.story)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {artwork.saleType === 'auction' ? 'Current bid' : 'Price'}
                          </p>
                          <p className="font-display text-[1.35rem] leading-none tracking-[-0.03em] text-foreground">
                            {formatCurrency(artwork.currentBid || artwork.price)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={getMarketplaceSearchHref(getArtworkTitle(artwork.title))}
                            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                          >
                            View in marketplace
                          </Link>
                          {artwork.sourceItemUrl || artwork.sourceUrl ? (
                            <a
                              href={artwork.sourceItemUrl || artwork.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                            >
                              Open source
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {events.length ? (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CalendarDays size={18} className="text-foreground" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Event results</h2>
                  <p className="text-sm text-muted-foreground">Matching exhibitions, auctions, workshops, and talks.</p>
                </div>
              </div>
              <Link
                href={getEventsSearchHref(query)}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
              >
                View in events
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden border-border">
                  <div className="grid gap-0 md:grid-cols-[12rem_minmax(0,1fr)]">
                    <div className="aspect-[4/5] bg-secondary">
                      <img
                        src={event.imageUrl}
                        alt={getEventTitle(event)}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="accent">{event.event_type || event.category}</Badge>
                        {event.city ? <Badge>{event.city}</Badge> : null}
                        {event.is_free ? <Badge tone="success">Free</Badge> : null}
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-display text-[1.5rem] leading-[0.98] tracking-[-0.04em] text-foreground">
                          {getEventTitle(event)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDateRange(event.startDate, event.endDate, 'en-US')}
                        </p>
                        <p className="text-base font-medium text-foreground">{event.organizer}</p>
                        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {getEventDescription(event) || 'No event description is available yet.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">{getEventLocation(event)}</p>
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={`/events/${event.id}`}
                            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                          >
                            View event
                          </Link>
                          {event.sourceItemUrl || event.sourceUrl ? (
                            <a
                              href={event.sourceItemUrl || event.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                            >
                              Open source
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </SiteShell>
  );
};
