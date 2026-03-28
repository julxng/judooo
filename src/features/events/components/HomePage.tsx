'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { ArrowRight, Clock3, Flame, Gift, MapPinned } from 'lucide-react';
import { useLanguage } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { EventCard } from './EventCard';
import { useEventsCatalog } from '../hooks/useEventsCatalog';
import {
  getEventTitle,
  isApprovedEvent,
  isCurrentEvent,
  sortEventsByEndDate,
  sortEventsByImportedAt,
  sortEventsBySavedCount,
  sortEventsByStartDate,
} from '../utils/event-utils';
import type { ArtEvent } from '../types/event.types';

const viewAllLinkClass =
  'inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground';

const sectionCards = [
  {
    title: 'Accessible discovery',
    body: 'Built for people who want art to feel open, local, and easy to follow rather than intimidating.',
  },
  {
    title: 'Better planning',
    body: 'Save events, compare cities and dates, and turn the shortlist into an actual route for the weekend.',
  },
  {
    title: 'Built for growth',
    body: 'The events hub is the first layer of a broader marketplace and artist-support ecosystem.',
  },
];

interface HomePageProps {
  initialEvents?: ArtEvent[];
}

export const HomePage = ({ initialEvents = [] }: HomePageProps) => {
  const router = useRouter();
  const { language } = useLanguage();
  const { events, isLoading, savedEventIds, toggleSavedEvent } = useEventsCatalog(initialEvents);

  const publicEvents = useMemo(
    () => events.filter((event) => isApprovedEvent(event) && isCurrentEvent(event)),
    [events],
  );
  const featuredEvents = useMemo(
    () =>
      publicEvents.filter((event) => event.featured).slice(0, 3).length
        ? publicEvents.filter((event) => event.featured).slice(0, 3)
        : sortEventsBySavedCount(publicEvents).slice(0, 3),
    [publicEvents],
  );
  const lastChanceEvents = useMemo(() => sortEventsByEndDate(publicEvents).slice(0, 10), [publicEvents]);
  const newlyAddedEvents = useMemo(() => sortEventsByStartDate(publicEvents).slice(0, 10), [publicEvents]);
  const freeEvents = useMemo(() => publicEvents.filter((event) => event.is_free).slice(0, 10), [publicEvents]);
  const hotEvents = useMemo(() => sortEventsBySavedCount(publicEvents).slice(0, 10), [publicEvents]);
  const latestCrawlEvents = useMemo(
    () => sortEventsByImportedAt(events).slice(0, 6),
    [events],
  );

  return (
    <SiteShell>
      <Container size="xl" className="space-y-16 py-8 sm:py-12">
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            {featuredEvents[0] ? (
              <div className="grid min-h-[28rem] items-end bg-card xl:min-h-[34rem] xl:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-[22rem] overflow-hidden xl:min-h-full">
                  <img
                    src={featuredEvents[0].imageUrl}
                    alt={getEventTitle(featuredEvents[0], language)}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--foreground)]/75 via-[color:var(--foreground)]/10 to-transparent" />
                </div>
                <div className="relative z-10 flex flex-col justify-end gap-5 p-8 sm:p-10">
                  <p className="section-kicker">Featured Now</p>
                  <h1 className="display-heading text-balance text-foreground">
                    Discover what the Vietnamese art scene looks like this week.
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-muted-foreground">
                    judooo starts with events: exhibitions, performances, workshops, talks, and auctions that people can actually browse, save, and plan around.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/events/${featuredEvents[0].slug}`}
                      className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand"
                    >
                      View Featured Event
                    </Link>
                    <Link
                      href="/events"
                      className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
                    >
                      Browse All Events
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-10">
                <p className="section-kicker">Loading</p>
                <h1 className="display-heading mt-4">Syncing events...</h1>
              </div>
            )}
          </Card>

          <div className="grid gap-4">
            {featuredEvents.slice(1).map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`} className="group">
                <Card className="surface-card overflow-hidden">
                  <div className="grid min-h-[16rem] grid-cols-[0.8fr_1fr]">
                    <div className="relative">
                      <img
                        src={event.imageUrl}
                        alt={getEventTitle(event, language)}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex flex-col justify-between gap-4 p-6">
                      <div className="space-y-3">
                        <Badge tone="accent">{event.event_type || event.category}</Badge>
                        <h2 className="text-xl font-semibold tracking-[-0.02em]">{getEventTitle(event, language)}</h2>
                        <p className="text-sm leading-7 text-muted-foreground">{event.city}</p>
                      </div>
                      <span className={viewAllLinkClass}>
                        Open detail <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {sectionCards.map((item) => (
            <Card key={item.title} className="p-6">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
            </Card>
          ))}
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="section-kicker">Latest Crawl</p>
              <h2 className="section-heading">Most recently ingested rows from the data pipeline.</h2>
            </div>
            <Link href="/events" className={viewAllLinkClass}>
              Open full directory <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {latestCrawlEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isSaved={savedEventIds.includes(event.id)}
                onOpen={() => router.push(`/events/${event.slug}`)}
                onToggleSave={() => toggleSavedEvent(event.id)}
              />
            ))}
          </div>
        </section>

        {[
          {
            title: 'Sap het / Last Chance',
            description: 'Current events ordered by the nearest closing date.',
            href: '/events?section=last-chance',
            icon: Clock3,
            events: lastChanceEvents,
          },
          {
            title: 'Event Moi / Newly Added',
            description: 'Fresh listings ordered by the latest starting dates.',
            href: '/events?section=new',
            icon: MapPinned,
            events: newlyAddedEvents,
          },
          {
            title: 'Event Free',
            description: 'Free events for easy entry into the scene.',
            href: '/events?section=free',
            icon: Gift,
            events: freeEvents,
          },
          {
            title: 'Event Hot',
            description: 'Current events ranked by saves and attention.',
            href: '/events?section=hot',
            icon: Flame,
            events: hotEvents,
          },
        ].map((section) => {
          const Icon = section.icon;

          return (
            <section key={section.title} className="space-y-5">
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2">
                    <Icon size={16} className="text-foreground" />
                    <p className="section-kicker">{section.title}</p>
                  </div>
                  <h2 className="section-heading">{section.description}</h2>
                </div>
                <Link href={section.href} className={viewAllLinkClass}>
                  View all events <ArrowRight size={16} />
                </Link>
              </div>

              <div className="flex gap-5 overflow-x-auto pb-2">
                {isLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="min-w-[18rem] max-w-[20rem] flex-1">
                      <Card className="h-full min-h-[28rem] animate-pulse bg-secondary" />
                    </div>
                  ))
                  : section.events.map((item) => (
                    <div key={item.id} className="min-w-[18rem] max-w-[20rem] flex-1">
                      <EventCard
                        event={item}
                        isSaved={savedEventIds.includes(item.id)}
                        onOpen={() => router.push(`/events/${item.slug}`)}
                        onToggleSave={() => toggleSavedEvent(item.id)}
                      />
                    </div>
                  ))}
              </div>
            </section>
          );
        })}

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="p-8">
            <p className="section-kicker">Next Layer</p>
            <h2 className="section-heading mt-4">Marketplace and artist services come after the traffic layer works.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              The product materials point toward a broader marketplace for original artworks, bookings, commissions, and support services. This build focuses the first version on event discovery and habit formation, which is the right launch surface for speed.
            </p>
          </Card>
          <Card className="p-8">
            <p className="section-kicker">Launch Checklist</p>
            <div className="mt-5 grid gap-3 text-sm text-muted-foreground">
              <p>1. Publish and curate current events.</p>
              <p>2. Drive traffic through the route planner and social channels.</p>
              <p>3. Collect submissions and approve community listings.</p>
              <p>4. Validate which event traffic turns into buyer or artist demand.</p>
            </div>
          </Card>
        </section>
      </Container>
    </SiteShell>
  );
};
