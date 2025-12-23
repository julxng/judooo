
import React, { useEffect, useState } from 'react';
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

const EventDetail: React.FC<EventDetailProps> = ({ 
  event, 
  onBack, 
  isSaved, 
  onToggleSave, 
  linkedArtworks,
  onInquire,
  onBid
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const allMedia: EventMedia[] = [
    { type: 'image', url: event.imageUrl },
    ...(event.media || [])
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-in">
      {/* Dynamic Action Bar */}
      <div className="fixed top-0 left-0 right-0 z-[110] p-4 md:p-6 flex justify-between items-center pointer-events-none">
        <button 
          onClick={onBack}
          className="pointer-events-auto group flex items-center gap-2 md:gap-3 bg-white/20 backdrop-blur-2xl border border-white/30 px-5 md:px-6 py-3 rounded-full text-white hover:bg-white hover:text-brand-black transition-all shadow-2xl"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Exhibitions</span>
        </button>

        <button 
          onClick={onToggleSave}
          className={`pointer-events-auto group flex items-center gap-2 md:gap-3 px-5 md:px-6 py-3 rounded-full transition-all border shadow-2xl ${isSaved ? 'bg-brand-orange text-white border-brand-orange' : 'bg-white/95 text-brand-black border-slate-100'}`}
        >
          <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isSaved ? 'fill-current' : 'none'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
            {isSaved ? 'Collected' : 'Save'}
          </span>
        </button>
      </div>

      {/* Responsive Hero Section */}
      <section className="relative h-screen w-full bg-brand-black overflow-hidden flex items-end">
        <div className="absolute inset-0 z-0">
          {allMedia[activeMediaIndex].type === 'image' ? (
            <img 
              src={allMedia[activeMediaIndex].url} 
              alt={event.title} 
              className="w-full h-full object-cover animate-in fade-in duration-1000"
            />
          ) : (
            <video 
              src={allMedia[activeMediaIndex].url}
              autoPlay 
              muted 
              loop 
              className="w-full h-full object-cover animate-in fade-in duration-1000"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
        </div>
        
        <div className="relative z-10 p-6 md:p-10 md:px-24 w-full mb-12 md:mb-20">
          <span className="inline-block bg-brand-orange text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] px-4 py-2 mb-6 shadow-xl">
            {event.category}
          </span>
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-black text-white leading-[0.9] tracking-tighter uppercase max-w-5xl">
            {event.title}
          </h1>
          
          <div className="mt-8 md:mt-12 flex flex-wrap gap-8 md:gap-16 text-white/70">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-white/40">Curator</p>
              <p className="text-lg md:text-2xl font-serif font-bold italic">{event.organizer}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-white/40">District</p>
              <p className="text-lg md:text-2xl font-serif font-bold italic">{event.location}</p>
            </div>
          </div>
        </div>

        {/* Media Selectors (Hidden on small mobile to avoid clutter) */}
        {allMedia.length > 1 && (
          <div className="hidden md:flex absolute right-10 top-1/2 -translate-y-1/2 flex-col gap-4">
            {allMedia.map((_, i) => (
              <button 
                key={i}
                onClick={() => setActiveMediaIndex(i)}
                className={`w-1.5 h-12 transition-all duration-500 rounded-full ${activeMediaIndex === i ? 'bg-brand-orange scale-x-150' : 'bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Touch-Friendly Atmospheric Gallery */}
      <section className="bg-white py-20 md:py-32 overflow-hidden border-b border-slate-50">
        <div className="px-6 md:px-24 mb-10 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-orange">Installation Views</h2>
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Swiping through {allMedia.length} visual frequencies</p>
        </div>
        
        <div className="flex gap-6 md:gap-10 overflow-x-auto px-6 md:px-24 pb-8 scrollbar-hide snap-x snap-mandatory">
          {allMedia.map((media, i) => (
            <div key={i} className="relative shrink-0 w-[85vw] md:w-[65vw] aspect-[16/10] bg-slate-50 snap-center group overflow-hidden">
                {media.type === 'image' ? (
                  <img src={media.url} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" />
                ) : (
                  <video src={media.url} controls className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-black/40 backdrop-blur-md px-3 md:px-4 py-2 text-[7px] md:text-[8px] text-white font-black uppercase tracking-widest">
                  Perspectives {i + 1}
                </div>
            </div>
          ))}
        </div>
      </section>

      {/* Curatorial Context Section */}
      <div className="bg-white px-6 md:px-24 py-20 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20 max-w-7xl mx-auto border-b border-slate-100">
        <div className="lg:col-span-4">
          <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-orange mb-8 md:mb-10">Curatorial Narrative</h2>
          <p className="text-2xl md:text-3xl font-serif font-black italic text-brand-black leading-snug">
            A visceral connection between regional lacquer techniques and digital futurism.
          </p>
          <div className="mt-10 md:mt-12 pt-10 md:pt-12 border-t border-slate-50 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
                <div>
                   <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-400">Venue Nexus</p>
                   <p className="text-xs md:text-sm font-black uppercase">{event.location}</p>
                </div>
              </div>
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="prose prose-xl font-medium text-slate-500 leading-relaxed uppercase tracking-widest text-[11px] md:text-xs space-y-10">
            <p className="first-letter:text-6xl md:first-letter:text-8xl first-letter:font-serif first-letter:font-black first-letter:text-brand-orange first-letter:mr-4 first-letter:float-left first-letter:leading-none">
              {event.description}
            </p>
            <p>
              By weaving together multiple narrative threads across silk painting, oil, and interactive digital installation, this exhibition invites the viewer to navigate the tension of the Vietnam art scene in flux. Every work has been vetted for its unique contribution to the regional dialogue.
            </p>
          </div>
        </div>
      </div>

      {/* Artworks Index */}
      {linkedArtworks.length > 0 && (
        <section className="bg-slate-50 py-20 md:py-32 px-6 md:px-24">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-20 border-b border-slate-200 pb-10 md:pb-12 gap-4">
                    <h2 className="text-4xl md:text-6xl font-serif font-black italic tracking-tighter uppercase leading-none">Catalog Works</h2>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Authentic acquisitions</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
                    {linkedArtworks.map(artwork => (
                        <ArtworkCard 
                            key={artwork.id} 
                            artwork={artwork} 
                            onInquire={() => onInquire(artwork)}
                            onBid={() => onBid(artwork)}
                        />
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* Immersive CTA */}
      <section className="bg-brand-black text-white py-24 md:py-40 px-6 md:px-24 text-center">
          <h3 className="text-4xl sm:text-6xl md:text-7xl font-serif font-black italic mb-10 tracking-tighter uppercase leading-[0.9]">Experience the Vibe</h3>
          <p className="text-slate-500 text-sm md:text-base font-black mb-12 md:mb-16 max-w-xl mx-auto uppercase tracking-[0.3em]">
            Open daily in the heart of {event.location}. Collective members receive private tour access.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 md:gap-8">
            <button onClick={onBack} className="px-10 py-4 md:px-12 md:py-5 border-2 border-white text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-brand-black transition-all">
                Close Exhibit
            </button>
            <button 
                onClick={onToggleSave}
                className={`px-10 py-4 md:px-12 md:py-5 text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-2xl ${isSaved ? 'bg-white text-brand-black' : 'bg-brand-orange text-white'}`}
            >
                {isSaved ? 'In Watchlist' : 'Add to Trail'}
            </button>
          </div>
      </section>
    </div>
  );
};

export default EventDetail;
