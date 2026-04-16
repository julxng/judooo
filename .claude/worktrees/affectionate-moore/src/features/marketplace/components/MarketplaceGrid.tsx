import { Grid } from '@/components/layout/Grid';
import { EmptyState } from '@/components/shared/EmptyState';
import type { Artwork } from '../types/artwork.types';
import { ArtworkCard } from './ArtworkCard';

interface MarketplaceGridProps {
  artworks: Artwork[];
  onOpenArtwork: (artwork: Artwork) => void;
  onActionArtwork: (artwork: Artwork) => void;
}

export const MarketplaceGrid = ({
  artworks,
  onOpenArtwork,
  onActionArtwork,
}: MarketplaceGridProps) => {
  if (artworks.length === 0) {
    return (
      <EmptyState
        title="No artworks found"
        description="Try clearing the active sale or price filters."
      />
    );
  }

  return (
    <Grid min={280} gap={28}>
      {artworks.map((artwork) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          onOpen={onOpenArtwork}
          onAction={onActionArtwork}
        />
      ))}
    </Grid>
  );
};
