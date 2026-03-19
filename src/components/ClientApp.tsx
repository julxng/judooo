'use client';

import {
  Suspense,
  lazy,
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { MainLayout } from '@/app/layouts/MainLayout';
import { useNotice } from '@/app/providers/NoticeProvider';
import { AsyncStatusBanner } from '@/components/shared/AsyncStatusBanner';
import { Card } from '@/components/ui/Card';
import { AuthDialog } from '@/features/auth/components/AuthDialog';
import { useAuthController } from '@/features/auth/hooks/useAuthController';
import { EventDetailModal } from '@/features/events/components/EventDetailModal';
import { EventsScreen } from '@/features/events/components/EventsScreen';
import { useEventFilters } from '@/features/events/hooks/useEventFilters';
import type { EventCategory, EventTimeline } from '@/features/events/types/event.types';
import { ArtworkActionModal } from '@/features/marketplace/components/ArtworkActionModal';
import { ArtworkDetailModal } from '@/features/marketplace/components/ArtworkDetailModal';
import { ArtworkShortlistView } from '@/features/marketplace/components/ArtworkShortlistView';
import { MarketplaceScreen } from '@/features/marketplace/components/MarketplaceScreen';
import { useArtworkFilters } from '@/features/marketplace/hooks/useArtworkFilters';
import type { Artwork, ArtworkPriceFilter, ArtworkSaleFilter } from '@/features/marketplace/types/artwork.types';
import { WatchlistView } from '@/features/watchlist/components/WatchlistView';
import { useCatalogData, useWatchlist } from '@/hooks';
import type { TabId } from '@/types';
import type { Locale as Language } from '@/lib/i18n/translations';

const pageContent: Record<TabId, { title: string; copy: string }> = {
  marketplace: {
    title: 'Contemporary Collection',
    copy: 'Browse artworks, auction lots, and verified object stories in a single commerce surface.',
  },
  events: {
    title: 'Art Discovery',
    copy: 'Track exhibitions, workshops, and live sales across the Vietnam art ecosystem.',
  },
  saved: {
    title: 'Saved Route',
    copy: 'Keep your shortlist of exhibitions and return when you are ready to visit.',
  },
  admin: {
    title: 'Operations Console',
    copy: 'Manage events, artworks, and structured imports without leaving the application shell.',
  },
  about: {
    title: 'About Judooo',
    copy: 'A clearer, more structured layer for discovering the Vietnamese art scene.',
  },
};

const LazyAboutPage = lazy(() => import('@/features/about/components/AboutPage'));
const LazyAdminDashboard = lazy(() => import('@/features/admin/components/AdminDashboard'));

const App = () => {
  const { notify } = useNotice();
  const auth = useAuthController();
  const catalog = useCatalogData(auth.currentUser);
  const watchlist = useWatchlist(auth.currentUser);

  const [activeTab, setActiveTab] = useState<TabId>('marketplace');
  const [language, setLanguage] = useState<Language>('vi');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [artworkSearchQuery, setArtworkSearchQuery] = useState('');
  const [eventCategory, setEventCategory] = useState<EventCategory>('all');
  const [eventTimeline, setEventTimeline] = useState<EventTimeline>('active');
  const [eventViewMode, setEventViewMode] = useState<'grid' | 'map' | 'route'>('grid');
  const [saleTypeFilter, setSaleTypeFilter] = useState<ArtworkSaleFilter>('all');
  const [priceFilter, setPriceFilter] = useState<ArtworkPriceFilter>('all');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [swipedArtworkIds, setSwipedArtworkIds] = useState<string[]>([]);
  const [shortlistedArtworkIds, setShortlistedArtworkIds] = useState<string[]>([]);
  const [isShortlistOpen, setIsShortlistOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [actionArtwork, setActionArtwork] = useState<Artwork | null>(null);
  const [actionMode, setActionMode] = useState<'bid' | 'auto-inquire' | null>(null);
  const [bidValue, setBidValue] = useState(0);
  const [collectorNote, setCollectorNote] = useState('');

  const filteredEvents = useEventFilters(
    catalog.events,
    useDeferredValue(eventSearchQuery),
    eventCategory,
    eventTimeline,
  );
  const filteredArtworks = useArtworkFilters(
    catalog.artworks,
    useDeferredValue(artworkSearchQuery),
    selectedInterests,
    saleTypeFilter,
    priceFilter,
  );

  const selectedEvent = useMemo(
    () => catalog.events.find((event) => event.id === selectedEventId) || null,
    [catalog.events, selectedEventId],
  );
  const selectedEventArtworks = useMemo(
    () => catalog.artworks.filter((artwork) => artwork.eventId === selectedEventId),
    [catalog.artworks, selectedEventId],
  );
  const savedEvents = useMemo(
    () => catalog.events.filter((event) => watchlist.savedEventIds.includes(event.id)),
    [catalog.events, watchlist.savedEventIds],
  );
  const shortlistedArtworks = useMemo(
    () => catalog.artworks.filter((artwork) => shortlistedArtworkIds.includes(artwork.id)),
    [catalog.artworks, shortlistedArtworkIds],
  );
  const discoverableArtworks = useMemo(
    () => filteredArtworks.filter((artwork) => !swipedArtworkIds.includes(artwork.id)),
    [filteredArtworks, swipedArtworkIds],
  );
  const suggestedInterests = useMemo(() => {
    const interestCandidates = catalog.artworks.flatMap((artwork) => [
      artwork.style,
      artwork.medium,
      artwork.city,
      artwork.country,
    ]);
    const uniqueInterests = Array.from(
      new Set(
        interestCandidates
          .filter((interest): interest is string => Boolean(interest?.trim()))
          .map((interest) => interest.trim()),
      ),
    );

    return uniqueInterests.length > 0
      ? uniqueInterests.slice(0, 8)
      : ['Abstract', 'Lacquer', 'Figurative', 'Hanoi', 'Ho Chi Minh City', 'Photography'];
  }, [catalog.artworks]);
  const heroMetrics = useMemo<Record<TabId, Array<{ label: string; value: string }>>>(() => {
    const today = Date.now();
    const activeEventCount = catalog.events.filter((event) => {
      if (!event.endDate) return true;
      return new Date(event.endDate).getTime() >= today;
    }).length;
    const cityCount = new Set(catalog.events.map((event) => event.city || event.location).filter(Boolean)).size;
    const artistCount = new Set(catalog.artworks.map((artwork) => artwork.artist).filter(Boolean)).size;
    const auctionCount = catalog.artworks.filter((artwork) => artwork.saleType === 'auction').length;
    const availableCount = catalog.artworks.filter((artwork) => artwork.available).length;
    const savedActiveCount = savedEvents.filter((event) => {
      if (!event.endDate) return true;
      return new Date(event.endDate).getTime() >= today;
    }).length;

    return {
      marketplace: [
        { label: 'Works tracked', value: String(catalog.artworks.length) },
        { label: 'Available now', value: String(availableCount) },
        { label: 'Artists', value: String(artistCount) },
      ],
      events: [
        { label: 'Active now', value: String(activeEventCount) },
        { label: 'Cities', value: String(cityCount) },
        { label: 'Saved stops', value: String(watchlist.savedEventIds.length) },
      ],
      saved: [
        { label: 'Saved events', value: String(savedEvents.length) },
        { label: 'Still active', value: String(savedActiveCount) },
        { label: 'Route status', value: savedEvents.length > 0 ? 'Ready' : 'Empty' },
      ],
      admin: [
        { label: 'Events', value: String(catalog.events.length) },
        { label: 'Artworks', value: String(catalog.artworks.length) },
        { label: 'Pending sync', value: String(catalog.pendingWritesCount) },
      ],
      about: [
        { label: 'Events tracked', value: String(catalog.events.length) },
        { label: 'Works tracked', value: String(catalog.artworks.length) },
        { label: 'Languages', value: '2' },
      ],
    };
  }, [catalog.artworks, catalog.events, catalog.pendingWritesCount, savedEvents, watchlist.savedEventIds.length]);

  const handleTabChange = (tab: TabId) => {
    if ((tab === 'saved' || tab === 'admin') && !auth.currentUser) {
      auth.openAuthDialog();
      return;
    }

    if (tab === 'admin' && !auth.canAccessAdmin) {
      notify('Only gallery, artist, or admin accounts can access the admin console.', 'warning');
      return;
    }

    startTransition(() => {
      setSelectedEventId(null);
      setSelectedArtwork(null);
      setActiveTab(tab);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await auth.logout();
    setActiveTab('marketplace');
    setIsShortlistOpen(false);
    setSelectedEventId(null);
    setSelectedArtwork(null);
    setActionArtwork(null);
  };

  const handleToggleSavedEvent = async (eventId: string) => {
    const result = await watchlist.toggleSavedEvent(eventId);
    if (result === 'missing-user') {
      auth.openAuthDialog();
    }
  };

  const openArtworkAction = (artwork: Artwork, mode: 'bid' | 'auto-inquire') => {
    if (!auth.currentUser) {
      auth.openAuthDialog();
      return;
    }

    setActionArtwork(artwork);
    setActionMode(mode);
    setCollectorNote('');
    setBidValue((artwork.currentBid || artwork.price) + 500000);
  };

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((value) => value !== interest)
        : [...current, interest],
    );
  };

  const handlePassArtwork = (artwork: Artwork) => {
    setSwipedArtworkIds((current) =>
      current.includes(artwork.id) ? current : [...current, artwork.id],
    );
  };

  const handleShortlistArtwork = (artwork: Artwork) => {
    setShortlistedArtworkIds((current) =>
      current.includes(artwork.id) ? current : [...current, artwork.id],
    );
    setSwipedArtworkIds((current) =>
      current.includes(artwork.id) ? current : [...current, artwork.id],
    );
  };

  const handleRemoveShortlistedArtwork = (artworkId: string) => {
    setShortlistedArtworkIds((current) => current.filter((id) => id !== artworkId));
  };

  const handleResetSwipes = () => {
    setSwipedArtworkIds([]);
  };

  const handleClearDiscovery = () => {
    setArtworkSearchQuery('');
    setSelectedInterests([]);
    setSaleTypeFilter('all');
    setPriceFilter('all');
    setSwipedArtworkIds([]);
  };

  const submitArtworkAction = async () => {
    if (!actionArtwork || !actionMode) return;

    if (actionMode === 'auto-inquire') {
      notify(`Inquiry noted for "${actionArtwork.title}".`, 'success');
      setActionArtwork(null);
      setActionMode(null);
      setCollectorNote('');
      return;
    }

    const minimumBid = actionArtwork.currentBid || actionArtwork.price;
    if (bidValue <= minimumBid) {
      notify('Bid must be higher than the current price.', 'warning');
      return;
    }

    const success = await catalog.placeBid(actionArtwork.id, bidValue);
    if (success) {
      notify('Bid submitted successfully.', 'success');
      setActionArtwork(null);
      setActionMode(null);
      setCollectorNote('');
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      currentUser={auth.currentUser}
      language={language}
      canAccessAdmin={auth.canAccessAdmin}
      onTabChange={handleTabChange}
      onLanguageChange={setLanguage}
      onOpenAuth={auth.openAuthDialog}
      onLogout={handleLogout}
    >
      <section className="hero-panel page-hero">
        <div>
          <p className="eyebrow">{activeTab.toUpperCase()}</p>
          <h1 className="display-title">{pageContent[activeTab].title}</h1>
          <p className="muted-text">{pageContent[activeTab].copy}</p>
        </div>
        <div className="page-hero__metrics">
          {heroMetrics[activeTab].map((metric) => (
            <div key={metric.label} className="page-hero__metric">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      </section>

      {catalog.isLoading ? (
        <Card className="loading-state">
          <div className="loading-state__spinner" />
          <p className="eyebrow">Syncing network data...</p>
        </Card>
      ) : activeTab === 'events' ? (
        <EventsScreen
          events={filteredEvents}
          savedEvents={savedEvents}
          savedEventIds={watchlist.savedEventIds}
          searchQuery={eventSearchQuery}
          category={eventCategory}
          timeline={eventTimeline}
          viewMode={eventViewMode}
          onSearchChange={setEventSearchQuery}
          onCategoryChange={setEventCategory}
          onTimelineChange={setEventTimeline}
          onViewModeChange={setEventViewMode}
          onOpenEvent={setSelectedEventId}
          onToggleSave={handleToggleSavedEvent}
        />
      ) : activeTab === 'marketplace' && isShortlistOpen ? (
        <ArtworkShortlistView
          artworks={shortlistedArtworks}
          interestSummary={selectedInterests}
          onOpenArtwork={setSelectedArtwork}
          onActionArtwork={(artwork) =>
            openArtworkAction(artwork, artwork.saleType === 'auction' ? 'bid' : 'auto-inquire')
          }
          onRemoveArtwork={handleRemoveShortlistedArtwork}
          onReturnToDiscover={() => setIsShortlistOpen(false)}
        />
      ) : activeTab === 'marketplace' ? (
        <MarketplaceScreen
          artworks={discoverableArtworks}
          searchQuery={artworkSearchQuery}
          selectedInterests={selectedInterests}
          suggestedInterests={suggestedInterests}
          shortlistedArtworks={shortlistedArtworks}
          saleTypeFilter={saleTypeFilter}
          priceFilter={priceFilter}
          dbReadError={catalog.dbReadError}
          pendingWritesCount={catalog.pendingWritesCount}
          swipedCount={swipedArtworkIds.length}
          onSearchChange={setArtworkSearchQuery}
          onToggleInterest={handleToggleInterest}
          onSaleTypeChange={setSaleTypeFilter}
          onPriceFilterChange={setPriceFilter}
          onClearDiscovery={handleClearDiscovery}
          onResetSwipes={handleResetSwipes}
          onOpenShortlist={() => setIsShortlistOpen(true)}
          onOpenArtwork={setSelectedArtwork}
          onShortlistArtwork={handleShortlistArtwork}
          onPassArtwork={handlePassArtwork}
        />
      ) : activeTab === 'saved' ? (
        <WatchlistView
          events={savedEvents}
          savedEventIds={watchlist.savedEventIds}
          onOpenEvent={setSelectedEventId}
          onToggleSave={handleToggleSavedEvent}
        />
      ) : activeTab === 'admin' ? (
        <Suspense fallback={<AsyncStatusBanner message="Loading admin surface..." />}>
          <LazyAdminDashboard
            events={catalog.events}
            artworks={catalog.artworks}
            onAddEvent={catalog.createEvent}
            onAddArtwork={catalog.createArtwork}
            onUploadEvents={catalog.uploadEvents}
            onUploadArtworks={catalog.uploadArtworks}
            onUpdateEvent={catalog.updateEvent}
            onUploadImage={catalog.uploadImage}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<AsyncStatusBanner message="Loading about surface..." />}>
          <LazyAboutPage language={language} />
        </Suspense>
      )}

      {auth.isAuthDialogOpen ? (
        <AuthDialog
          onClose={auth.closeAuthDialog}
          onLoginGoogle={auth.loginWithGoogle}
          onLoginTestAdmin={auth.loginTestAdmin}
          onLoginEmailPassword={auth.loginWithPassword}
          onSignUpEmailPassword={auth.signUpWithPassword}
          onResetPassword={auth.resetPassword}
        />
      ) : null}

      {selectedEvent ? (
        <EventDetailModal
          event={selectedEvent}
          linkedArtworks={selectedEventArtworks}
          isSaved={watchlist.savedEventIds.includes(selectedEvent.id)}
          onClose={() => setSelectedEventId(null)}
          onToggleSave={() => handleToggleSavedEvent(selectedEvent.id)}
          onOpenArtwork={(artwork) => {
            setSelectedEventId(null);
            setSelectedArtwork(artwork);
          }}
          onBidArtwork={(artwork) => openArtworkAction(artwork, 'bid')}
        />
      ) : null}

      {selectedArtwork ? (
        <ArtworkDetailModal
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
          onAction={(artwork) =>
            openArtworkAction(artwork, artwork.saleType === 'auction' ? 'bid' : 'auto-inquire')
          }
        />
      ) : null}

      {actionArtwork && actionMode ? (
        <ArtworkActionModal
          artwork={actionArtwork}
          mode={actionMode}
          bidValue={bidValue}
          collectorNote={collectorNote}
          onBidValueChange={setBidValue}
          onCollectorNoteChange={setCollectorNote}
          onClose={() => {
            setActionArtwork(null);
            setActionMode(null);
            setCollectorNote('');
          }}
          onSubmit={submitArtworkAction}
        />
      ) : null}
    </MainLayout>
  );
};

export default App;
