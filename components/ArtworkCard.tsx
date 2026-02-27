
import React from 'react';
import { Artwork } from '../types';

interface ArtworkCardProps {
  artwork: Artwork;
  onInquire?: (artwork: Artwork) => void;
  onBid?: (artwork: Artwork) => void;
  onOpen?: (artwork: Artwork) => void;
}

const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, onInquire, onBid, onOpen }) => {
  const isAuction = artwork.saleType === 'auction';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(artwork)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(artwork);
        }
      }}
      className="flex flex-col h-full bg-white p-2 rounded-sm group border border-slate-50 hover:border-slate-100 transition-all text-left"
    >
      <div className="relative aspect-[4/5] mb-5 bg-slate-50 overflow-hidden">
        <img 
          src={artwork.imageUrl} 
          alt={artwork.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!artwork.available && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase border-b-2 border-brand-black pb-1">Collected</span>
          </div>
        )}
        {isAuction && artwork.available && (
          <div className="absolute top-2 left-2">
            <span className="bg-brand-black text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse"></span>
              Live Auction
            </span>
          </div>
        )}
      </div>
      <div className="flex-grow px-2">
        <h3 className="font-serif text-lg font-bold group-hover:text-brand-orange transition-colors leading-snug">{artwork.title}</h3>
        <p className="text-slate-500 text-xs font-medium mt-1">{artwork.artist}</p>
        <p className="text-slate-400 text-[9px] uppercase tracking-widest mt-3">{artwork.medium} • {artwork.dimensions}</p>
      </div>
      <div className="mt-6 pt-4 px-2 border-t border-slate-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-black text-slate-400 tracking-widest">
              {isAuction ? 'Current Bid' : 'Price'}
            </span>
            <span className="font-mono text-base font-bold text-brand-orange">
              ${(isAuction ? (artwork.currentBid || artwork.price) : artwork.price).toLocaleString()}
            </span>
          </div>
          {isAuction && (
             <div className="text-right">
                <span className="text-[8px] uppercase font-black text-slate-400 tracking-widest">Bids</span>
                <p className="text-[10px] font-bold">{artwork.bidCount || 0}</p>
             </div>
          )}
        </div>
        
        {artwork.available && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              isAuction ? onBid?.(artwork) : onInquire?.(artwork);
            }}
            className="w-full py-2.5 bg-brand-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all"
          >
            {isAuction ? 'Place Bid' : 'Inquire'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ArtworkCard;
