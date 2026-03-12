'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '@/app/providers';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Grid } from '@/components/layout/Grid';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Artwork } from '../types/artwork.types';
import {
  getArtworkAuthenticity,
  getArtworkConditionReport,
  getArtworkDescription,
  getArtworkLocation,
  getArtworkMedium,
  getArtworkProvenance,
  getArtworkStory,
  getArtworkTitle,
} from '../utils/artwork-utils';

type ArtworkDrawerProps = {
  artwork: Artwork;
  artworks: Artwork[];
  onClose: () => void;
  onAction: (artwork: Artwork) => void;
  onNavigate: (artwork: Artwork) => void;
};

export const ArtworkDrawer = ({
  artwork,
  artworks,
  onClose,
  onAction,
  onNavigate,
}: ArtworkDrawerProps) => {
  const { language } = useLanguage();

  const gallery = useMemo(() => {
    const base =
      artwork.imageGallery && artwork.imageGallery.length
        ? artwork.imageGallery
        : [artwork.imageUrl];
    return Array.from(new Set(base.filter(Boolean)));
  }, [artwork.imageGallery, artwork.imageUrl]);

  const [activeImage, setActiveImage] = useState(gallery[0] || artwork.imageUrl);
  const isAuction = artwork.saleType === 'auction';

  const currentIndex = artworks.findIndex((a) => a.id === artwork.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < artworks.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(artworks[currentIndex - 1]);
  }, [hasPrev, currentIndex, artworks, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(artworks[currentIndex + 1]);
  }, [hasNext, currentIndex, artworks, onNavigate]);

  useEffect(() => {
    setActiveImage(gallery[0] || artwork.imageUrl);
  }, [artwork.id, artwork.imageUrl, gallery]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  const positionLabel =
    artworks.length > 0
      ? `${currentIndex + 1} / ${artworks.length}`
      : '';

  return (
    <div className="artwork-drawer">
      <button
        type="button"
        className="artwork-drawer__backdrop"
        onClick={onClose}
        aria-label="Close artwork detail"
      />

      <div className="artwork-drawer__panel" role="dialog" aria-modal="true" aria-label={getArtworkTitle(artwork, language)}>
        {/* Header */}
        <div className="artwork-drawer__header">
          <div className="artwork-drawer__nav">
            <button
              type="button"
              className={cn(
                'artwork-drawer__nav-btn',
                !hasPrev && 'artwork-drawer__nav-btn--disabled',
              )}
              onClick={goPrev}
              disabled={!hasPrev}
              aria-label="Previous artwork"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="artwork-drawer__position">{positionLabel}</span>
            <button
              type="button"
              className={cn(
                'artwork-drawer__nav-btn',
                !hasNext && 'artwork-drawer__nav-btn--disabled',
              )}
              onClick={goNext}
              disabled={!hasNext}
              aria-label="Next artwork"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            type="button"
            className="artwork-drawer__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="artwork-drawer__body">
          {/* Hero image */}
          <div className="artwork-drawer__hero">
            <img
              src={activeImage}
              alt={getArtworkTitle(artwork, language)}
            />
          </div>

          {/* Thumbnail strip */}
          {gallery.length > 1 ? (
            <div className="artwork-drawer__thumbs">
              {gallery.slice(0, 8).map((image) => (
                <button
                  key={image}
                  type="button"
                  className={cn(
                    'artwork-drawer__thumb',
                    activeImage === image && 'artwork-drawer__thumb--active',
                  )}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt={getArtworkTitle(artwork, language)} />
                </button>
              ))}
            </div>
          ) : null}

          {/* Title + artist */}
          <div className="artwork-drawer__title-block">
            <Badge tone="accent">{isAuction ? 'Auction Lot' : 'Fixed Price'}</Badge>
            <h2 className="artwork-drawer__title">
              {getArtworkTitle(artwork, language)}
            </h2>
            <p className="artwork-drawer__artist">{artwork.artist}</p>
          </div>

          {/* Info cards */}
          <Grid columns={2} gap={12}>
            <Card className="detail-panel">
              <span className="artwork-card__label">
                {isAuction ? 'Current Bid' : 'Price'}
              </span>
              <strong>
                {formatCurrency(
                  isAuction ? artwork.currentBid || artwork.price : artwork.price,
                )}
              </strong>
            </Card>
            <Card className="detail-panel">
              <span className="artwork-card__label">Medium</span>
              <strong>{getArtworkMedium(artwork, language) || 'N/A'}</strong>
            </Card>
            <Card className="detail-panel">
              <span className="artwork-card__label">Dimensions</span>
              <strong>{artwork.dimensions || 'N/A'}</strong>
            </Card>
            <Card className="detail-panel">
              <span className="artwork-card__label">Location</span>
              <strong>
                {getArtworkLocation(artwork, language) || 'Vietnam'}
              </strong>
            </Card>
          </Grid>

          {/* Copy sections */}
          <div className="detail-copy">
            {getArtworkDescription(artwork, language) ? (
              <div>
                <p className="eyebrow">Description</p>
                <p>{getArtworkDescription(artwork, language)}</p>
              </div>
            ) : null}
            {getArtworkStory(artwork, language) ? (
              <div>
                <p className="eyebrow">Story</p>
                <p>{getArtworkStory(artwork, language)}</p>
              </div>
            ) : null}
            {getArtworkProvenance(artwork, language) ? (
              <div>
                <p className="eyebrow">Provenance</p>
                <p>{getArtworkProvenance(artwork, language)}</p>
              </div>
            ) : null}
            {getArtworkAuthenticity(artwork, language) ? (
              <div>
                <p className="eyebrow">Authenticity</p>
                <p>{getArtworkAuthenticity(artwork, language)}</p>
              </div>
            ) : null}
            {getArtworkConditionReport(artwork, language) ? (
              <div>
                <p className="eyebrow">Condition</p>
                <p>{getArtworkConditionReport(artwork, language)}</p>
              </div>
            ) : null}
          </div>

          {/* Actions */}
          <div className="artwork-drawer__actions">
            {artwork.available ? (
              <Button
                variant={isAuction ? 'primary' : 'secondary'}
                className="w-full"
                onClick={() => onAction(artwork)}
              >
                {isAuction ? 'Place Bid' : 'Auto Inquire'}
              </Button>
            ) : null}
            {artwork.sourceItemUrl ? (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() =>
                  window.open(
                    artwork.sourceItemUrl,
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                View Source
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
