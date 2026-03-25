'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowRight, Filter, Palette } from 'lucide-react';
import { useLanguage } from '@/app/providers';
import { SiteShell } from '@/components/layout/SiteShell';
import { Badge, Button, Card } from '@/components/ui';
import { Container } from '@/components/ui/Container';
import { NewsletterSignup } from '@/components/shared/NewsletterSignup';
import { formatDateRange } from '@/lib/date';
import { EventCard } from './EventCard';
import { useEventsCatalog } from '../hooks/useEventsCatalog';
import {
  getEventCity,
  getEventTitle,
  isApprovedEvent,
  isCurrentEvent,
  sortEventsByStartDate,
} from '../utils/event-utils';
import type { ArtEvent } from '../types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import type { Locale } from '@/lib/i18n/translations';

const copy: Record<Locale, {
  hero: string;
  heroSub: string;
  allCities: string;
  allTypes: string;
  englishFriendly: string;
  featuredNow: string;
  thisWeek: string;
  viewAll: string;
  artworksAvailable: string;
  noEvents: string;
  filterBy: string;
}> = {
  en: {
    hero: 'This week in Vietnam art',
    heroSub: 'Curated exhibitions, workshops, and events across Vietnam. Updated weekly.',
    allCities: 'All cities',
    allTypes: 'All types',
    englishFriendly: 'English-friendly',
    featuredNow: 'Featured',
    thisWeek: 'Happening now',
    viewAll: 'View all events',
    artworksAvailable: 'Artworks available',
    noEvents: 'No events match your filters. Try adjusting your selection.',
    filterBy: 'Filter',
  },
  vi: {
    hero: 'Tuần này trong nghệ thuật Việt Nam',
    heroSub: 'Triển lãm, workshop và sự kiện nghệ thuật được chọn lọc. Cập nhật hàng tuần.',
    allCities: 'Tất cả thành phố',
    allTypes: 'Tất cả loại',
    englishFriendly: 'Có tiếng Anh',
    featuredNow: 'Nổi bật',
    thisWeek: 'Đang diễn ra',
    viewAll: 'Xem tất cả sự kiện',
    artworksAvailable: 'Có tác phẩm',
    noEvents: 'Không có sự kiện phù hợp. Hãy thử thay đổi bộ lọc.',
    filterBy: 'Lọc',
  },
};

const EVENT_TYPES = ['exhibition', 'auction', 'workshop', 'performance', 'talk'] as const;

interface CuratedEventsPageProps {
  initialEvents?: ArtEvent[];
  initialArtworks?: Artwork[];
}

export const CuratedEventsPage = ({ initialEvents = [], initialArtworks = [] }: CuratedEventsPageProps) => {
  const router = useRouter();
  const { language } = useLanguage();
  const t = copy[language];
  const { events, isLoading, savedEventIds, toggleSavedEvent } = useEventsCatalog(initialEvents);

  const [cityFilter, setCityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [englishOnly, setEnglishOnly] = useState(false);

  const artworksByEventId = useMemo(() => {
    const map = new Map<string, Artwork[]>();
    for (const artwork of initialArtworks) {
      if (artwork.eventId) {
        const existing = map.get(artwork.eventId) || [];
        existing.push(artwork);
        map.set(artwork.eventId, existing);
      }
    }
    return map;
  }, [initialArtworks]);

  const publicEvents = useMemo(
    () => events.filter((event) => isApprovedEvent(event) && isCurrentEvent(event)),
    [events],
  );

  const featuredEvents = useMemo(
    () => publicEvents.filter((event) => event.featured),
    [publicEvents],
  );

  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const event of publicEvents) {
      const city = getEventCity(event, language);
      if (city) set.add(city);
    }
    return Array.from(set).sort();
  }, [publicEvents, language]);

  const filteredEvents = useMemo(() => {
    let result = publicEvents;

    if (cityFilter !== 'all') {
      result = result.filter((event) => getEventCity(event, language) === cityFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((event) => (event.event_type || event.category) === typeFilter);
    }

    if (englishOnly) {
      result = result.filter((event) => event.name_en && event.description_en);
    }

    return sortEventsByStartDate(result);
  }, [publicEvents, cityFilter, typeFilter, englishOnly, language]);

  const hasArtworks = (eventId: string) => artworksByEventId.has(eventId);

  return (
    <SiteShell>
      <Container size="xl" className="space-y-12 py-8 sm:py-12">
        {/* Hero */}
        <section className="space-y-4">
          <p className="section-kicker">{t.featuredNow}</p>
          <h1 className="display-heading text-balance">{t.hero}</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t.heroSub}</p>
        </section>

        {/* Featured events */}
        {featuredEvents.length > 0 ? (
          <section className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredEvents.slice(0, 3).map((event) => (
                <Link key={event.id} href={`/events/${event.id}`} className="group">
                  <Card className="overflow-hidden transition-shadow hover:shadow-md">
                    <div className="relative min-h-[14rem]">
                      <img
                        src={event.imageUrl}
                        alt={getEventTitle(event, language)}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--foreground)]/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="flex items-center gap-2">
                          <Badge tone="accent">{event.event_type || event.category}</Badge>
                          {hasArtworks(event.id) ? (
                            <Badge tone="success">
                              <Palette size={12} className="mr-1" />
                              {t.artworksAvailable}
                            </Badge>
                          ) : null}
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-white">{getEventTitle(event, language)}</h2>
                        <p className="mt-1 text-sm text-white/80">
                          {getEventCity(event, language)} · {formatDateRange(event.startDate, event.endDate)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Filters */}
        <section className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter size={14} />
            <span>{t.filterBy}</span>
          </div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          >
            <option value="all">{t.allCities}</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          >
            <option value="all">{t.allTypes}</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setEnglishOnly(!englishOnly)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              englishOnly
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.englishFriendly}
          </button>
        </section>

        {/* Event grid */}
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="section-kicker">{t.thisWeek}</p>
              <p className="text-sm text-muted-foreground">
                {filteredEvents.length} {language === 'en' ? 'events' : 'sự kiện'}
              </p>
            </div>
            <Link href="/events" className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground">
              {t.viewAll} <ArrowRight size={16} />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-[28rem] animate-pulse bg-secondary" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">{t.noEvents}</p>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <div key={event.id} className="relative">
                  {hasArtworks(event.id) ? (
                    <div className="absolute right-3 top-3 z-10">
                      <Badge tone="success" className="shadow-sm">
                        <Palette size={12} className="mr-1" />
                        {t.artworksAvailable}
                      </Badge>
                    </div>
                  ) : null}
                  <EventCard
                    event={event}
                    isSaved={savedEventIds.includes(event.id)}
                    onOpen={() => router.push(`/events/${event.id}`)}
                    onToggleSave={() => toggleSavedEvent(event.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter signup */}
        <section className="grid gap-6 md:grid-cols-2">
          <Card className="p-8">
            <NewsletterSignup source="homepage" />
          </Card>
          <Card className="p-8">
            <h3 className="text-lg font-semibold text-foreground">
              {language === 'en' ? 'Are you a gallery?' : 'Bạn là gallery?'}
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {language === 'en'
                ? 'List your exhibitions and artworks on Judooo for free. Reach a bilingual audience of art lovers across Vietnam.'
                : 'Đăng triển lãm và tác phẩm trên Judooo miễn phí. Tiếp cận cộng đồng yêu nghệ thuật song ngữ trên khắp Việt Nam.'}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/submit-event')}>
              {language === 'en' ? 'Submit your event' : 'Đăng sự kiện'}
            </Button>
          </Card>
        </section>
      </Container>
    </SiteShell>
  );
};
