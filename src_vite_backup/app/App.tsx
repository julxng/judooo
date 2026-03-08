import {
  Suspense,
  lazy,
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Card } from '@ui/Card';
import { AsyncStatusBanner } from '@components/shared/AsyncStatusBanner';
import { AuthDialog } from '@features/auth/components/AuthDialog';
import { useAuthController } from '@features/auth/hooks/useAuthController';
import type { EventCategory, EventTimeline } from '@features/events/types/event.types';
import { EventDetailModal } from '@features/events/components/EventDetailModal';
import { EventsScreen } from '@features/events/components/EventsScreen';
import type { Artwork, ArtworkPriceFilter, ArtworkSaleFilter } from '@features/marketplace/types/artwork.types';
import { ArtworkActionModal } from '@features/marketplace/components/ArtworkActionModal';
import { ArtworkDetailModal } from '@features/marketplace/components/ArtworkDetailModal';
import { MarketplaceScreen } from '@features/marketplace/components/MarketplaceScreen';
import { WatchlistView } from '@features/watchlist/components/WatchlistView';
import { useNotice } from './providers/NoticeProvider';
import { useCatalogData, useWatchlist } from '@hooks/index';
import { useEventFilters } from '@features/events/hooks/useEventFilters';
import { useArtworkFilters } from '@features/marketplace/hooks/useArtworkFilters';
import type { Language, TabId } from '@types';

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

const LazyAboutPage = lazy(() => import('@features/about/components/AboutPage'));
const LazyAdminDashboard = lazy(() => import('@features/admin/components/AdminDashboard'));

const App = () => {
  const { notify } = useNotice();
  const auth = useAuthController();
  const catalog = useCatalogData(auth.currentUser);
  const watchlist = useWatchlist(auth.currentUser);

  const [activeTab, setActiveTab] = useState<TabId>('marketplace');
  const [language, setLanguage] = useState<Language>('vn');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [artworkSearchQuery, setArtworkSearchQuery] = useState('');
  const [eventCategory, setEventCategory] = useState<EventCategory>('all');
  const [eventTimeline, setEventTimeline] = useState<EventTimeline>('active');
  const [eventViewMode, setEventViewMode] = useState<'grid' | 'map'>('grid');
  const [saleTypeFilter, setSaleTypeFilter] = useState<ArtworkSaleFilter>('all');
  const [priceFilter, setPriceFilter] = useState<ArtworkPriceFilter>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [actionArtwork, setActionArtwork] = useState<Artwork | null>(null);
  const [actionMode, setActionMode] = useState<'bid' | 'inquire' | null>(null);
  const [bidValue, setBidValue] = useState(0);

  const filteredEvents = useEventFilters(
    catalog.events,
    useDeferredValue(eventSearchQuery),
    eventCategory,
    eventTimeline,
  );
  const filteredArtworks = useArtworkFilters(
    catalog.artworks,
    useDeferredValue(artworkSearchQuery),
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

  const openArtworkAction = (artwork: Artwork, mode: 'bid' | 'inquire') => {
    if (!auth.currentUser) {
      auth.openAuthDialog();
      return;
    }

    setActionArtwork(artwork);
    setActionMode(mode);
    setBidValue((artwork.currentBid || artwork.price) + 500000);
  };

  const submitArtworkAction = async () => {
    if (!actionArtwork || !actionMode) return;

    if (actionMode === 'inquire') {
      notify(`Inquiry noted for "${actionArtwork.title}".`, 'success');
      setActionArtwork(null);
      setActionMode(null);
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
        <p className="eyebrow">{activeTab.toUpperCase()}</p>
        <h1 className="display-title">{pageContent[activeTab].title}</h1>
        <p className="muted-text">{pageContent[activeTab].copy}</p>
      </section>

      {catalog.isLoading ? (
        <Card className="loading-state">
          <div className="loading-state__spinner" />
          <p className="eyebrow">Syncing network data...</p>
        </Card>
      ) : activeTab === 'events' ? (
        <EventsScreen
          events={filteredEvents}
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
      ) : activeTab === 'marketplace' ? (
        <MarketplaceScreen
          artworks={filteredArtworks}
          searchQuery={artworkSearchQuery}
          saleTypeFilter={saleTypeFilter}
          priceFilter={priceFilter}
          dbReadError={catalog.dbReadError}
          pendingWritesCount={catalog.pendingWritesCount}
          onSearchChange={setArtworkSearchQuery}
          onSaleTypeChange={setSaleTypeFilter}
          onPriceFilterChange={setPriceFilter}
          onOpenArtwork={setSelectedArtwork}
          onActionArtwork={(artwork) => openArtworkAction(artwork, artwork.saleType === 'auction' ? 'bid' : 'inquire')}
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
          onAction={(artwork) => openArtworkAction(artwork, artwork.saleType === 'auction' ? 'bid' : 'inquire')}
        />
      ) : null}

      {actionArtwork && actionMode ? (
        <ArtworkActionModal
          artwork={actionArtwork}
          mode={actionMode}
          bidValue={bidValue}
          onBidValueChange={setBidValue}
          onClose={() => {
            setActionArtwork(null);
            setActionMode(null);
          }}
          onSubmit={submitArtworkAction}
        />
      ) : null}
    </MainLayout>
  );
};

export default App;
