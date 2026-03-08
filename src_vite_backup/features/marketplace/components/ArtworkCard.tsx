import type { KeyboardEvent } from 'react';
import { Badge } from '@ui/index';
import { formatCurrency } from '@lib/format';
import { JudoooButton } from '@tailwind-ui/components/Button';
import { JudoooCard } from '@tailwind-ui/components/Card';
import type { Artwork } from '../types/artwork.types';

interface ArtworkCardProps {
  artwork: Artwork;
  onOpen: (artwork: Artwork) => void;
  onAction: (artwork: Artwork) => void;
}

export const ArtworkCard = ({ artwork, onOpen, onAction }: ArtworkCardProps) => {
  const isAuction = artwork.saleType === 'auction';

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(artwork);
    }
  };

  return (
    <JudoooCard
      className="jd:group jd:h-full jd:transition-transform jd:duration-200 hover:jd:-translate-y-1"
      media={
        <div className="jd:relative jd:h-full jd:w-full">
          <img src={artwork.imageUrl} alt={artwork.title} className="jd:h-full jd:w-full jd:object-cover jd:transition-transform jd:duration-300 group-hover:jd:scale-[1.03]" />
          <div className="jd:absolute jd:inset-x-0 jd:bottom-0 jd:h-32 jd:bg-gradient-to-t jd:from-judooo-ink/35 jd:to-transparent" />
          {isAuction ? <Badge tone="accent" className="jd:absolute jd:top-4 jd:left-4">Auction</Badge> : null}
          {!artwork.available ? (
            <div className="jd:absolute jd:inset-0 jd:grid jd:place-items-center jd:bg-judooo-paper/70 jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.24em] jd:text-judooo-ink">
              Collected
            </div>
          ) : null}
        </div>
      }
    >
      <div
        role="button"
        tabIndex={0}
        className="jd:flex jd:h-full jd:flex-col jd:gap-4"
        onClick={() => onOpen(artwork)}
        onKeyDown={handleKeyDown}
      >
        <div className="jd:flex jd:items-start jd:justify-between jd:gap-4">
          <div className="jd:flex jd:flex-col jd:gap-2">
            <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:uppercase jd:tracking-[0.2em] jd:text-judooo-smoke">
              {artwork.city || artwork.country || 'Vietnam'}
            </p>
            <h3 className="jd:m-0 jd:font-serif jd:text-[clamp(1.5rem,3vw,2rem)] jd:leading-[0.94] jd:text-judooo-ink">
              {artwork.title}
            </h3>
          </div>
          {isAuction ? (
            <span className="jd:rounded-full jd:bg-judooo-ember/10 jd:px-3 jd:py-2 jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.18em] jd:text-judooo-ember">
              {artwork.bidCount || 0} bids
            </span>
          ) : null}
        </div>
        <div className="jd:flex jd:flex-col jd:gap-2">
          <p className="jd:m-0 jd:text-sm jd:text-judooo-smoke">{artwork.artist}</p>
          <p className="jd:m-0 jd:text-sm jd:leading-6 jd:text-judooo-smoke">
            {artwork.medium} • {artwork.dimensions}
          </p>
        </div>
        <div className="jd:flex jd:items-end jd:justify-between jd:gap-4">
          <div className="jd:flex jd:flex-col jd:gap-1">
            <span className="jd:font-mono jd:text-[10px] jd:uppercase jd:tracking-[0.22em] jd:text-judooo-smoke">
              {isAuction ? 'Current bid' : 'Price'}
            </span>
            <strong className="jd:font-serif jd:text-3xl jd:leading-none jd:text-judooo-ink">
              {formatCurrency(isAuction ? artwork.currentBid || artwork.price : artwork.price)}
            </strong>
          </div>
          {artwork.available ? (
            <JudoooButton
              variant={isAuction ? 'primary' : 'secondary'}
              className="jd:shrink-0"
              onClick={(event) => {
                event.stopPropagation();
                onAction(artwork);
              }}
            >
              {isAuction ? 'Place Bid' : 'Inquire'}
            </JudoooButton>
          ) : null}
        </div>
      </div>
    </JudoooCard>
  );
};
