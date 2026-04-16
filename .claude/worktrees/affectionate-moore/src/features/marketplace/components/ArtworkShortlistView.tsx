import { EmptyState } from '@/components/shared/EmptyState';
import { Badge, Button, Card } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import type { Artwork } from '../types/artwork.types';

interface ArtworkShortlistViewProps {
  artworks: Artwork[];
  interestSummary: string[];
  onOpenArtwork: (artwork: Artwork) => void;
  onActionArtwork: (artwork: Artwork) => void;
  onRemoveArtwork: (artworkId: string) => void;
  onReturnToDiscover: () => void;
}

export const ArtworkShortlistView = ({
  artworks,
  interestSummary,
  onOpenArtwork,
  onActionArtwork,
  onRemoveArtwork,
  onReturnToDiscover,
}: ArtworkShortlistViewProps) => {
  if (artworks.length === 0) {
    return (
      <EmptyState
        title="No shortlisted artworks yet"
        description="Swipe through discovery cards first, then come back here to compare what resonated."
        action={(
          <Button variant="primary" onClick={onReturnToDiscover}>
            Go to Discover
          </Button>
        )}
      />
    );
  }

  const auctionCount = artworks.filter((artwork) => artwork.saleType === 'auction').length;
  const fixedCount = artworks.length - auctionCount;

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden border border-border bg-card p-8 lg:p-10">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="flex flex-col gap-5">
            <span className="section-kicker">Review Shortlist</span>
            <h2 className="display-heading m-0 max-w-3xl text-foreground">Review the works that held your attention.</h2>
            <p className="m-0 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Use this space to compare image, story, pricing, and urgency before you bid or trigger an inquiry.
            </p>
            {interestSummary.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interestSummary.map((interest) => (
                  <Badge key={interest} tone="accent">
                    {interest}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

            <div className="grid grid-cols-3 gap-3">
            <div className="surface-stat p-5 text-center">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Shortlist</span>
              <span className="font-display mt-2 block text-4xl font-semibold text-foreground">{artworks.length}</span>
            </div>
            <div className="surface-stat p-5 text-center">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Auction</span>
              <span className="font-display mt-2 block text-4xl font-semibold text-foreground">{auctionCount}</span>
            </div>
            <div className="surface-stat p-5 text-center">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Inquiry</span>
              <span className="font-display mt-2 block text-4xl font-semibold text-foreground">{fixedCount}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5">
        {artworks.map((artwork) => {
          const actionLabel = artwork.saleType === 'auction' ? 'Place Bid' : 'Auto Inquire';
          const priceLabel = artwork.saleType === 'auction' ? 'Current bid' : 'Price';
          const location = [artwork.city, artwork.country].filter(Boolean).join(', ') || 'Vietnam';

          return (
            <Card key={artwork.id} className="overflow-hidden border-border bg-card shadow-medium">
              <div className="grid gap-5 p-5 md:grid-cols-[16rem_minmax(0,1fr)] md:p-6">
                <button
                  type="button"
                  className="overflow-hidden rounded-md bg-surface-muted text-left"
                  onClick={() => onOpenArtwork(artwork)}
                >
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="aspect-[4/5] h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </button>

                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="accent">{artwork.saleType === 'auction' ? 'Auction' : 'Fixed Price'}</Badge>
                        <Badge>{location}</Badge>
                        {artwork.style ? <Badge>{artwork.style}</Badge> : null}
                      </div>
                      <div>
                        <h3 className="m-0 font-display text-[2rem] leading-[0.95] tracking-[-0.03em] text-foreground">
                          {artwork.title}
                        </h3>
                        <p className="mt-2 text-base font-medium text-foreground">{artwork.artist}</p>
                        <p className="m-0 text-sm text-muted-foreground">
                          {[artwork.yearCreated?.toString(), artwork.medium, artwork.dimensions].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-44 flex-col gap-1 rounded-md border border-border bg-surface p-4">
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {priceLabel}
                      </span>
                      <strong className="font-display text-3xl leading-none text-foreground">
                        {formatCurrency(artwork.saleType === 'auction' ? artwork.currentBid || artwork.price : artwork.price)}
                      </strong>
                      {artwork.saleType === 'auction' ? (
                        <span className="text-sm text-muted-foreground">{artwork.bidCount || 0} bids so far</span>
                      ) : null}
                    </div>
                  </div>

                  <p className="m-0 max-w-3xl text-sm leading-7 text-muted-foreground">
                    {artwork.story || artwork.description || 'Open the artwork to review provenance, story, and acquisition details.'}
                  </p>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-border bg-surface p-4">
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Why it fits</span>
                      <p className="mt-2 mb-0 text-sm leading-6 text-foreground">
                        {[artwork.style, artwork.medium, location].filter(Boolean).slice(0, 3).join(' • ') || 'Aligned to your saved collector interests.'}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-4">
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Provenance</span>
                      <p className="mt-2 mb-0 text-sm leading-6 text-foreground">
                        {artwork.provenance || artwork.authenticity || 'Request provenance details from the gallery during inquiry.'}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-4">
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Next move</span>
                      <p className="mt-2 mb-0 text-sm leading-6 text-foreground">
                        {artwork.saleType === 'auction'
                          ? 'Move quickly if the estimate feels right; auction works are framed for immediate action.'
                          : 'Use auto inquiry to contact the gallery with your intent and questions in one step.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={() => onActionArtwork(artwork)}>
                      {actionLabel}
                    </Button>
                    <Button variant="outline" onClick={() => onOpenArtwork(artwork)}>
                      View details
                    </Button>
                    <Button variant="ghost" onClick={() => onRemoveArtwork(artwork.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
