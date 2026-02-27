import React, { useEffect, useMemo, useState } from 'react';
import { ArtEvent, Artwork, EventMedia } from '../types';
import ArtworkCard from './ArtworkCard';

interface EventDetailProps {
  event: ArtEvent;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  linkedArtworks: Artwork[];
  onInquire: (artwork: Artwork) => void;
  onBid: (artwork: Artwork) => void;
}

const fallbackImage = 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1600';

const EventDetail: React.FC<EventDetailProps> = ({
  event,
  onBack,
  isSaved,
  onToggleSave,
  linkedArtworks,
  onInquire,
  onBid,
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const mediaItems: EventMedia[] = useMemo(() => {
    const merged = [{ type: 'image' as const, url: event.imageUrl || fallbackImage }, ...(event.media || [])];
    const unique = merged.filter((m, idx, arr) => m.url && arr.findIndex((x) => x.type === m.type && x.url === m.url) === idx);
    return unique.length ? unique : [{ type: 'image', url: fallbackImage }];
  }, [event.imageUrl, event.media]);

  const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0];

  const handleShare = async () => {
    const shareData = {
      title: event.name_vie || event.name_en || event.title,
      text: event.description?.slice(0, 180) || 'Check this event on Judooo',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // ignore and fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard.');
  };

  const directionUrl =
    event.google_map_link ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.lat},${event.lng}`)}`;

  const chips = [
    event.art_medium,
    event.event_type,
    event.place_type,
    ...(event.tags || []),
  ].filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-[120] bg-[#f5f5f2] overflow-y-auto">
      <div className="sticky top-0 z-[140] bg-white/92 backdrop-blur-md border-b border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 border border-slate-300 bg-white hover:border-brand-orange transition-colors"
          >
            <span>←</span>
            <span>Back to Events</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSave}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                isSaved ? 'bg-brand-orange border-brand-orange text-white' : 'border-slate-300 text-slate-700'
              }`}
            >
              {isSaved ? 'Saved to Route' : 'Save to Route'}
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-slate-300 text-slate-700 bg-white hover:border-brand-orange transition-colors"
            >
              Share
            </button>
          </div>
        </div>
      </div>

      <section className="relative h-[50vh] md:h-[64vh] min-h-[340px] bg-black">
        {activeMedia.type === 'image' ? (
          <img src={activeMedia.url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <video src={activeMedia.url} controls autoPlay muted loop className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-4 md:px-8 pb-8 md:pb-10">
          <p className="inline-block text-[11px] bg-brand-orange text-white px-3 py-1 font-semibold uppercase tracking-wider mb-4 shadow-lg">
            {event.event_type || event.category}
          </p>
          <h1 className="text-3xl md:text-6xl text-white font-bold leading-[1.02] max-w-4xl tracking-tight">
            {event.name_vie || event.name_en || event.title}
          </h1>
          <p className="text-slate-200/95 mt-3 text-sm md:text-base">
            {event.startDate} - {event.endDate} • {event.city || event.location}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <main className="lg:col-span-8 space-y-8">
          <section className="bg-white border border-slate-200 p-5 md:p-7 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
            <h2 className="text-xl font-semibold mb-4 tracking-tight">Event Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-semibold">{event.startDate} - {event.endDate}</p>
              </div>
              <div>
                <p className="text-slate-500">City / District</p>
                <p className="font-semibold">{event.city || event.location}{event.district ? `, ${event.district}` : ''}</p>
              </div>
              <div>
                <p className="text-slate-500">Address</p>
                <p className="font-semibold">{event.address || event.location || 'Updating...'}</p>
              </div>
              <div>
                <p className="text-slate-500">Price</p>
                <p className="font-semibold">{event.is_free ? 'Free' : event.price ? `${event.price.toLocaleString()} VND` : 'Contact organizer'}</p>
              </div>
            </div>
            {chips.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2.5">
                {chips.map((chip) => (
                  <span key={chip} className="text-xs px-2.5 py-1 border border-slate-300 bg-[#f8f7f4] rounded-full">
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 p-5 md:p-7 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
            <h2 className="text-xl font-semibold mb-4 tracking-tight">Description</h2>
            <div className="space-y-4 text-slate-700 leading-7 whitespace-pre-line">
              {event.description_vie || event.description_en || event.description || 'No detailed description available yet.'}
            </div>
          </section>

          <section className="bg-white border border-slate-200 p-5 md:p-7 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
            <h2 className="text-xl font-semibold mb-4 tracking-tight">Media</h2>
            <div className="space-y-4">
              <div className="aspect-video bg-slate-100 overflow-hidden border border-slate-200">
                {activeMedia.type === 'image' ? (
                  <img src={activeMedia.url} className="w-full h-full object-contain" />
                ) : (
                  <video src={activeMedia.url} controls className="w-full h-full object-contain" />
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {mediaItems.map((media, i) => (
                  <button
                    key={`${media.url}-${i}`}
                    onClick={() => setActiveMediaIndex(i)}
                    className={`relative h-20 w-28 shrink-0 border transition-all ${activeMediaIndex === i ? 'border-brand-orange ring-1 ring-brand-orange' : 'border-slate-300 hover:border-slate-500'}`}
                  >
                    {media.type === 'image' ? (
                      <img src={media.url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-black text-white flex items-center justify-center text-xs font-semibold">VIDEO</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {linkedArtworks.length > 0 && (
            <section className="bg-white border border-slate-200 p-5 md:p-7 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
              <h2 className="text-xl font-semibold mb-5 tracking-tight">Related Artworks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {linkedArtworks.map((artwork) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} onInquire={() => onInquire(artwork)} onBid={() => onBid(artwork)} />
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 p-5 sticky top-24 space-y-3 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
            <button
              onClick={() => window.open(directionUrl, '_blank', 'noopener,noreferrer')}
              className="w-full px-4 py-3 bg-brand-black text-white text-sm font-semibold hover:bg-brand-orange transition-colors"
            >
              Get Direction
            </button>
            <button
              onClick={onToggleSave}
              className="w-full px-4 py-3 border border-slate-300 text-sm font-semibold bg-white hover:border-brand-orange transition-colors"
            >
              {isSaved ? 'Remove from Route' : 'Save to Route'}
            </button>
            {event.registration_link && (
              <button
                onClick={() => window.open(event.registration_link, '_blank', 'noopener,noreferrer')}
                className="w-full px-4 py-3 bg-brand-orange text-white text-sm font-semibold hover:brightness-95 transition"
              >
                Register Now
              </button>
            )}
            {event.sourceItemUrl && (
              <button
                onClick={() => window.open(event.sourceItemUrl, '_blank', 'noopener,noreferrer')}
                className="w-full px-4 py-3 border border-slate-300 text-sm font-semibold bg-white hover:border-brand-orange transition-colors"
              >
                Read Original Source
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default EventDetail;
