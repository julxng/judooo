import { EmptyState } from '@/components/shared/EmptyState';
import { AsyncStatusBanner } from '@/components/shared/AsyncStatusBanner';
import { Badge, Button, Card, Input, Select } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import type {
  Artwork,
  ArtworkPriceFilter,
  ArtworkSaleFilter,
} from '../types/artwork.types';

interface MarketplaceScreenProps {
  artworks: Artwork[];
  searchQuery: string;
  selectedInterests: string[];
  suggestedInterests: string[];
  shortlistedArtworks: Artwork[];
  saleTypeFilter: ArtworkSaleFilter;
  priceFilter: ArtworkPriceFilter;
  dbReadError: string | null;
  swipedCount: number;
  onSearchChange: (value: string) => void;
  onToggleInterest: (value: string) => void;
  onSaleTypeChange: (value: ArtworkSaleFilter) => void;
  onPriceFilterChange: (value: ArtworkPriceFilter) => void;
  onClearDiscovery: () => void;
  onResetSwipes: () => void;
  onOpenShortlist: () => void;
  onOpenArtwork: (artwork: Artwork) => void;
  onShortlistArtwork: (artwork: Artwork) => void;
  onPassArtwork: (artwork: Artwork) => void;
}

export const MarketplaceScreen = ({
  artworks,
  searchQuery,
  selectedInterests,
  suggestedInterests,
  shortlistedArtworks,
  saleTypeFilter,
  priceFilter,
  dbReadError,
  swipedCount,
  onSearchChange,
  onToggleInterest,
  onSaleTypeChange,
  onPriceFilterChange,
  onClearDiscovery,
  onResetSwipes,
  onOpenShortlist,
  onOpenArtwork,
  onShortlistArtwork,
  onPassArtwork,
}: MarketplaceScreenProps) => {
  const availableCount = artworks.filter((artwork) => artwork.available).length;
  const shortlistedAuctionCount = shortlistedArtworks.filter((artwork) => artwork.saleType === 'auction').length;
  const shortlistedFixedCount = shortlistedArtworks.filter((artwork) => artwork.saleType === 'fixed').length;
  const currentArtwork = artworks[0] || null;
  const nextArtwork = artworks[1] || null;
  const discoveryCount = artworks.length;
  const activeFilters = selectedInterests.length + (searchQuery.trim() ? 1 : 0);

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden border border-border bg-card p-8 lg:p-10">
        <div className="relative z-10 grid items-end gap-10 lg:grid-cols-[1fr_24rem]">
          <div className="flex flex-col gap-6">
            <span className="section-kicker">Collector Discovery</span>
            <h2 className="display-heading m-0 max-w-3xl text-foreground">
              Lead with taste. Let the artwork image do the work.
            </h2>
            <p className="m-0 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Set an interest, swipe through image-led works, then review the shortlist that earns your attention before you bid or inquire.
            </p>

            <div className="flex flex-col gap-4 border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-col gap-2">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  1. Describe your interest
                </span>
                <Input
                  type="text"
                  placeholder="Abstract lacquer, women painters, landscape oils, Hanoi modernism..."
                  value={searchQuery}
                  onChange={(event) => onSearchChange(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {suggestedInterests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      className={`border px-4 py-2 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background text-foreground hover:border-foreground/60 hover:bg-secondary'
                      }`}
                      onClick={() => onToggleInterest(interest)}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {selectedInterests.length > 0 ? (
                  selectedInterests.map((interest) => (
                    <Badge key={interest} tone="accent">
                      {interest}
                    </Badge>
                  ))
                ) : (
                  <p className="m-0 text-sm text-muted-foreground">Choose a few cues or type free-form collector intent to shape the feed.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="surface-stat flex flex-col items-center justify-center p-5 text-center">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Live Feed</span>
              <span className="font-display mt-2 text-4xl font-semibold text-foreground">{discoveryCount}</span>
            </div>
            <div className="surface-stat flex flex-col items-center justify-center p-5 text-center">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Shortlist</span>
              <span className="font-display mt-2 text-4xl font-semibold text-foreground">{shortlistedArtworks.length}</span>
            </div>
            <div className="surface-stat flex flex-col items-center justify-center p-5 text-center">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Swiped</span>
              <span className="font-display mt-2 text-4xl font-semibold text-foreground">{swipedCount}</span>
            </div>
            <div className="surface-stat flex flex-col items-center justify-center p-5 text-center">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Available</span>
              <span className="font-display mt-2 text-4xl font-semibold text-foreground">{availableCount}</span>
            </div>
          </div>
        </div>
      </section>

      {dbReadError ? <AsyncStatusBanner message={dbReadError} /> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_24rem]">
        <section className="overflow-hidden border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                2. Swipe the image-led feed
              </span>
              <h3 className="mt-2 mb-0 font-display text-[2.2rem] leading-[0.94] tracking-[-0.03em] text-foreground">
                {currentArtwork ? 'Current artwork' : 'No works in the current feed'}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={saleTypeFilter}
                onChange={(event) => onSaleTypeChange(event.target.value as ArtworkSaleFilter)}
                className="w-auto min-w-40"
              >
                <option value="all">All sale types</option>
                <option value="fixed">Fixed price</option>
                <option value="auction">Auction</option>
              </Select>
              <Select
                value={priceFilter}
                onChange={(event) => onPriceFilterChange(event.target.value as ArtworkPriceFilter)}
                className="w-auto min-w-48"
              >
                <option value="all">All prices</option>
                <option value="low">Up to 10,000,000 VND</option>
                <option value="high">Above 10,000,000 VND</option>
              </Select>
              {activeFilters > 0 ? (
                <Button variant="ghost" onClick={onClearDiscovery}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>

          {currentArtwork ? (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)]">
              <div className="relative overflow-hidden rounded-lg bg-surface-muted">
                <img
                  src={currentArtwork.imageUrl}
                  alt={currentArtwork.title}
                  className="aspect-[4/5] h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-transparent" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <Badge tone="accent">{currentArtwork.saleType === 'auction' ? 'Auction' : 'Fixed Price'}</Badge>
                  {currentArtwork.style ? <Badge>{currentArtwork.style}</Badge> : null}
                  <Badge>{currentArtwork.city || currentArtwork.country || 'Vietnam'}</Badge>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-primary-foreground">
                  <div>
                    <p className="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/78">
                      {currentArtwork.artist}
                    </p>
                    <h4 className="mt-2 mb-0 font-display text-[2.4rem] leading-[0.92] tracking-[-0.04em] text-white">
                      {currentArtwork.title}
                    </h4>
                  </div>
                  <div className="border border-white/25 bg-black/25 px-4 py-2 text-right">
                    <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/70">
                      {currentArtwork.saleType === 'auction' ? 'Current bid' : 'Price'}
                    </span>
                    <strong className="font-display text-2xl text-white">
                      {formatCurrency(
                        currentArtwork.saleType === 'auction'
                          ? currentArtwork.currentBid || currentArtwork.price
                          : currentArtwork.price,
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <Card className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Collector read
                        </span>
                        <h4 className="mt-2 mb-0 font-display text-[2rem] leading-[0.95] tracking-[-0.03em] text-foreground">
                          {currentArtwork.title}
                        </h4>
                      </div>
                      {currentArtwork.saleType === 'auction' ? (
                        <Badge tone="warning">{currentArtwork.bidCount || 0} bids live</Badge>
                      ) : (
                        <Badge tone="success">Inquiry ready</Badge>
                      )}
                    </div>

                    <p className="m-0 text-base font-medium text-foreground">{currentArtwork.artist}</p>
                    <p className="m-0 text-sm leading-7 text-muted-foreground">
                      {currentArtwork.story || currentArtwork.description || 'Open details to review provenance, authenticity, and source context.'}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md border border-border bg-surface p-4">
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Medium</span>
                        <p className="mt-2 mb-0 text-sm text-foreground">{currentArtwork.medium || 'Unknown medium'}</p>
                      </div>
                      <div className="rounded-md border border-border bg-surface p-4">
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dimensions</span>
                        <p className="mt-2 mb-0 text-sm text-foreground">{currentArtwork.dimensions || 'Dimensions not listed'}</p>
                      </div>
                      <div className="rounded-md border border-border bg-surface p-4">
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Context</span>
                        <p className="mt-2 mb-0 text-sm text-foreground">
                          {[currentArtwork.yearCreated?.toString(), currentArtwork.style, currentArtwork.city || currentArtwork.country]
                            .filter(Boolean)
                            .join(' • ') || 'Collector context still building'}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-surface p-4">
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Feed fit</span>
                        <p className="mt-2 mb-0 text-sm text-foreground">
                          {selectedInterests.length > 0
                            ? `Aligned to ${selectedInterests.slice(0, 2).join(' and ')}.`
                            : 'Using open discovery because no interest chips are selected yet.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button variant="ghost" onClick={() => onPassArtwork(currentArtwork)}>
                        Pass
                      </Button>
                      <Button variant="primary" onClick={() => onShortlistArtwork(currentArtwork)}>
                        Interested
                      </Button>
                      <Button variant="outline" onClick={() => onOpenArtwork(currentArtwork)}>
                        Open details
                      </Button>
                    </div>
                  </div>
                </Card>

                {nextArtwork ? (
                  <Card className="bg-surface p-4">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Up next
                    </span>
                    <div className="mt-3 flex gap-4">
                      <img
                        src={nextArtwork.imageUrl}
                        alt={nextArtwork.title}
                        className="h-24 w-20 rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <p className="m-0 text-sm font-medium text-foreground">{nextArtwork.artist}</p>
                        <h4 className="mt-1 mb-0 font-display text-[1.5rem] leading-[0.96] tracking-[-0.03em] text-foreground">
                          {nextArtwork.title}
                        </h4>
                        <p className="mt-2 mb-0 text-sm text-muted-foreground">
                          {[nextArtwork.style, nextArtwork.medium].filter(Boolean).join(' • ') || 'Open discovery'}
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyState
              title="You have reached the end of this discovery set"
              description="Reset the swipe stack to revisit works, or refine your collector interests to pull a new image-led feed."
              action={(
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="primary" onClick={onResetSwipes}>
                    Reset swipes
                  </Button>
                  <Button variant="outline" onClick={onClearDiscovery}>
                    Reset interests
                  </Button>
                </div>
              )}
            />
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <Card className="p-5">
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              3. Review and act
            </span>
            <h3 className="mt-3 mb-0 font-display text-[1.9rem] leading-[0.96] tracking-[-0.03em] text-foreground">
              Your shortlist is the decision room.
            </h3>
            <p className="mt-3 mb-0 text-sm leading-7 text-muted-foreground">
              Keep only the works you want to compare. Use the review tab to check price, story, provenance, and next action.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-surface p-4">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Auction</span>
                <strong className="mt-2 block font-display text-3xl text-foreground">{shortlistedAuctionCount}</strong>
              </div>
              <div className="rounded-md border border-border bg-surface p-4">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Fixed</span>
                <strong className="mt-2 block font-display text-3xl text-foreground">{shortlistedFixedCount}</strong>
              </div>
            </div>

            <Button className="mt-5 w-full" variant="primary" onClick={onOpenShortlist}>
              Review shortlist
            </Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Shortlisted now
              </span>
              <Badge tone="accent">{shortlistedArtworks.length}</Badge>
            </div>

            {shortlistedArtworks.length > 0 ? (
              <div className="mt-4 flex flex-col gap-3">
                {shortlistedArtworks.slice(0, 3).map((artwork) => (
                  <button
                    key={artwork.id}
                    type="button"
                    className="flex items-center gap-3 rounded-md border border-border bg-surface p-3 text-left transition-colors hover:border-foreground"
                    onClick={() => onOpenArtwork(artwork)}
                  >
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="h-20 w-16 rounded-sm object-cover"
                    />
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-medium text-foreground">{artwork.artist}</p>
                      <h4 className="mt-1 mb-0 font-display text-[1.25rem] leading-[0.96] tracking-[-0.03em] text-foreground">
                        {artwork.title}
                      </h4>
                      <p className="mt-2 mb-0 text-sm text-muted-foreground">
                        {artwork.saleType === 'auction' ? 'Ready to bid' : 'Ready to auto inquire'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 mb-0 text-sm leading-7 text-muted-foreground">
                Swipe right on works that deserve a second look. They will land here immediately.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
};
