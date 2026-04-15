'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
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

type SnapState = 'collapsed' | 'half' | 'full';

const SNAP_HEIGHTS: Record<SnapState, string> = {
  collapsed: 'calc(100dvh - 80px)',
  half: '55dvh',
  full: '10dvh',
};

const SNAP_ORDER: SnapState[] = ['collapsed', 'half', 'full'];

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

  // Mobile bottom sheet snap state
  const [snap, setSnap] = useState<SnapState>('half');
  const dragStartY = useRef<number>(0);
  const dragStartSnap = useRef<SnapState>('half');

  const handleDragStart = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    dragStartSnap.current = snap;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    const delta = dragStartY.current - e.clientY;
    const i = SNAP_ORDER.indexOf(dragStartSnap.current);
    if (delta > 60 && i < 2) setSnap(SNAP_ORDER[i + 1]);
    else if (delta < -60 && i > 0) setSnap(SNAP_ORDER[i - 1]);
  };

  // Shared sidebar content rendered in both desktop aside and mobile sheet
  const SidebarContent = () => (
    <>
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
    </>
  );

  return (
    <div className="fixed inset-0 z-50 bg-background">

      {/* Map layer — absolute full-screen on mobile, flex row on desktop */}
      <div className="absolute inset-0 md:relative md:flex md:h-full">

        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden md:flex md:w-80 md:shrink-0 md:flex-col md:overflow-hidden md:border-r md:border-border">
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
          <SidebarContent />
        </aside>

        {/* Map — fills remaining space on desktop, full screen on mobile */}
        <div
          className="relative h-full flex-1"
          style={{ paddingBottom: 'var(--route-sheet-peek, 0px)' }}
        >
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

      {/* Mobile bottom sheet — hidden md+ */}
      <div
        className="fixed inset-x-0 bottom-0 z-10 flex flex-col rounded-t-2xl border-t border-border bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden"
        style={{ transform: `translateY(${SNAP_HEIGHTS[snap]})`, height: '100dvh' }}
      >
        {/* Drag handle — only this zone triggers snap */}
        <div
          className="flex shrink-0 touch-none select-none flex-col items-center gap-2 px-4 pb-2 pt-3 cursor-grab active:cursor-grabbing"
          onPointerDown={handleDragStart}
          onPointerUp={handleDragEnd}
        >
          <div className="h-1 w-10 rounded-full bg-border" />
          {snap === 'collapsed' && (
            <div className="flex w-full items-center justify-between">
              <p className="text-sm font-semibold">{routeEvents.length} {t.selectedStops}</p>
              <span className="text-xs text-muted-foreground">{t.routingKicker}</span>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
          <SidebarContent />
        </div>
      </div>

    </div>
  );
};
