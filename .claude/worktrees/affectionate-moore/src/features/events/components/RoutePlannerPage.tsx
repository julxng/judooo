'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ExternalLink, MoveDown, MoveUp, Trash2 } from 'lucide-react';
import { useAuth, useLanguage } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { translations } from '@/lib/i18n/translations';
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
  const { language } = useLanguage();
  const t = translations[language].routePlanner;
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
          <p className="section-kicker">{t.kicker}</p>
          <h1 className="section-heading max-w-4xl">{t.heading}</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            {t.description}
          </p>
          {!currentUser ? (
            <Card className="border-dashed p-5">
              <p className="text-sm text-muted-foreground">
                {t.signInPrompt}
              </p>
              <Button className="mt-4" onClick={openAuthDialog}>
                {t.signInButton}
              </Button>
            </Card>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-kicker">{t.savedEventsKicker}</p>
                <h2 className="mt-3 text-2xl font-semibold">{currentSavedEvents.length} {t.currentStops}</h2>
              </div>
              <Link href="/events" className="text-sm font-medium text-foreground hover:text-muted-foreground">
                {t.browseMore}
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {currentSavedEvents.length === 0 ? (
                <Card className="border-dashed p-6">
                  <p className="text-sm text-muted-foreground">
                    {t.emptyMessage} <Link href="/events" className="font-semibold text-foreground">{t.eventsDirectory}</Link>.
                  </p>
                </Card>
              ) : (
                currentSavedEvents.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex gap-4">
                      <img src={event.imageUrl} alt={getEventTitle(event, language)} className="h-28 w-24 rounded-md object-cover" />
                      <div className="flex flex-1 flex-col justify-between gap-3">
                        <div className="space-y-2">
                          <Badge tone="accent">{event.event_type || event.category}</Badge>
                          <h3 className="text-base font-semibold">{getEventTitle(event, language)}</h3>
                          <p className="text-sm text-muted-foreground">{event.city}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={routeEventIds.includes(event.id) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleRouteEvent(event.id)}
                          >
                            {routeEventIds.includes(event.id) ? t.inRoute : t.addToRoute}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleSavedEvent(event.id)}>
                            <Trash2 size={15} />
                            {t.remove}
                          </Button>
                          <a
                            href={buildGoogleMapsUrl(event)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-transparent px-4 text-xs font-medium text-foreground transition-colors hover:border-border hover:bg-secondary"
                          >
                            {t.directions}
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
                <p className="section-kicker">{t.routingKicker}</p>
                <h2 className="mt-3 text-2xl font-semibold">{routeEvents.length} {t.selectedStops}</h2>
              </div>
              {routeUrl ? (
                <a
                  href={routeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand"
                >
                  {t.planMyRoute}
                  <ExternalLink size={16} />
                </a>
              ) : (
                <Button variant="outline" disabled>
                  {t.planMyRoute}
                </Button>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {routeEvents.length === 0 ? (
                <Card className="border-dashed p-6">
                  <p className="text-sm text-muted-foreground">
                    {t.emptyRouteMessage}
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
                        <p className="text-base font-semibold">{getEventTitle(event, language)}</p>
                        <p className="text-sm text-muted-foreground">{event.city}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" size="sm" onClick={() => moveRouteEvent(event.id, 'up')}>
                            <MoveUp size={15} />
                            {t.up}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => moveRouteEvent(event.id, 'down')}>
                            <MoveDown size={15} />
                            {t.down}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeFromRoute(event.id)}>
                            <Trash2 size={15} />
                            {t.remove}
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
