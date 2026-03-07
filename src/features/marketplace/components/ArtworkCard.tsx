import { Badge, Button } from '@ui/index';
import {
  MediaCard,
  MediaCardTitle,
  MediaCardSubtitle,
  MediaCardFooter,
} from '@components/shared/MediaCard';
import { formatCurrency } from '@lib/format';
import type { Artwork } from '../types/artwork.types';

interface ArtworkCardProps {
  artwork: Artwork;
  onOpen: (artwork: Artwork) => void;
  onAction: (artwork: Artwork) => void;
}

export const ArtworkCard = ({ artwork, onOpen, onAction }: ArtworkCardProps) => {
  const isAuction = artwork.saleType === 'auction';

  return (
    <MediaCard
      imageUrl={artwork.imageUrl}
      imageAlt={artwork.title}
      aspectRatio="4/5"
      badge={isAuction ? { label: 'Auction', tone: 'accent' } : undefined}
      soldLabel={!artwork.available ? 'Collected' : undefined}
      onClick={() => onOpen(artwork)}
      className="artwork-card"
    >
      <MediaCardTitle>{artwork.title}</MediaCardTitle>
      <MediaCardSubtitle>{artwork.artist}</MediaCardSubtitle>
      <p className="muted-text">{artwork.medium} • {artwork.dimensions}</p>
      <MediaCardFooter>
        <div>
          <span className="media-card__label">{isAuction ? 'Current Bid' : 'Price'}</span>
          <strong>{formatCurrency(isAuction ? artwork.currentBid || artwork.price : artwork.price)}</strong>
        </div>
        {isAuction ? <Badge>{artwork.bidCount || 0} bids</Badge> : null}
      </MediaCardFooter>
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
    </MediaCard>
  );
};
