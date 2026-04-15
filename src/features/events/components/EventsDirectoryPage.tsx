'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp, Filter, Heart, Map, Rows3, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { branding } from '@/assets/branding';
import { useAuth, useLanguage } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Masonry } from '@/components/ui/Masonry';
import { Checkbox } from '@/components/ui/Checkbox';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EventCard } from './EventCard';
import { useEventsCatalog } from '../hooks/useEventsCatalog';
import {
  getEventLocation,
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

const translations = {
  en: {
    kicker: 'All Events',
    heading: 'Browse the full calendar with sharper filtering and map context.',
    subheading: 'This page holds the complete directory: search across venues and titles, narrow by medium or event type, then save stops directly into the route planner.',
    grid: 'Grid',
    map: 'Map',
    filters: 'Filters',
    search: 'Search',
    searchPlaceholder: 'Search all event fields',
    searchPlaceholderShort: 'Search events',
    timeline: 'Timeline',
    timelineAll: 'All',
    timelineCurrent: 'Current',
    timelinePast: 'Past',
    sort: 'Sort',
    recentlyImported: 'Recently imported',
    newest: 'Newest',
    endingSoon: 'Ending soon',
    hot: 'Hot',
    city: 'City',
    district: 'District',
    artMedium: 'Art Medium',
    eventType: 'Event Type',
    placeType: 'Place Type',
    allPrefix: 'All',
    freeOnly: 'Free events only',
    virtualOnly: 'Virtual events only',
    registrationRequired: 'Registration required',
    eventsFound: (n: number) => `${n} events found`,
    openRoutePlanner: 'Open route planner',
    mapStatus: (n: number) => `${n} events — click a pin to view`,
    freeOnlyShort: 'Free only',
    virtualOnlyShort: 'Virtual only',
    showFilters: 'Show filters',
    hideFilters: 'Hide filters',
    clearFilters: 'Clear filters',
    viewDetails: 'View →',
  },
  vie: {
    kicker: 'Tất cả sự kiện',
    heading: 'Khám phá lịch trình đầy đủ với bộ lọc chi tiết và bản đồ.',
    subheading: 'Trang này chứa toàn bộ danh mục: tìm kiếm theo địa điểm và tên, lọc theo loại hình nghệ thuật hoặc sự kiện, rồi lưu điểm dừng vào lộ trình.',
    grid: 'Lưới',
    map: 'Bản đồ',
    filters: 'Bộ lọc',
    search: 'Tìm kiếm',
    searchPlaceholder: 'Tìm kiếm tất cả sự kiện',
    searchPlaceholderShort: 'Tìm sự kiện',
    timeline: 'Thời gian',
    timelineAll: 'Tất cả',
    timelineCurrent: 'Đang diễn ra',
    timelinePast: 'Đã qua',
    sort: 'Sắp xếp',
    recentlyImported: 'Mới cập nhật',
    newest: 'Mới nhất',
    endingSoon: 'Sắp kết thúc',
    hot: 'Nổi bật',
    city: 'Thành phố',
    district: 'Quận/Huyện',
    artMedium: 'Loại hình',
    eventType: 'Loại sự kiện',
    placeType: 'Loại địa điểm',
    allPrefix: 'Tất cả',
    freeOnly: 'Chỉ sự kiện miễn phí',
    virtualOnly: 'Chỉ sự kiện trực tuyến',
    registrationRequired: 'Cần đăng ký',
    eventsFound: (n: number) => `${n} sự kiện`,
    openRoutePlanner: 'Mở lộ trình',
    mapStatus: (n: number) => `${n} sự kiện — chọn ghim để xem`,
    freeOnlyShort: 'Miễn phí',
    virtualOnlyShort: 'Trực tuyến',
    showFilters: 'Hiện bộ lọc',
    hideFilters: 'Ẩn bộ lọc',
    clearFilters: 'Xóa bộ lọc',
    viewDetails: 'Xem →',
  },
} as const;

type FilterSelectConfig = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

const EventMap = dynamic(() => import('./EventMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-secondary" />,
});

const MapSidebarCard = ({
  event,
  isSelected,
  isSaved,
  language,
  onSelect,
  onSave,
  onNavigate,
  cardRef,
}: {
  event: ArtEvent;
  isSelected: boolean;
  isSaved: boolean;
  language: string;
  onSelect: () => void;
  onSave: () => void;
  onNavigate: () => void;
  cardRef: (el: HTMLElement | null) => void;

}) => {
  const lang = language === 'en' ? 'en' : ('vie' as any);
  const title = getEventTitle(event, lang);
  const location = getEventLocation(event, lang);
  return (
    <div
      ref={cardRef as any}
      className={cn(
        'flex cursor-pointer gap-3 border-b border-border p-3 transition-colors',
        isSelected ? 'bg-secondary' : 'hover:bg-secondary/50',
      )}
      onClick={onSelect}
    >
      <div className="h-16 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
        {event.imageUrl && (
          <img src={event.imageUrl} alt={title} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{event.organizer}</p>
        <p className="truncate text-xs text-muted-foreground">{location}</p>
        {isSelected && (
          <button
            className="mt-1.5 text-xs font-medium underline-offset-2 hover:underline"
            onClick={(e) => { e.stopPropagation(); onNavigate(); }}
          >
            View details →
          </button>
        )}
      </div>
      <button
        className={cn(
          'shrink-0 self-start p-1 text-muted-foreground transition-colors hover:text-foreground',
          isSaved && 'text-rose-500 hover:text-rose-600',
        )}
        onClick={(e) => { e.stopPropagation(); onSave(); }}
        aria-label={isSaved ? 'Unsave event' : 'Save event'}
      >
        <Heart size={15} className={isSaved ? 'fill-current' : ''} />
      </button>
    </div>
  );
};

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
  const { language } = useLanguage();
  const t = translations[language === 'en' ? 'en' : 'vie'];
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
  const [hoveredEvent, setHoveredEvent] = useState<{ id: string; x: number; y: number } | null>(null);
  const hideHoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

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

  useEffect(() => {
    setDistrict('all');
  }, [city]);

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
    () =>
      toStringOptions(
        publicEvents
          .filter((event) => city === 'all' || event.city === city)
          .map((event) => event.district),
      ),
    [publicEvents, city],
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

  // Scroll the sidebar card into view whenever the selection changes
  useEffect(() => {
    if (selectedEventId) {
      cardRefs.current[selectedEventId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedEventId]);

  const activeFilterCount = [
    search !== '',
    timeline !== 'all',
    sortMode !== 'recently-imported',
    city !== 'all',
    district !== 'all',
    artMedium !== 'all',
    eventType !== 'all',
    placeType !== 'all',
    onlyFree,
    onlyVirtual,
    registrationRequired,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch('');
    setTimeline('all');
    setSortMode('recently-imported');
    setCity('all');
    setDistrict('all');
    setArtMedium('all');
    setEventType('all');
    setPlaceType('all');
    setOnlyFree(false);
    setOnlyVirtual(false);
    setRegistrationRequired(false);
  };

  const handleEventNavigate = useCallback((slug: string) => router.push(`/events/${slug}`), [router]);

  const handleHoverEvent = useCallback((id: string | null, x: number, y: number) => {
    if (hideHoverTimeout.current) clearTimeout(hideHoverTimeout.current);
    if (id) {
      setHoveredEvent({ id, x, y });
    } else {
      hideHoverTimeout.current = setTimeout(() => setHoveredEvent(null), 120);
    }
  }, []);

  const cancelHover = useCallback(() => {
    if (hideHoverTimeout.current) clearTimeout(hideHoverTimeout.current);
  }, []);

  const clearHover = useCallback(() => setHoveredEvent(null), []);

  const filterSelects: FilterSelectConfig[] = [
    { label: t.city, value: city, onChange: setCity, options: cityOptions },
    { label: t.district, value: district, onChange: setDistrict, options: districtOptions },
    { label: t.artMedium, value: artMedium, onChange: setArtMedium, options: artMediumOptions },
    { label: t.eventType, value: eventType, onChange: setEventType, options: eventTypeOptions },
    { label: t.placeType, value: placeType, onChange: setPlaceType, options: placeTypeOptions },
  ];

  // ── Full-screen map mode ────────────────────────────────────────────────────
  if (viewMode === 'map') {
    const lang = language === 'en' ? 'en' : ('vie' as any);
    const hoveredEventData = hoveredEvent ? filteredEvents.find((e) => e.id === hoveredEvent.id) : null;

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
            <button
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft size={13} />
              {t.grid}
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-border px-3 py-2.5">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
                placeholder={t.searchPlaceholderShort}
              />
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border px-3 py-2">
            <div className="flex shrink-0 overflow-hidden rounded-lg border border-border">
              {([['all', t.timelineAll], ['active', t.timelineCurrent], ['past', t.timelinePast]] as const).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setTimeline(v)}
                  className={cn(
                    'h-7 px-2.5 text-xs font-medium transition-colors',
                    timeline === v ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {cityOptions.length > 2 && (
              <Select className="h-7 w-auto shrink-0 text-xs" value={city} onChange={(e) => setCity(e.target.value)}>
                {cityOptions.map((o) => <option key={o} value={o}>{o === 'all' ? t.city : o}</option>)}
              </Select>
            )}
            <button
              onClick={() => setOnlyFree(!onlyFree)}
              className={cn(
                'h-7 shrink-0 rounded-lg border px-2.5 text-xs font-medium transition-colors',
                onlyFree ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {t.freeOnlyShort}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearAllFilters} className="ml-auto shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Count */}
          <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
            {t.eventsFound(filteredEvents.length)}
          </div>

          {/* Scrollable event list */}
          <div className="flex-1 overflow-y-auto">
            {filteredEvents.map((event) => (
              <MapSidebarCard
                key={event.id}
                event={event}
                isSelected={selectedEventId === event.id}
                isSaved={savedEventIds.includes(event.id)}
                language={language}
                onSelect={() => setSelectedEventId(event.id)}
                onSave={() => toggleSavedEvent(event.id)}
                onNavigate={() => handleEventNavigate(event.slug)}
                cardRef={(el) => { cardRefs.current[event.id] = el as HTMLElement | null; }}
              />
            ))}
          </div>
        </aside>

        {/* ── Map area ── */}
        <div className="relative flex-1">
          <EventMap
            bare
            events={filteredEvents}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            onHoverEvent={handleHoverEvent}
          />

          {/* Hover card */}
          {hoveredEvent && hoveredEventData && (
            <div
              className="map-hover-card"
              style={{ left: hoveredEvent.x, top: hoveredEvent.y }}
              onMouseEnter={cancelHover}
              onMouseLeave={clearHover}
            >
              {hoveredEventData.imageUrl && (
                <img src={hoveredEventData.imageUrl} className="map-hover-card__img" alt="" />
              )}
              <div className="map-hover-card__body">
                <p className="map-hover-card__title">{getEventTitle(hoveredEventData, lang)}</p>
                <p className="map-hover-card__sub">{hoveredEventData.organizer}</p>
                <div className="map-hover-card__footer">
                  <button
                    className="map-hover-card__link"
                    onClick={() => handleEventNavigate(hoveredEventData.slug)}
                  >
                    {t.viewDetails}
                  </button>
                  <button
                    className={cn('map-hover-card__heart', savedEventIds.includes(hoveredEvent.id) && 'map-hover-card__heart--saved')}
                    onClick={() => toggleSavedEvent(hoveredEvent.id)}
                    aria-label="Save event"
                  >
                    <Heart size={14} className={savedEventIds.includes(hoveredEvent.id) ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Grid / list mode (inside SiteShell) ────────────────────────────────────
  return (
    <SiteShell>
      <Container size="xl" className="space-y-10 py-8 md:py-10">
        <section className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <p className="section-kicker">{t.kicker}</p>
            <h1 className="section-heading max-w-4xl">
              {t.heading}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              {t.subheading}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'secondary'}
              onClick={() => setViewMode('grid')}
            >
              <Rows3 size={16} />
              {t.grid}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setViewMode('map')}
            >
              <Map size={16} />
              {t.map}
            </Button>
          </div>
        </section>

        {viewMode === 'grid' && (
          <div className="flex items-center gap-3">
            <Button
              variant={filtersOpen ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Filter size={16} />
              {filtersOpen ? t.hideFilters : t.showFilters}
              {activeFilterCount > 0 && !filtersOpen && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                  {activeFilterCount}
                </span>
              )}
              {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <X size={12} />
                {t.clearFilters}
              </button>
            )}
          </div>
        )}

        <section className={`grid gap-6 ${viewMode === 'grid' && filtersOpen ? 'xl:grid-cols-[19rem_1fr]' : ''}`}>
          {viewMode === 'grid' && filtersOpen ? (
            <Card className="h-fit p-5 xl:sticky xl:top-28">
              <div className="mb-5 flex items-center gap-2">
                <Filter size={16} className="text-foreground" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t.filters}
                </p>
              </div>

              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">{t.search}</span>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder={t.searchPlaceholder} />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">{t.timeline}</span>
                    <Select value={timeline} onChange={(event) => setTimeline(event.target.value as EventTimeline)}>
                    <option value="all">{t.timelineAll}</option>
                    <option value="active">{t.timelineCurrent}</option>
                    <option value="past">{t.timelinePast}</option>
                  </Select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">{t.sort}</span>
                  <Select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
                    <option value="recently-imported">{t.recentlyImported}</option>
                    <option value="newest">{t.newest}</option>
                    <option value="ending-soon">{t.endingSoon}</option>
                    <option value="hot">{t.hot}</option>
                  </Select>
                </label>

                {filterSelects.map(({ label, value, onChange, options }) => (
                  <label key={label} className="block space-y-2">
                    <span className="text-sm font-medium">{label}</span>
                    <Select value={value} onChange={(event) => onChange(event.target.value)}>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option === 'all' ? `${t.allPrefix} ${label.toLowerCase()}` : option}
                        </option>
                      ))}
                    </Select>
                  </label>
                ))}

                <div className="space-y-3 border-t border-border pt-4">
                  <Checkbox label={t.freeOnly} checked={onlyFree} onChange={(event) => setOnlyFree(event.target.checked)} />
                  <Checkbox label={t.virtualOnly} checked={onlyVirtual} onChange={(event) => setOnlyVirtual(event.target.checked)} />
                  <Checkbox
                    label={t.registrationRequired}
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
                <p className="text-sm text-muted-foreground">{t.eventsFound(filteredEvents.length)}</p>
                <Link href="/route-planner" className="text-sm font-medium text-foreground hover:text-muted-foreground">
                  {t.openRoutePlanner}
                </Link>
              </div>
              {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="min-h-[28rem] animate-pulse bg-secondary" />
                  ))}
                </div>
              ) : (
                <Masonry>
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isSaved={savedEventIds.includes(event.id)}
                      onOpen={() => router.push(`/events/${event.slug}`)}
                      onToggleSave={() => toggleSavedEvent(event.id)}
                    />
                  ))}
                </Masonry>
              )}
            </div>
          ) : null}
        </section>
      </Container>
    </SiteShell>
  );
};
