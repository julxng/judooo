
import React, { useState, useMemo, useEffect } from 'react';
import { TabType, ArtEvent, Artwork, User, Language } from './types';
import { INITIAL_EVENTS, INITIAL_ARTWORKS } from './constants';
import Layout from './components/Layout';
import EventCard from './components/EventCard';
import ArtworkCard from './components/ArtworkCard';
import MapView from './components/MapView';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import EventDetail from './components/EventDetail';
import AboutView from './components/AboutView';
import ArtworkDetail from './components/ArtworkDetail';
import { api } from './services/apiService';
import { t } from './translations';
import { supabase } from './services/supabaseClient';

const DEV_USER_STORAGE_KEY = 'judooo_dev_user';

const App: React.FC = () => {
  const SAMPLE_ADMIN_ID = 'admin-sample';
  const [activeTab, setActiveTab] = useState<TabType>('marketplace');
  const [language, setLanguage] = useState<Language>('vn');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Dữ liệu ban đầu (Sẽ được thay thế bằng dữ liệu từ API)
  const [events, setEvents] = useState<ArtEvent[]>(INITIAL_EVENTS.map(e => ({ ...e, createdBy: e.createdBy || SAMPLE_ADMIN_ID })));
  const [artworks, setArtworks] = useState<Artwork[]>(INITIAL_ARTWORKS);
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [eventViewMode, setEventViewMode] = useState<'grid' | 'map'>('grid');
  const [eventTimeline, setEventTimeline] = useState<'active' | 'past'>('active');
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [actionArtwork, setActionArtwork] = useState<Artwork | null>(null);
  const [actionType, setActionType] = useState<'bid' | 'inquire' | null>(null);
  const [bidValue, setBidValue] = useState<number>(0);

  const [eventCategory, setEventCategory] = useState<'all' | 'exhibition' | 'auction' | 'workshop'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'high' | 'low'>('all');
  const [saleTypeFilter, setSaleTypeFilter] = useState<'all' | 'fixed' | 'auction'>('all');

  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // FETCH DỮ LIỆU THẬT KHI KHỞI CHẠY
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
        ]);
      };

      try {
        const [fetchedEvents, fetchedArtworks] = await Promise.all([
          withTimeout(api.getEvents(), 8000, [] as ArtEvent[]),
          withTimeout(api.getArtworks(), 8000, [] as Artwork[]),
        ]);
        
        // Chỉ cập nhật nếu backend có dữ liệu thực, nếu không dùng dữ liệu mẫu (INITIAL_...)
        if (fetchedEvents.length > 0) setEvents(fetchedEvents);
        if (fetchedArtworks.length > 0) setArtworks(fetchedArtworks);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ server:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const isAdminRole = (role?: User['role']) => role && role !== 'art_lover';

  const handleLoginTestAdmin = () => {
    const testAdminUser: User = {
      id: 'test-admin',
      name: 'Test Admin',
      email: 'test-admin@local.dev',
      role: 'gallery',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=TA',
    };
    setCurrentUser(testAdminUser);
    setShowAuthModal(false);
    localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(testAdminUser));
  };

  const handleTabChange = (tab: TabType) => {
    if ((tab === 'saved' || tab === 'admin') && !currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (tab === 'admin' && currentUser && !isAdminRole(currentUser.role)) {
      alert("Truy cập bị từ chối: Bạn cần tài khoản Gallery/Artist/Dealer để vào mục này.");
      return;
    }
    setSelectedEventId(null);
    setSelectedArtwork(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mapSessionUser = async (sessionUser: any): Promise<User> => {
    const profile = sessionUser?.id ? await api.getProfile(sessionUser.id) : null;
    return {
      id: sessionUser.id,
      name: profile?.name || sessionUser.user_metadata?.full_name || sessionUser.email || 'User',
      email: sessionUser.email,
      role: profile?.role || 'art_lover',
      avatar: profile?.avatar || sessionUser.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=JD'
    };
  };

  useEffect(() => {
    const storedDevUser = localStorage.getItem(DEV_USER_STORAGE_KEY);
    if (storedDevUser) {
      try {
        const parsed = JSON.parse(storedDevUser) as User;
        if (parsed?.id && parsed?.role) {
          setCurrentUser(parsed);
        }
      } catch (error) {
        console.error('Failed to parse local test user', error);
      }
    }

    if (!supabase) return;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const user = await mapSessionUser(data.session.user);
        setCurrentUser(user);
        api.syncUser(user);
      }
    };
    init();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await mapSessionUser(session.user);
        setCurrentUser(user);
        api.syncUser(user);
        localStorage.removeItem(DEV_USER_STORAGE_KEY);
        setShowAuthModal(false);
      } else {
        setCurrentUser(null);
      }
    });
    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setSavedEventIds([]);
      return;
    }
    const loadWatchlist = async () => {
      const ids = await api.getWatchlist(currentUser.id);
      if (ids.length > 0) {
        setSavedEventIds(ids);
      }
    };
    loadWatchlist();
  }, [currentUser]);

  const handleLogin = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  const handleEmailPasswordLogin = async (email: string, password: string) => {
    if (!supabase) {
      alert('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(`Sign in failed: ${error.message}`);
      return;
    }
    setShowAuthModal(false);
  };

  const handleEmailPasswordSignUp = async (name: string, email: string, password: string) => {
    if (!supabase) {
      alert('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      }
    });

    if (error) {
      alert(`Sign up failed: ${error.message}`);
      return;
    }

    alert('Account created. Check your email to confirm your account, then sign in.');
    setShowAuthModal(false);
  };

  const handleResetPassword = async (email: string) => {
    if (!supabase) {
      alert('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      alert(`Password reset failed: ${error.message}`);
      return;
    }

    alert('If this email exists, a password reset link has been sent.');
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(DEV_USER_STORAGE_KEY);
    setCurrentUser(null);
    setActiveTab('marketplace');
    setSavedEventIds([]);
    setSelectedEventId(null);
    setSelectedArtwork(null);
  };

  const toggleSaveEvent = async (id: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const isSaved = savedEventIds.includes(id);
    const previous = savedEventIds;
    const optimistic = isSaved ? previous.filter(i => i !== id) : [...previous, id];
    setSavedEventIds(optimistic);

    const persistedState = await api.toggleWatchlist(currentUser.id, id);
    if (persistedState === null) {
      setSavedEventIds(previous);
      return;
    }
    setSavedEventIds(prev => {
      const exists = prev.includes(id);
      if (persistedState && !exists) return [...prev, id];
      if (!persistedState && exists) return prev.filter(v => v !== id);
      return prev;
    });
  };

  const handleBidClick = (artwork: Artwork) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const currentPrice = artwork.currentBid || artwork.price;
    setActionArtwork(artwork);
    setActionType('bid');
    setBidValue(currentPrice + 500000); 
  };

  const handleAddEvent = async (event: ArtEvent) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (currentUser.id === 'test-admin') {
      alert('Test Admin is local-only and cannot write to Supabase. Please sign in with Email/Google.');
      return;
    }
    const payload = { ...event, createdBy: currentUser.id };
    const created = await api.createEvent(payload);
    if (!created) {
      alert('Failed to save event to Supabase. Check that your account role is gallery/artist/art_dealer and that RLS allows inserts.');
      return;
    }
    setEvents(prev => [created, ...prev]);
  };

  const handleAddArtwork = async (artwork: Artwork) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (currentUser.id === 'test-admin') {
      alert('Test Admin is local-only and cannot write to Supabase. Please sign in with Email/Google.');
      return;
    }
    const payload: Artwork = { ...artwork, createdBy: currentUser?.id };
    const created = await api.createArtwork(payload);
    if (!created) {
      alert('Failed to save artwork to Supabase. Check account role and RLS policy.');
      return;
    }
    setArtworks(prev => [created, ...prev]);
  };

  const handleUpdateEvent = async (id: string, data: Partial<ArtEvent>) => {
    if (!currentUser || !isAdminRole(currentUser.role)) {
      alert("Chỉ admin mới chỉnh sửa sự kiện.");
      return;
    }
    const updated = await api.updateEvent(id, data);
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, ...(updated || data) } : ev));
  };

  const assertSupabaseWritableUser = (): boolean => {
    if (!currentUser) {
      setShowAuthModal(true);
      return false;
    }
    if (currentUser.id === 'test-admin') {
      alert('Test Admin is local-only and cannot write to Supabase. Please sign in with Email/Google.');
      return false;
    }
    return true;
  };

  const handleBulkUploadEvents = async (newEvents: ArtEvent[]) => {
    if (!assertSupabaseWritableUser()) return;
    const payloads = newEvents.map((ev) => ({ ...ev, createdBy: currentUser!.id }));
    const created = await Promise.all(payloads.map((ev) => api.createEvent(ev)));
    const successful = created.filter((e): e is ArtEvent => !!e);
    if (successful.length === 0) {
      alert('No events were saved to Supabase. Check role/RLS settings.');
      return;
    }
    if (successful.length < newEvents.length) {
      alert(`Saved ${successful.length}/${newEvents.length} events to Supabase.`);
    }
    setEvents((prev) => [...successful, ...prev]);
  };

  const handleBulkUploadArtworks = async (newArtworks: Artwork[]) => {
    if (!assertSupabaseWritableUser()) return;
    const payloads = newArtworks.map((art) => ({ ...art, createdBy: currentUser!.id }));
    const created = await Promise.all(payloads.map((art) => api.createArtwork(art)));
    const successful = created.filter((a): a is Artwork => !!a);
    if (successful.length === 0) {
      alert('No artworks were saved to Supabase. Check role/RLS settings.');
      return;
    }
    if (successful.length < newArtworks.length) {
      alert(`Saved ${successful.length}/${newArtworks.length} artworks to Supabase.`);
    }
    setArtworks((prev) => [...successful, ...prev]);
  };

  const submitBid = async () => {
    if (!actionArtwork || !currentUser) return;
    const currentPrice = actionArtwork.currentBid || actionArtwork.price;
    if (bidValue <= currentPrice) {
      alert(`Giá đấu phải cao hơn giá hiện tại.`);
      return;
    }

    const success = await api.placeBid(actionArtwork.id, currentUser.id, bidValue);
    if (success) {
      setArtworks(prev => prev.map(a => 
        a.id === actionArtwork.id 
          ? { ...a, currentBid: bidValue, bidCount: (a.bidCount || 0) + 1 } 
          : a
      ));
      alert(`Đấu giá thành công!`);
      setActionArtwork(null);
    }
  };

  const filteredEvents = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           e.organizer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = eventCategory === 'all' || e.category === eventCategory;
      const isPast = e.endDate < todayStr;
      const timeMatch = eventTimeline === 'active' ? !isPast : isPast;
      return matchesSearch && matchesCategory && timeMatch;
    });
  }, [events, searchQuery, eventTimeline, eventCategory]);

  const filteredArtworks = useMemo(() => {
    return artworks.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           a.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSaleType = saleTypeFilter === 'all' || a.saleType === saleTypeFilter;
      const matchesPrice = priceFilter === 'all' || (priceFilter === 'high' ? a.price > 10000000 : a.price <= 10000000);
      return matchesSearch && matchesSaleType && matchesPrice;
    });
  }, [artworks, searchQuery, saleTypeFilter, priceFilter]);

  const selectedEvent = useMemo(() => 
    events.find(e => e.id === selectedEventId), 
  [events, selectedEventId]);

  const artworksForSelectedEvent = useMemo(() => 
    artworks.filter(a => a.eventId === selectedEventId), 
  [artworks, selectedEventId]);

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={handleTabChange}
      currentUser={currentUser}
      onLogout={handleLogout}
      onOpenAuth={() => setShowAuthModal(true)}
      language={language}
      setLanguage={setLanguage}
    >
      {showAuthModal && (
        <AuthModal
          onLoginGoogle={handleLogin}
          onLoginTestAdmin={handleLoginTestAdmin}
          onLoginEmailPassword={handleEmailPasswordLogin}
          onSignUpEmailPassword={handleEmailPasswordSignUp}
          onResetPassword={handleResetPassword}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {selectedArtwork && (
        <ArtworkDetail
          artwork={selectedArtwork}
          onClose={() => setSelectedArtwork(null)}
          onInquire={(artwork) => {
            setSelectedArtwork(null);
            setActionArtwork(artwork);
            setActionType('inquire');
          }}
          onBid={(artwork) => {
            setSelectedArtwork(null);
            handleBidClick(artwork);
          }}
        />
      )}
      
      {selectedEvent && (
        <EventDetail 
          event={selectedEvent} 
          onBack={() => setSelectedEventId(null)}
          isSaved={savedEventIds.includes(selectedEvent.id)}
          onToggleSave={() => toggleSaveEvent(selectedEvent.id)}
          linkedArtworks={artworksForSelectedEvent}
          onInquire={() => setActionType('inquire')}
          onBid={handleBidClick}
        />
      )}

      {actionArtwork && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-md" onClick={() => setActionArtwork(null)} />
          <div className="relative bg-white p-6 md:p-10 max-w-xl w-full rounded-none shadow-2xl animate-in overflow-y-auto max-h-[90vh]">
             <button onClick={() => setActionArtwork(null)} className="absolute top-6 right-6 text-slate-300 hover:text-brand-black transition-colors">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             <h2 className="text-3xl md:text-4xl font-serif font-black mb-1">{actionType === 'bid' ? 'Collector Bid' : 'Artwork Inquiry'}</h2>
             <p className="text-brand-orange text-[9px] font-black uppercase tracking-[0.3em] mb-8 border-b border-slate-100 pb-4">{actionArtwork.title}</p>
             {actionType === 'bid' ? (
               <div className="space-y-8">
                 <input type="number" value={bidValue} onChange={e => setBidValue(Number(e.target.value))} className="w-full text-4xl font-serif font-black outline-none border-b-4 border-brand-orange py-4" />
                 <button onClick={submitBid} className="w-full bg-brand-black text-white py-5 font-black uppercase text-[10px] tracking-[0.4em] hover:bg-brand-orange transition-all">Gửi giá đấu</button>
               </div>
             ) : (
               <div className="space-y-8">
                 <button onClick={() => setActionArtwork(null)} className="w-full bg-brand-black text-white py-5 font-black uppercase text-[10px] tracking-[0.4em] hover:bg-brand-orange transition-all">Gửi yêu cầu quan tâm</button>
               </div>
             )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 pb-32 md:pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Đang đồng bộ với mạng lưới...</p>
          </div>
        ) : activeTab === 'about' ? (
          <AboutView language={language} />
        ) : (
          <>
            <div className="mb-6 md:mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-12 border-b border-slate-100 pb-6 md:pb-16">
              <div className="max-w-2xl">
                <h1 className="text-3xl sm:text-6xl md:text-8xl font-serif font-black mb-2 md:mb-6 tracking-tighter text-brand-black uppercase leading-[0.9]">
                  {activeTab === 'events' ? t('hero.exhibitions.title', language) : activeTab === 'marketplace' ? t('hero.marketplace.title', language) : activeTab === 'saved' ? t('hero.watchlist.title', language) : 'Quản lý'}
                </h1>
                <p className="text-slate-400 font-medium text-base md:text-2xl leading-relaxed italic opacity-80 max-w-xl">
                   {activeTab === 'events' ? t('hero.exhibitions.sub', language) : activeTab === 'marketplace' ? t('hero.marketplace.sub', language) : activeTab === 'saved' ? t('hero.watchlist.sub', language) : `Trang quản trị dành cho đơn vị nghệ thuật.`}
                </p>
              </div>
              
              <div className="flex flex-col gap-3 items-start lg:items-end w-full lg:w-auto">
                <div className="flex flex-wrap gap-2 w-full justify-start lg:justify-end items-center">
                  {activeTab === 'events' && (
                    <div className="flex flex-1 md:flex-initial bg-slate-50 p-0.5 rounded-sm border border-slate-100 shadow-sm overflow-hidden">
                      <select onChange={(e) => setEventCategory(e.target.value as any)} className="bg-transparent text-[7px] md:text-[10px] font-black uppercase tracking-widest outline-none px-2 md:px-6 py-1.5 md:py-3 border-r border-slate-200 cursor-pointer">
                        <option value="all">{t('filter.genres', language)}</option>
                        <option value="exhibition">Triển lãm</option>
                        <option value="workshop">Studio</option>
                        <option value="auction">Đấu giá</option>
                      </select>
                      <button onClick={() => setEventTimeline('active')} className={`flex-1 px-3 md:px-6 py-1.5 md:py-3 text-[7px] md:text-[10px] font-black uppercase tracking-widest transition-all ${eventTimeline === 'active' ? 'bg-white text-brand-orange shadow-sm border border-slate-100' : 'text-slate-400'}`}>{t('filter.current', language)}</button>
                      <button onClick={() => setEventTimeline('past')} className={`flex-1 px-3 md:px-6 py-1.5 md:py-3 text-[7px] md:text-[10px] font-black uppercase tracking-widest transition-all ${eventTimeline === 'past' ? 'bg-white text-brand-orange shadow-sm border border-slate-100' : 'text-slate-400'}`}>{t('filter.archived', language)}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {activeTab === 'events' && (
              <div className="animate-in duration-700">
                 <div className="flex justify-end mb-6 md:mb-16 gap-6 md:gap-10">
                    <button onClick={() => setEventViewMode('grid')} className={`text-[8px] md:text-[11px] font-black uppercase tracking-[0.4em] ${eventViewMode === 'grid' ? 'text-brand-orange border-b-2 border-brand-orange pb-1' : 'text-slate-200 hover:text-slate-500'}`}>{t('tab.index', language)}</button>
                    <button onClick={() => setEventViewMode('map')} className={`text-[8px] md:text-[11px] font-black uppercase tracking-[0.4em] ${eventViewMode === 'map' ? 'text-brand-orange border-b-2 border-brand-orange pb-1' : 'text-slate-200 hover:text-slate-500'}`}>{t('tab.map', language)}</button>
                 </div>
                 {eventViewMode === 'grid' ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 md:gap-x-16 gap-y-8 md:gap-y-24">
                     {filteredEvents.map(event => (
                       <div key={event.id} className="relative group">
                          <div onClick={() => setSelectedEventId(event.id)}>
                            <EventCard event={event} />
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); toggleSaveEvent(event.id); }} className={`absolute top-3 left-3 z-10 p-2 rounded-full shadow-2xl transition-all ${savedEventIds.includes(event.id) ? 'bg-brand-orange text-white' : 'bg-white/95 text-slate-300 hover:text-brand-orange'}`}>
                            <svg className="w-4 h-4 md:w-6 md:h-6" fill={savedEventIds.includes(event.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          </button>
                       </div>
                     ))}
                     {filteredEvents.length === 0 && (
                       <div className="col-span-full py-20 md:py-40 text-center">
                         <p className="text-xl md:text-4xl font-serif text-slate-200 italic">{t('empty.events', language)}</p>
                       </div>
                     )}
                   </div>
                 ) : <MapView events={filteredEvents} />}
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 md:gap-x-12 gap-y-8 md:gap-y-20 animate-in duration-700">
                {filteredArtworks.map(artwork => (
                  <ArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                    onOpen={() => setSelectedArtwork(artwork)}
                    onInquire={() => {
                      setActionType('inquire');
                      setActionArtwork(artwork);
                    }}
                    onBid={() => handleBidClick(artwork)}
                  />
                ))}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="animate-in duration-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 md:gap-x-16 gap-y-8 md:gap-y-24">
                  {events.filter(e => savedEventIds.includes(e.id)).map(event => (
                    <div key={event.id} className="relative group">
                      <div onClick={() => setSelectedEventId(event.id)}><EventCard event={event} /></div>
                      <button onClick={() => toggleSaveEvent(event.id)} className="absolute top-4 right-4 z-10 text-[7px] font-black uppercase text-white bg-brand-black px-3 py-2 hover:bg-brand-orange shadow-xl">Xóa khỏi Trail</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <AdminDashboard 
                events={events} artworks={artworks} currentUser={currentUser}
                onAddEvent={handleAddEvent}
                onAddArtwork={handleAddArtwork}
                onUploadEvents={handleBulkUploadEvents}
                onUploadArtworks={handleBulkUploadArtworks}
                onUpdateEvent={handleUpdateEvent}
                onUploadImage={api.uploadImage}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default App;
