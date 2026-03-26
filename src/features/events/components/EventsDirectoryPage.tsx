'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Map, Rows3, Search } from 'lucide-react';
import { useAuth, useLanguage } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EventCard } from './EventCard';
import { useEventsCatalog } from '../hooks/useEventsCatalog';
import {
  getEventDescription,
  getEventTitle,
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
  const { language } = useLanguage();
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

        <section className="grid gap-6 xl:grid-cols-[19rem_1fr]">
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
            <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.45fr)_1fr]">
              <div className="max-h-[calc(100vh-10rem)] space-y-3 overflow-y-auto pr-1 lg:sticky lg:top-28 lg:self-start">
                <p className="text-sm text-muted-foreground">{filteredEvents.length} events</p>
                {filteredEvents.map((event) => (
                  <Card
                    key={event.id}
                    className={`cursor-pointer p-3 transition-colors ${selectedEventId === event.id ? 'border-foreground bg-secondary' : 'hover:border-foreground'}`}
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <div className="flex gap-3">
                      <img
                        src={event.imageUrl}
                        alt={getEventTitle(event, language)}
                        className="h-20 w-16 shrink-0 rounded-md object-cover"
                        loading="lazy"
                      />
                      <div className="flex flex-1 flex-col justify-between gap-2">
                        <div className="space-y-1">
                          <Badge tone="accent">{event.event_type || event.category}</Badge>
                          <h2 className="text-sm font-semibold leading-snug">{getEventTitle(event, language)}</h2>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {getEventDescription(event, language)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.id}`); }}>
                            View details
                          </Button>
                          <Button
                            variant={routeEventIds.includes(event.id) ? 'default' : 'ghost'}
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); toggleRouteEvent(event.id); }}
                          >
                            {routeEventIds.includes(event.id) ? 'In route' : 'Save to route'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="lg:sticky lg:top-28 lg:self-start" style={{ height: 'calc(100vh - 10rem)' }}>
                <EventMap
                  events={filteredEvents}
                  routeIds={routeEventIds}
                  selectedEventId={selectedEventId}
                  onSelectEvent={setSelectedEventId}
                />
              </div>
            </div>
          )}
        </section>
      </Container>
    </SiteShell>
  );
};
