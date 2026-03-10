'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ExternalLink, MoveDown, MoveUp, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useEventsCatalog } from '../hooks/useEventsCatalog';
import { buildGoogleMapsUrl, getEventTitle, isApprovedEvent, isCurrentEvent } from '../utils/event-utils';
import type { ArtEvent } from '../types/event.types';

const buildRouteUrl = (coordinates: string[]) => {
  if (coordinates.length < 2) return null;

  const [origin, ...rest] = coordinates;
  const destination = rest[rest.length - 1];
  const waypoints = rest.slice(0, -1);
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  });

  if (waypoints.length) {
    params.set('waypoints', waypoints.join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

interface RoutePlannerPageProps {
  initialEvents?: ArtEvent[];
}

export const RoutePlannerPage = ({ initialEvents = [] }: RoutePlannerPageProps) => {
  const { currentUser, openAuthDialog } = useAuth();
  const {
    savedEvents,
    routeEvents,
    routeEventIds,
    toggleRouteEvent,
    toggleSavedEvent,
    moveRouteEvent,
    removeFromRoute,
  } = useEventsCatalog(initialEvents, { currentUser, onAuthRequired: openAuthDialog });

  const currentSavedEvents = useMemo(
    () => savedEvents.filter((event) => isApprovedEvent(event) && isCurrentEvent(event)),
    [savedEvents],
  );
  const routeUrl = useMemo(
    () => buildRouteUrl(routeEvents.map((event) => `${event.lat},${event.lng}`)),
    [routeEvents],
  );

  return (
    <SiteShell>
      <Container size="xl" className="space-y-8 py-8 sm:py-12">
        <section className="space-y-3">
          <p className="section-kicker">Route Planner</p>
          <h1 className="section-heading max-w-4xl">Turn saved events into a workable art-day route.</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Saved events stay on the left. Route items are the subset you actually want to visit in order. When two or more stops are ready, the planner opens Google Maps with that sequence.
          </p>
          {!currentUser ? (
            <Card className="border-dashed p-5">
              <p className="text-sm text-muted-foreground">
                Sign in to save events and keep your route planner synced.
              </p>
              <Button className="mt-4" onClick={openAuthDialog}>
                Sign in to save
              </Button>
            </Card>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Current Saved Events</p>
                <h2 className="mt-3 text-2xl font-semibold">{currentSavedEvents.length} current stops</h2>
              </div>
              <Link href="/events" className="text-sm font-medium text-foreground hover:text-muted-foreground">
                Browse more events
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {currentSavedEvents.length === 0 ? (
                <Card className="border-dashed p-6">
                  <p className="text-sm text-muted-foreground">
                    Nothing saved yet. Start from the <Link href="/events" className="font-semibold text-foreground">events directory</Link>.
                  </p>
                </Card>
              ) : (
                currentSavedEvents.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex gap-4">
                      <img src={event.imageUrl} alt={getEventTitle(event)} className="h-28 w-24 rounded-md object-cover" />
                      <div className="flex flex-1 flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <Badge tone="accent">{event.event_type || event.category}</Badge>
                          <h3 className="text-base font-semibold">{getEventTitle(event)}</h3>
                          <p className="text-sm text-muted-foreground">{event.city}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={routeEventIds.includes(event.id) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleRouteEvent(event.id)}
                          >
                            {routeEventIds.includes(event.id) ? 'In route' : 'Add to route'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleSavedEvent(event.id)}>
                            <Trash2 size={15} />
                            Remove
                          </Button>
                          <a
                            href={buildGoogleMapsUrl(event)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-transparent px-4 text-xs font-medium text-foreground transition-colors hover:border-border hover:bg-secondary"
                          >
                            Directions
                          </a>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">Routing Column</p>
                <h2 className="mt-3 text-2xl font-semibold">{routeEvents.length} selected stops</h2>
              </div>
              {routeUrl ? (
                <a
                  href={routeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand"
                >
                  Plan My Route
                  <ExternalLink size={16} />
                </a>
              ) : (
                <Button variant="outline" disabled>
                  Plan My Route
                </Button>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {routeEvents.length === 0 ? (
                <Card className="border-dashed p-6">
                  <p className="text-sm text-muted-foreground">
                    Add at least one saved event into the route column to start ordering stops.
                  </p>
                </Card>
              ) : (
                routeEvents.map((event, index) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-base font-semibold">{getEventTitle(event)}</p>
                        <p className="text-sm text-muted-foreground">{event.city}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" size="sm" onClick={() => moveRouteEvent(event.id, 'up')}>
                            <MoveUp size={15} />
                            Up
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => moveRouteEvent(event.id, 'down')}>
                            <MoveDown size={15} />
                            Down
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeFromRoute(event.id)}>
                            <Trash2 size={15} />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </section>
      </Container>
    </SiteShell>
  );
};
