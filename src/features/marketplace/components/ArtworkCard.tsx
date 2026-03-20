import { useCallback, useRef, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { useLanguage } from '@/app/providers';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card, CardFooter } from '@/components/ui/Card';
import type { Artwork } from '../types/artwork.types';
import { getArtworkLocation, getArtworkMedium, getArtworkTitle } from '../utils/artwork-utils';

interface ArtworkCardProps {
  artwork: Artwork;
  onOpen: (artwork: Artwork) => void;
  onAction: (artwork: Artwork) => void;
}

export const ArtworkCard = ({ artwork, onOpen, onAction }: ArtworkCardProps) => {
  const { language } = useLanguage();
  const isAuction = artwork.saleType === 'auction';
  const imageRef = useRef<HTMLImageElement>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(artwork);
    }
  };

  const handleMouseMove = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const img = imageRef.current;
    if (!img) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    img.style.transform = `scale(1.08) translate(${-x}px, ${-y}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    img.style.transform = '';
  }, []);

  return (
    <Card
      className="artwork-card"
      onClick={() => onOpen(artwork)}
    >
      <div
        className="artwork-card__image-wrap"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          ref={imageRef}
          src={artwork.imageUrl}
          alt={getArtworkTitle(artwork, language)}
          className="artwork-card__image"
          loading="lazy"
        />
        <div className="artwork-card__badge-group">
          {isAuction ? (
            <Badge tone="accent">Auction</Badge>
          ) : null}
          {!artwork.available ? (
            <Badge tone="default">Collected</Badge>
          ) : null}
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        className="artwork-card__body"
        onKeyDown={handleKeyDown}
      >
        <div className="artwork-card__header">
          <div className="artwork-card__header-text">
            <span className="artwork-card__label">
              {getArtworkLocation(artwork, language) || 'Vietnam'}
            </span>
            <h3>{getArtworkTitle(artwork, language)}</h3>
          </div>
          {isAuction ? (
            <span className="artwork-card__bid-count">
              {artwork.bidCount || 0} bids
            </span>
          ) : null}
        </div>

        <div className="artwork-card__meta">
          <p className="artwork-card__artist">{artwork.artist}</p>
          <p className="artwork-card__medium">
            {getArtworkMedium(artwork, language)} • {artwork.dimensions}
          </p>
        </div>
      </div>

      <CardFooter className="artwork-card__footer">
        <div className="artwork-card__price">
          <span className="artwork-card__label">
            {isAuction ? 'Current bid' : 'Price'}
          </span>
          <strong>
            {formatCurrency(isAuction ? artwork.currentBid || artwork.price : artwork.price)}
          </strong>
        </div>

        {artwork.available ? (
          <Button
            variant={isAuction ? 'default' : 'outline'}
            size="sm"
            className="shrink-0"
            onClick={(event) => {
              event.stopPropagation();
              onAction(artwork);
            }}
          >
            {isAuction ? 'Place Bid' : 'Inquire'}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
};
