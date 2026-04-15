'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowLeft, ExternalLink, MoveDown, MoveUp, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useLanguage } from '@/app/providers';
import { Button } from '@/components/ui/Button';
import { branding } from '@/assets/branding';
import { cn } from '@/lib/utils';
import { translations } from '@/lib/i18n/translations';
import { useEventsCatalog } from '../hooks/useEventsCatalog';
import { buildGoogleMapsUrl, getEventTitle, isApprovedEvent, isCurrentEvent } from '../utils/event-utils';
import type { ArtEvent } from '../types/event.types';

const EventMap = dynamic(() => import('./EventMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-secondary" />,
});

const buildRouteUrl = (coordinates: string[]) => {
  if (coordinates.length < 2) return null;
  const [origin, ...rest] = coordinates;
  const destination = rest[rest.length - 1];
  const waypoints = rest.slice(0, -1);
  const params = new URLSearchParams({ api: '1', origin, destination, travelmode: 'driving' });
  if (waypoints.length) params.set('waypoints', waypoints.join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

interface RoutePlannerPageProps {
  initialEvents?: ArtEvent[];
}

export const RoutePlannerPage = ({ initialEvents = [] }: RoutePlannerPageProps) => {
  const router = useRouter();
  const { currentUser, openAuthDialog } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].routePlanner;
  const {
    savedEvents,
    routeEvents,
    routeEventIds,
    toggleRouteEvent,
    moveRouteEvent,
    removeFromRoute,
  } = useEventsCatalog(initialEvents, { currentUser, onAuthRequired: openAuthDialog });

  const currentSavedEvents = useMemo(
    () => savedEvents.filter((e) => isApprovedEvent(e) && isCurrentEvent(e)),
    [savedEvents],
  );

  const routeUrl = useMemo(
    () => buildRouteUrl(routeEvents.map((e) => `${e.lat},${e.lng}`)),
    [routeEvents],
  );

  const mapEvents = routeEvents.length > 0 ? routeEvents : currentSavedEvents;

  return (
    <div className="fixed inset-0 z-50 flex bg-background">
      {/* ── Left sidebar ── */}
      <aside className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-border">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <img src={branding.icon} alt="Judooo" className="h-7 w-7 rounded-full" />
            <img src={branding.logo} alt="Judooo" className="h-4 w-auto object-contain" />
          </Link>
          <Link
            href="/events"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft size={13} />
            Events
          </Link>
        </div>

        {/* Route header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t.routingKicker}
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {routeEvents.length} {t.selectedStops}
            </p>
          </div>
          {routeUrl ? (
            <a
              href={routeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:opacity-80"
            >
              {t.planMyRoute}
              <ExternalLink size={12} />
            </a>
          ) : (
            <span className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">
              {t.planMyRoute}
            </span>
          )}
        </div>

        {/* Route stops */}
        <div className="shrink-0 overflow-y-auto" style={{ maxHeight: '40%' }}>
          {routeEvents.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">{t.emptyRouteMessage}</p>
          ) : (
            routeEvents.map((event, index) => (
              <div key={event.id} className="flex items-center gap-3 border-b border-border px-3 py-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{getEventTitle(event, language)}</p>
                  <p className="truncate text-xs text-muted-foreground">{event.city}</p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={() => moveRouteEvent(event.id, 'up')}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <MoveUp size={13} />
                  </button>
                  <button
                    onClick={() => moveRouteEvent(event.id, 'down')}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <MoveDown size={13} />
                  </button>
                  <button
                    onClick={() => removeFromRoute(event.id)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-rose-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Saved events header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t.savedEventsKicker}
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {currentSavedEvents.length} {t.currentStops}
            </p>
          </div>
          <Link
            href="/events"
            className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            {t.browseMore}
          </Link>
        </div>

        {/* Saved events list */}
        <div className="flex-1 overflow-y-auto">
          {!currentUser ? (
            <div className="p-4">
              <p className="mb-3 text-xs text-muted-foreground">{t.signInPrompt}</p>
              <Button size="sm" onClick={openAuthDialog}>{t.signInButton}</Button>
            </div>
          ) : currentSavedEvents.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              {t.emptyMessage}{' '}
              <Link href="/events" className="font-semibold text-foreground">{t.eventsDirectory}</Link>.
            </p>
          ) : (
            currentSavedEvents.map((event) => {
              const inRoute = routeEventIds.includes(event.id);
              return (
                <div key={event.id} className="flex items-center gap-3 border-b border-border px-3 py-2.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {event.imageUrl && (
                      <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{getEventTitle(event, language)}</p>
                    <p className="truncate text-xs text-muted-foreground">{event.city}</p>
                  </div>
                  <button
                    onClick={() => toggleRouteEvent(event.id)}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors',
                      inRoute
                        ? 'border-foreground bg-foreground text-background hover:opacity-70'
                        : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                    )}
                    title={inRoute ? t.inRoute : t.addToRoute}
                  >
                    {inRoute ? '✓' : <Plus size={13} />}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Map ── */}
      <div className="relative flex-1">
        <EventMap
          bare
          events={mapEvents}
          routeIds={routeEventIds}
          routeLabel={t.routingKicker}
          routeDescription={`${routeEvents.length} ${t.selectedStops}`}
          selectedEventId={null}
          onEventNavigate={(slug) => router.push(`/events/${slug}`)}
        />
      </div>
    </div>
  );
};
