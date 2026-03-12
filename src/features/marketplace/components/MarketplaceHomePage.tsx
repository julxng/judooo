'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, ShieldCheck } from 'lucide-react';
import { useAuth, useLanguage } from '@/app/providers';
import { useNotice } from '@/app/providers/NoticeProvider';
import { SiteShell } from '@/components/layout/SiteShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { formatCurrency } from '@/lib/format';
import type { Locale } from '@/lib/i18n/translations';
import { api } from '@/services/api';
import { hydrateLocalCatalogSnapshot } from '@/services/api/localDb';
import { EventCard } from '@/features/events/components/EventCard';
import {
  isApprovedEvent,
  isCurrentEvent,
  sortEventsBySavedCount,
} from '@/features/events/utils/event-utils';
import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '../types/artwork.types';
import { ArtworkCard } from './ArtworkCard';
import { ArtworkDrawer } from './ArtworkDrawer';
import {
  getArtworkDescription,
  getArtworkLocation,
  getArtworkStory,
  getArtworkStyle,
  getArtworkTitle,
} from '../utils/artwork-utils';

const isApprovedArtwork = (artwork: Artwork) =>
  !artwork.moderation_status || artwork.moderation_status === 'approved';

interface MarketplaceHomePageProps {
  initialEvents?: ArtEvent[];
  initialArtworks?: Artwork[];
  artworkLimit?: number;
}

const marketplaceHomeCopy: Record<
  Locale,
  {
    featuredWork: string;
    heroTitle: string;
    heroBody: string;
    auction: string;
    fixedPrice: string;
    currentBid: string;
    price: string;
    viewArtwork: string;
    browseEvents: string;
    marketplace: string;
    loadingArtworks: string;
    account: string;
    activeAccount: string;
    openBrowsing: string;
    accountBody: string;
    signUpToSave: string;
    howItWorks: string;
    howItWorksSteps: [string, string, string];
    selectedWorks: string;
    selectedWorksTitle: string;
    submitArtwork: string;
    eventLayer: string;
    eventLayerTitle: string;
    eventLayerBody: string;
    openEvents: string;
    openRoutePlanner: string;
    vietnam: string;
  }
> = {
  en: {
    featuredWork: 'Featured Work',
    heroTitle: 'Discover and collect Vietnamese contemporary art with a cleaner browse.',
    heroBody:
      'Judooo surfaces artworks, events, and planning tools in one place so discovery feels less fragmented.',
    auction: 'Auction',
    fixedPrice: 'Fixed Price',
    currentBid: 'Current bid',
    price: 'Price',
    viewArtwork: 'View artwork',
    browseEvents: 'Browse events',
    marketplace: 'Marketplace',
    loadingArtworks: 'Loading artworks...',
    account: 'Account',
    activeAccount: 'Your account is active.',
    openBrowsing: 'Browsing stays open by default.',
    accountBody: 'Sign in only when you want to save routes, track works, or submit as a creator.',
    signUpToSave: 'Sign up to save',
    howItWorks: 'How It Works',
    howItWorksSteps: [
      'Browse featured works immediately.',
      'Move into events when you want cultural context.',
      'Return to saved routes and creator tools after sign-in.',
    ],
    selectedWorks: 'Selected Works',
    selectedWorksTitle: 'Browse the full collection of current listings.',
    submitArtwork: 'Submit artwork',
    eventLayer: 'Event Layer',
    eventLayerTitle: 'Use the calendar as context, then build an actual route.',
    eventLayerBody:
      'Events remain the habit-forming layer: browse exhibitions, save stops, and turn a shortlist into a workable day across the city.',
    openEvents: 'Open events',
    openRoutePlanner: 'Open route planner',
    vietnam: 'Vietnam',
  },
  vi: {
    featuredWork: 'Tác phẩm nổi bật',
    heroTitle: 'Khám phá và sưu tầm nghệ thuật đương đại Việt Nam dễ dàng hơn.',
    heroBody:
      'Judooo đưa tác phẩm, sự kiện và công cụ lên lộ trình vào cùng một nơi để việc khám phá bớt rời rạc hơn.',
    auction: 'Đấu giá',
    fixedPrice: 'Giá cố định',
    currentBid: 'Giá hiện tại',
    price: 'Giá',
    viewArtwork: 'Xem tác phẩm',
    browseEvents: 'Xem sự kiện',
    marketplace: 'Tác phẩm',
    loadingArtworks: 'Đang tải tác phẩm...',
    account: 'Tài khoản',
    activeAccount: 'Tài khoản của bạn đang hoạt động.',
    openBrowsing: 'Bạn có thể xem trước mà không cần đăng nhập.',
    accountBody: 'Chỉ cần đăng nhập khi bạn muốn lưu lộ trình, theo dõi tác phẩm hoặc gửi bài đăng.',
    signUpToSave: 'Đăng ký để lưu',
    howItWorks: 'Cách sử dụng',
    howItWorksSteps: [
      'Xem ngay các tác phẩm nổi bật.',
      'Chuyển sang sự kiện khi bạn cần thêm bối cảnh văn hóa.',
      'Quay lại lộ trình đã lưu và công cụ creator sau khi đăng nhập.',
    ],
    selectedWorks: 'Tác phẩm đã chọn',
    selectedWorksTitle: 'Xem toàn bộ bộ sưu tập tác phẩm hiện có.',
    submitArtwork: 'Đăng tác phẩm',
    eventLayer: 'Lớp sự kiện',
    eventLayerTitle: 'Dùng lịch sự kiện làm bối cảnh rồi lập thành lộ trình thực tế.',
    eventLayerBody:
      'Sự kiện vẫn là lớp tạo thói quen: xem triển lãm, lưu điểm dừng và biến danh sách ngắn thành một ngày đi xem hợp lý.',
    openEvents: 'Mở sự kiện',
    openRoutePlanner: 'Mở lộ trình',
    vietnam: 'Việt Nam',
  },
};

export const MarketplaceHomePage = ({
  initialEvents = [],
  initialArtworks = [],
  artworkLimit,
}: MarketplaceHomePageProps) => {
  const router = useRouter();
  const { currentUser, openAuthDialog } = useAuth();
  const { language } = useLanguage();
  const { notify } = useNotice();
  const copy = marketplaceHomeCopy[language];
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    if (initialArtworks.length === 0) return;
    hydrateLocalCatalogSnapshot({ artworks: initialArtworks });
  }, [initialArtworks]);

  useEffect(() => {
    if (initialArtworks.length > 0) return;

    const loadArtworks = async () => {
      const nextArtworks = await api.getArtworks();
      setArtworks(nextArtworks);
    };

    void loadArtworks();
  }, [initialArtworks.length]);

  const publicArtworks = useMemo(() => artworks.filter(isApprovedArtwork), [artworks]);
  const displayedArtworks = useMemo(
    () => (typeof artworkLimit === 'number' ? publicArtworks.slice(0, artworkLimit) : publicArtworks),
    [artworkLimit, publicArtworks],
  );
  const featuredArtwork = publicArtworks[0] || null;
  const currentEvents = useMemo(
    () => initialEvents.filter((event) => isApprovedEvent(event) && isCurrentEvent(event)),
    [initialEvents],
  );
  const featuredEvents = useMemo(
    () => sortEventsBySavedCount(currentEvents).slice(0, 2),
    [currentEvents],
  );

  return (
    <SiteShell>
      <Container size="xl" className="space-y-16 py-8 md:py-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="overflow-hidden">
            {featuredArtwork ? (
              <div className="grid lg:grid-cols-[minmax(0,0.94fr)_minmax(20rem,0.78fr)]">
                <button
                  type="button"
                  className="group relative min-h-[24rem] overflow-hidden bg-secondary text-left"
                  onClick={() => setActiveArtwork(featuredArtwork)}
                >
                  <img
                    src={featuredArtwork.imageUrl}
                    alt={getArtworkTitle(featuredArtwork, language)}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </button>

                <div className="flex flex-col justify-between gap-8 border-t border-border p-6 sm:p-8 lg:border-l lg:border-t-0">
                  <div className="space-y-5">
                    <p className="section-kicker">{copy.featuredWork}</p>
                    <div className="space-y-3">
                      <h1 className="display-heading max-w-3xl text-balance text-foreground">
                        {copy.heroTitle}
                      </h1>
                      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                        {copy.heroBody}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="accent">
                        {featuredArtwork.saleType === 'auction' ? copy.auction : copy.fixedPrice}
                      </Badge>
                      {featuredArtwork.style ? <Badge>{getArtworkStyle(featuredArtwork, language)}</Badge> : null}
                      <Badge>{getArtworkLocation(featuredArtwork, language) || copy.vietnam}</Badge>
                    </div>
                  </div>

                  <div className="space-y-5 border-t border-border pt-5">
                    <div>
                      <p className="text-sm text-muted-foreground">{featuredArtwork.artist}</p>
                      <h2 className="mt-2 font-display text-[2rem] leading-[0.94] tracking-[-0.045em] text-foreground sm:text-[2.4rem]">
                        {getArtworkTitle(featuredArtwork, language)}
                      </h2>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                        {getArtworkStory(featuredArtwork, language) || getArtworkDescription(featuredArtwork, language)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
                      <div>
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {featuredArtwork.saleType === 'auction' ? copy.currentBid : copy.price}
                        </span>
                        <p className="mt-2 font-display text-[1.8rem] tracking-[-0.04em] text-foreground">
                          {formatCurrency(
                            featuredArtwork.saleType === 'auction'
                              ? featuredArtwork.currentBid || featuredArtwork.price
                              : featuredArtwork.price,
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button size="sm" onClick={() => setActiveArtwork(featuredArtwork)}>
                          {copy.viewArtwork}
                        </Button>
                        <Link
                          href="/events"
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3.5 text-sm text-foreground transition-colors hover:border-foreground"
                        >
                          {copy.browseEvents}
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8">
                <p className="section-kicker">{copy.marketplace}</p>
                <h1 className="display-heading mt-4">{copy.loadingArtworks}</h1>
              </div>
            )}
          </Card>

          <div className="grid gap-6">
            <Card className="p-6">
              <p className="section-kicker">{copy.account}</p>
              <div className="mt-4 flex items-start gap-3">
                <ShieldCheck className="mt-0.5 text-foreground" size={17} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {currentUser ? copy.activeAccount : copy.openBrowsing}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {copy.accountBody}
                  </p>
                </div>
              </div>
              {!currentUser ? (
                <Button size="sm" className="mt-5" onClick={openAuthDialog}>
                  {copy.signUpToSave}
                </Button>
              ) : null}
            </Card>

            <Card className="p-6">
              <p className="section-kicker">{copy.howItWorks}</p>
              <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
                {copy.howItWorksSteps.map((step) => (
                  <p key={step}>{step}</p>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="space-y-6 border-t border-border pt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="section-kicker">{copy.selectedWorks}</p>
              <h2 className="section-heading">{copy.selectedWorksTitle}</h2>
            </div>
            <Link
              href="/submit-artwork"
              className="inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-muted-foreground"
            >
              {copy.submitArtwork}
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {displayedArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onOpen={setActiveArtwork}
                onAction={setActiveArtwork}
              />
            ))}
          </div>
        </section>

        <section className="space-y-6 border-t border-border pt-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-foreground" />
                <p className="section-kicker">{copy.eventLayer}</p>
              </div>
              <h2 className="section-heading">{copy.eventLayerTitle}</h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                {copy.eventLayerBody}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/events"
                  className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-4 text-sm text-background transition-colors hover:bg-brand"
                >
                  {copy.openEvents}
                </Link>
                <Link
                  href="/route-planner"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-border px-4 text-sm text-foreground transition-colors hover:border-foreground"
                >
                  {copy.openRoutePlanner}
                </Link>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {featuredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onOpen={() => {
                    router.push(`/events/${event.id}`);
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      </Container>

      {activeArtwork ? (
        <ArtworkDrawer
          artwork={activeArtwork}
          artworks={displayedArtworks}
          onClose={() => setActiveArtwork(null)}
          onNavigate={setActiveArtwork}
          onAction={() => {
            if (!currentUser) {
              openAuthDialog();
              return;
            }
            notify(
              language === 'vi'
                ? `Đã ghi nhận quan tâm cho ${getArtworkTitle(activeArtwork, language)}.`
                : `Interest captured for ${getArtworkTitle(activeArtwork, language)}.`,
              'success',
            );
          }}
        />
      ) : null}
    </SiteShell>
  );
};
