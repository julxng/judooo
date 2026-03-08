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
      className="group flex flex-col h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-card border-border/50"
      onClick={() => onOpen(artwork)}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-60 transition-opacity group-hover:opacity-80" />

        <div className="absolute top-4 left-4 flex gap-2">
          {isAuction ? (
            <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground border-transparent shadow-sm">
              Auction
            </Badge>
          ) : null}
          {!artwork.available ? (
            <Badge tone="default" className="bg-background/95 backdrop-blur-sm shadow-sm">
              Collected
            </Badge>
          ) : null}
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        className="flex flex-col flex-grow p-5 outline-none"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-start justify-between gap-4 mb-4 mt-1">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {artwork.city || artwork.country || 'Vietnam'}
            </span>
            <h3 className="m-0 font-serif text-2xl font-semibold leading-tight text-foreground line-clamp-2">
              {artwork.title}
            </h3>
          </div>
          {isAuction ? (
            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-secondary-foreground border">
              {artwork.bidCount || 0} bids
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 mb-auto">
          <p className="m-0 text-base font-medium text-foreground">{artwork.artist}</p>
          <p className="m-0 text-sm text-muted-foreground">
            {artwork.medium} • {artwork.dimensions}
          </p>
        </div>
      </div>

      <CardFooter className="p-5 pt-0 mt-2 border-t border-border/40 bg-muted/10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1 mt-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {isAuction ? 'Current bid' : 'Price'}
          </span>
          <strong className="font-serif text-2xl font-bold leading-none text-foreground">
            {formatCurrency(isAuction ? artwork.currentBid || artwork.price : artwork.price)}
          </strong>
        </div>

        {artwork.available ? (
          <Button
            variant={isAuction ? 'default' : 'secondary'}
            className="shrink-0 rounded-full shadow-sm font-semibold transition-transform hover:scale-105"
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
