import React, { useMemo, useState } from 'react';
import { Artwork } from '../types';

interface ArtworkDetailProps {
  artwork: Artwork;
  onClose: () => void;
  onInquire: (artwork: Artwork) => void;
  onBid: (artwork: Artwork) => void;
}

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

const ArtworkDetail: React.FC<ArtworkDetailProps> = ({ artwork, onClose, onInquire, onBid }) => {
  const isAuction = artwork.saleType === 'auction';
  const gallery = useMemo(() => {
    const base = artwork.imageGallery && artwork.imageGallery.length ? artwork.imageGallery : [artwork.imageUrl];
    return Array.from(new Set(base.filter(Boolean)));
  }, [artwork.imageGallery, artwork.imageUrl]);
  const [activeImage, setActiveImage] = useState(gallery[0] || artwork.imageUrl);

  return (
    <div className="fixed inset-0 z-[180] flex items-start md:items-center justify-center p-2 md:p-6">
      <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-white/90 p-2 border border-slate-100 hover:border-slate-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-4 md:p-6 border-b lg:border-b-0 lg:border-r border-slate-100">
            <div className="aspect-square bg-slate-50 overflow-hidden mb-3">
              <img src={activeImage} alt={artwork.title} className="w-full h-full object-cover" />
            </div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {gallery.slice(0, 8).map((img) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square overflow-hidden border ${activeImage === img ? 'border-brand-orange' : 'border-slate-100'}`}
                  >
                    <img src={img} alt={artwork.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 md:p-8">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-brand-orange mb-3">
              {isAuction ? 'Auction Lot' : 'Fixed Price'}
            </p>
            <h2 className="text-3xl md:text-5xl font-serif font-black leading-tight">{artwork.title}</h2>
            <p className="text-slate-500 mt-2">{artwork.artist}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="border border-slate-100 p-3">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">{isAuction ? 'Current Bid' : 'Price'}</p>
                <p className="font-mono text-lg font-bold text-brand-orange">
                  {formatCurrency(isAuction ? (artwork.currentBid || artwork.price) : artwork.price)}
                </p>
              </div>
              <div className="border border-slate-100 p-3">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Medium</p>
                <p className="font-semibold">{artwork.medium || 'N/A'}</p>
              </div>
              <div className="border border-slate-100 p-3">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Dimensions</p>
                <p className="font-semibold">{artwork.dimensions || 'N/A'}</p>
              </div>
              <div className="border border-slate-100 p-3">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Year</p>
                <p className="font-semibold">{artwork.yearCreated || 'Unknown'}</p>
              </div>
              <div className="border border-slate-100 p-3">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Location</p>
                <p className="font-semibold">{[artwork.city, artwork.country].filter(Boolean).join(', ') || 'Vietnam'}</p>
              </div>
              <div className="border border-slate-100 p-3">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Condition</p>
                <p className="font-semibold">{artwork.conditionReport || 'Not specified'}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700">
              {artwork.description && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Description</h3>
                  <p>{artwork.description}</p>
                </div>
              )}
              {artwork.story && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Story</h3>
                  <p>{artwork.story}</p>
                </div>
              )}
              {artwork.provenance && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Provenance</h3>
                  <p>{artwork.provenance}</p>
                </div>
              )}
              {artwork.authenticity && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Authenticity</h3>
                  <p>{artwork.authenticity}</p>
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {artwork.available && (
                <button
                  onClick={() => (isAuction ? onBid(artwork) : onInquire(artwork))}
                  className="bg-brand-black text-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-orange transition-colors"
                >
                  {isAuction ? 'Place Bid' : 'Inquire'}
                </button>
              )}
              {artwork.sourceItemUrl && (
                <a
                  href={artwork.sourceItemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-slate-200 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-brand-black"
                >
                  Source
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetail;
