import type { KeyboardEvent } from 'react';
import { Badge, Button, Card } from '@ui/index';
import { formatCurrency } from '@lib/format';
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
    <Card className="artwork-card">
      <div
        role="button"
        tabIndex={0}
        className="artwork-card__surface"
        onClick={() => onOpen(artwork)}
        onKeyDown={handleKeyDown}
      >
        <div className="artwork-card__image-wrap">
          <img src={artwork.imageUrl} alt={artwork.title} className="artwork-card__image" />
          {isAuction ? <Badge tone="accent" className="artwork-card__badge">Auction</Badge> : null}
          {!artwork.available ? <div className="artwork-card__sold">Collected</div> : null}
        </div>
        <div className="artwork-card__body">
          <h3>{artwork.title}</h3>
          <p className="artwork-card__artist">{artwork.artist}</p>
          <p className="muted-text">{artwork.medium} • {artwork.dimensions}</p>
          <div className="artwork-card__footer">
            <div>
              <span className="artwork-card__label">{isAuction ? 'Current Bid' : 'Price'}</span>
              <strong>{formatCurrency(isAuction ? artwork.currentBid || artwork.price : artwork.price)}</strong>
            </div>
            {isAuction ? <Badge>{artwork.bidCount || 0} bids</Badge> : null}
          </div>
          {artwork.available ? (
            <Button
              variant={isAuction ? 'primary' : 'secondary'}
              fullWidth
              onClick={(event) => {
                event.stopPropagation();
                onAction(artwork);
              }}
            >
              {isAuction ? 'Place Bid' : 'Inquire'}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
};
