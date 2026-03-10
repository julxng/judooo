import type { KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
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
    <Card
      className="group flex h-full cursor-pointer flex-col overflow-hidden border-border transition-colors duration-300 hover:border-foreground"
      onClick={() => onOpen(artwork)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-muted">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        <div className="absolute left-3 top-3 flex gap-2">
          {isAuction ? (
            <Badge tone="accent">
              Auction
            </Badge>
          ) : null}
          {!artwork.available ? (
            <Badge tone="default">
              Collected
            </Badge>
          ) : null}
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        className="flex flex-grow flex-col border-t border-border p-4 outline-none"
        onKeyDown={handleKeyDown}
      >
        <div className="mb-3 mt-1 flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {artwork.city || artwork.country || 'Vietnam'}
            </span>
            <h3 className="m-0 font-display text-[1.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-foreground line-clamp-2">
              {artwork.title}
            </h3>
          </div>
          {isAuction ? (
            <span className="shrink-0 rounded-sm border border-border px-2 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {artwork.bidCount || 0} bids
            </span>
          ) : null}
        </div>

        <div className="mb-auto flex flex-col gap-1">
          <p className="m-0 text-base font-medium text-foreground">{artwork.artist}</p>
          <p className="m-0 text-sm text-muted-foreground">
            {artwork.medium} • {artwork.dimensions}
          </p>
        </div>
      </div>

      <CardFooter className="mt-1 flex items-end justify-between gap-4 border-t border-border bg-card p-4 pt-0">
        <div className="mt-4 flex flex-col gap-1">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {isAuction ? 'Current bid' : 'Price'}
          </span>
          <strong className="font-display text-[1.35rem] font-semibold leading-none tracking-[-0.03em] text-foreground">
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
