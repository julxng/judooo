'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Filter, Map, Rows3, Search } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EventCard } from './EventCard';
import { useEventsCatalog } from '../hooks/useEventsCatalog';
import {
  isApprovedEvent,
  matchesEventTimeline,
  sortEventsByEndDate,
  sortEventsByImportedAt,
  sortEventsBySavedCount,
  sortEventsByStartDate,
} from '../utils/event-utils';
import type { ArtEvent, EventTimeline } from '../types/event.types';

type SortMode = 'recently-imported' | 'newest' | 'ending-soon' | 'hot';

type FilterSelectConfig = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

const EventMap = dynamic(() => import('./EventMap'), {
  ssr: false,
  loading: () => <Card className="min-h-[32rem] animate-pulse bg-secondary" />,
});

interface EventsDirectoryPageProps {
  initialSection?: string | null;
  initialSearch?: string | null;
  initialEvents?: ArtEvent[];
}

export const EventsDirectoryPage = ({
  initialSection,
  initialSearch,
  initialEvents = [],
}: EventsDirectoryPageProps) => {
  const router = useRouter();
  const { currentUser, openAuthDialog } = useAuth();
  const { events, isLoading, savedEventIds, routeEventIds, toggleSavedEvent, toggleRouteEvent } =
    useEventsCatalog(initialEvents, { currentUser, onAuthRequired: openAuthDialog });

  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [timeline, setTimeline] = useState<EventTimeline>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recently-imported');
  const [search, setSearch] = useState(initialSearch ?? '');
  const [city, setCity] = useState('all');
  const [district, setDistrict] = useState('all');
  const [artMedium, setArtMedium] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [placeType, setPlaceType] = useState('all');
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlyVirtual, setOnlyVirtual] = useState(false);
  const [registrationRequired, setRegistrationRequired] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setOnlyFree(initialSection === 'free');
    setSortMode(
      initialSection === 'hot'
        ? 'hot'
        : initialSection === 'last-chance'
          ? 'ending-soon'
          : initialSection === 'new'
            ? 'recently-imported'
            : 'recently-imported',
    );
    setTimeline(initialSection === 'archive' ? 'past' : 'all');
  }, [initialSection]);

  useEffect(() => {
    setSearch(initialSearch ?? '');
  }, [initialSearch]);

  const deferredSearch = useDeferredValue(search);
  const publicEvents = useMemo(() => events.filter(isApprovedEvent), [events]);
  const toStringOptions = (values: Array<string | undefined>) => [
    'all',
    ...Array.from(new Set(values.filter((value): value is string => Boolean(value)))),
  ];
  const cityOptions = useMemo(
    () => toStringOptions(publicEvents.map((event) => event.city)),
    [publicEvents],
  );
  const districtOptions = useMemo(
    () => toStringOptions(publicEvents.map((event) => event.district)),
    [publicEvents],
  );
  const artMediumOptions = useMemo(
    () => toStringOptions(publicEvents.map((event) => event.art_medium)),
    [publicEvents],
  );
  const eventTypeOptions = useMemo(
    () => toStringOptions(publicEvents.map((event) => event.event_type)),
    [publicEvents],
  );
  const placeTypeOptions = useMemo(
    () => toStringOptions(publicEvents.map((event) => event.place_type)),
    [publicEvents],
  );

  const filteredEvents = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const base = publicEvents.filter((event) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [event.title, event.name_en, event.name_vie, event.city, event.organizer, event.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      return (
        matchesSearch &&
        matchesEventTimeline(event, timeline) &&
        (city === 'all' || event.city === city) &&
        (district === 'all' || event.district === district) &&
        (artMedium === 'all' || event.art_medium === artMedium) &&
        (eventType === 'all' || event.event_type === eventType) &&
        (placeType === 'all' || event.place_type === placeType) &&
        (!onlyFree || Boolean(event.is_free)) &&
        (!onlyVirtual || Boolean(event.is_virtual)) &&
        (!registrationRequired || Boolean(event.registration_required))
      );
    });

    if (sortMode === 'recently-imported') return sortEventsByImportedAt(base);
    if (sortMode === 'ending-soon') return sortEventsByEndDate(base);
    if (sortMode === 'hot') return sortEventsBySavedCount(base);
    return sortEventsByStartDate(base);
  }, [
    artMedium,
    city,
    district,
    eventType,
    onlyFree,
    onlyVirtual,
    placeType,
    publicEvents,
    registrationRequired,
    deferredSearch,
    sortMode,
    timeline,
  ]);

  useEffect(() => {
    if (!filteredEvents.length) {
      setSelectedEventId(null);
      return;
    }

    if (!selectedEventId || !filteredEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(filteredEvents[0].id);
    }
  }, [filteredEvents, selectedEventId]);

  const filterSelects: FilterSelectConfig[] = [
    { label: 'City', value: city, onChange: setCity, options: cityOptions },
    { label: 'District', value: district, onChange: setDistrict, options: districtOptions },
    { label: 'Art Medium', value: artMedium, onChange: setArtMedium, options: artMediumOptions },
    { label: 'Event Type', value: eventType, onChange: setEventType, options: eventTypeOptions },
    { label: 'Place Type', value: placeType, onChange: setPlaceType, options: placeTypeOptions },
  ];

  return (
    <SiteShell>
      <Container size="xl" className="space-y-10 py-8 md:py-10">
        <section className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <p className="section-kicker">All Events</p>
            <h1 className="section-heading max-w-4xl">
              Browse the full calendar with sharper filtering and map context.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              This page holds the complete directory: search across venues and titles, narrow by medium or event type, then save stops directly into the route planner.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'secondary'}
              onClick={() => setViewMode('grid')}
            >
              <Rows3 size={16} />
              Grid
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'secondary'}
              onClick={() => setViewMode('map')}
            >
              <Map size={16} />
              Map
            </Button>
          </div>
        </section>

        <section className={`grid gap-6 ${viewMode === 'grid' ? 'xl:grid-cols-[19rem_1fr]' : ''}`}>
          {viewMode === 'grid' ? (
            <Card className="h-fit p-5 xl:sticky xl:top-28">
              <div className="mb-5 flex items-center gap-2">
                <Filter size={16} className="text-foreground" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Filters
                </p>
              </div>

              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Search</span>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search all event fields" />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Timeline</span>
                    <Select value={timeline} onChange={(event) => setTimeline(event.target.value as EventTimeline)}>
                    <option value="all">All</option>
                    <option value="active">Current</option>
                    <option value="past">Past</option>
                  </Select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Sort</span>
                  <Select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                    <option value="recently-imported">Recently imported</option>
                    <option value="newest">Newest</option>
                    <option value="ending-soon">Ending soon</option>
                    <option value="hot">Hot</option>
                  </Select>
                </label>

                {filterSelects.map(({ label, value, onChange, options }) => (
                  <label key={label} className="block space-y-2">
                    <span className="text-sm font-medium">{label}</span>
                    <Select value={value} onChange={(event) => onChange(event.target.value)}>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option === 'all' ? `All ${label}` : option}
                        </option>
                      ))}
                    </Select>
                  </label>
                ))}

                <div className="space-y-3 border-t border-border pt-4">
                  <Checkbox label="Free events only" checked={onlyFree} onChange={(event) => setOnlyFree(event.target.checked)} />
                  <Checkbox label="Virtual events only" checked={onlyVirtual} onChange={(event) => setOnlyVirtual(event.target.checked)} />
                  <Checkbox
                    label="Registration required"
                    checked={registrationRequired}
                    onChange={(event) => setRegistrationRequired(event.target.checked)}
                  />
                </div>
              </div>
            </Card>
          ) : null}

          {viewMode === 'grid' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{filteredEvents.length} events found</p>
                <Link href="/route-planner" className="text-sm font-medium text-foreground hover:text-muted-foreground">
                  Open route planner
                </Link>
              </div>
              <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="min-h-[28rem] animate-pulse bg-secondary" />
                  ))
                  : filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isSaved={savedEventIds.includes(event.id)}
                      onOpen={() => router.push(`/events/${event.id}`)}
                      onToggleSave={() => toggleSavedEvent(event.id)}
                    />
                  ))}
              </div>
            </div>
          ) : (
            <div className="relative" style={{ height: 'calc(100vh - 10rem)' }}>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium shadow-md transition-colors hover:bg-secondary"
              >
                <Filter size={14} />
                Filters
                {filtersOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>

              {filtersOpen && (
                <Card className="absolute left-3 top-14 z-[1000] max-h-[calc(100%-4rem)] w-72 overflow-y-auto p-4 shadow-lg">
                  <div className="space-y-3">
                    <label className="block space-y-1">
                      <span className="text-xs font-medium">Search</span>
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-8 pl-8 text-xs" placeholder="Search events" />
                      </div>
                    </label>

                    <label className="block space-y-1">
                      <span className="text-xs font-medium">Timeline</span>
                      <Select className="h-8 text-xs" value={timeline} onChange={(event) => setTimeline(event.target.value as EventTimeline)}>
                        <option value="all">All</option>
                        <option value="active">Current</option>
                        <option value="past">Past</option>
                      </Select>
                    </label>

                    {filterSelects.map(({ label, value, onChange, options }) => (
                      <label key={label} className="block space-y-1">
                        <span className="text-xs font-medium">{label}</span>
                        <Select className="h-8 text-xs" value={value} onChange={(event) => onChange(event.target.value)}>
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {option === 'all' ? `All ${label}` : option}
                            </option>
                          ))}
                        </Select>
                      </label>
                    ))}

                    <div className="space-y-2 border-t border-border pt-3">
                      <Checkbox label="Free only" checked={onlyFree} onChange={(event) => setOnlyFree(event.target.checked)} />
                      <Checkbox label="Virtual only" checked={onlyVirtual} onChange={(event) => setOnlyVirtual(event.target.checked)} />
                    </div>
                  </div>
                </Card>
              )}

              <div className="absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-background/90 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-md backdrop-blur-sm">
                {filteredEvents.length} events — click a pin to view
              </div>

              <EventMap
                events={filteredEvents}
                routeIds={routeEventIds}
                selectedEventId={selectedEventId}
                onSelectEvent={setSelectedEventId}
                onEventNavigate={(id) => router.push(`/events/${id}`)}
              />
            </div>
          )}
        </section>
      </Container>
    </SiteShell>
  );
};
