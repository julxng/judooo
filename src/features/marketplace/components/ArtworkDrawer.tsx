'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { useLanguage } from '@/app/providers';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Reset image + scroll when artwork changes
  useEffect(() => {
    setActiveImage(gallery[0] || artwork.imageUrl);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [artwork.id, artwork.imageUrl, gallery]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Keyboard nav
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
    artworks.length > 0 ? `${currentIndex + 1} / ${artworks.length}` : '';

  const title = getArtworkTitle(artwork, language);
  const description = getArtworkDescription(artwork, language);
  const story = getArtworkStory(artwork, language);
  const provenance = getArtworkProvenance(artwork, language);
  const authenticity = getArtworkAuthenticity(artwork, language);
  const condition = getArtworkConditionReport(artwork, language);

  return (
    <div className="artwork-drawer">
      <button
        type="button"
        className="artwork-drawer__backdrop"
        onClick={onClose}
        aria-label="Close artwork detail"
      />

      <div
        className="artwork-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header bar */}
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
              <ChevronLeft size={16} />
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
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            type="button"
            className="artwork-drawer__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Two-column scrollable body */}
        <div className="artwork-drawer__body" ref={scrollRef}>
          <div className="artwork-drawer__layout">
            {/* Left: gallery */}
            <div className="artwork-drawer__gallery">
              <div className="artwork-drawer__hero">
                <img src={activeImage} alt={title} />
              </div>

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
                      <img src={image} alt={title} />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Right: details */}
            <div className="artwork-drawer__details">
              {/* Title block */}
              <div className="artwork-drawer__title-block">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">
                    {isAuction ? 'Auction Lot' : 'Fixed Price'}
                  </Badge>
                  {!artwork.available ? <Badge tone="default">Collected</Badge> : null}
                </div>
                <h2 className="artwork-drawer__title">{title}</h2>
                <p className="artwork-drawer__artist">{artwork.artist}</p>
              </div>

              {/* Key facts */}
              <div className="artwork-drawer__facts">
                <div className="artwork-drawer__fact">
                  <span className="artwork-drawer__fact-label">
                    {isAuction ? 'Current Bid' : 'Price'}
                  </span>
                  <strong className="artwork-drawer__fact-value">
                    {formatCurrency(
                      isAuction
                        ? artwork.currentBid || artwork.price
                        : artwork.price,
                    )}
                  </strong>
                </div>
                <div className="artwork-drawer__fact">
                  <span className="artwork-drawer__fact-label">Medium</span>
                  <strong className="artwork-drawer__fact-value">
                    {getArtworkMedium(artwork, language) || 'N/A'}
                  </strong>
                </div>
                <div className="artwork-drawer__fact">
                  <span className="artwork-drawer__fact-label">Dimensions</span>
                  <strong className="artwork-drawer__fact-value">
                    {artwork.dimensions || 'Unknown'}
                  </strong>
                </div>
                <div className="artwork-drawer__fact">
                  <span className="artwork-drawer__fact-label">Location</span>
                  <strong className="artwork-drawer__fact-value">
                    {getArtworkLocation(artwork, language) || 'Vietnam'}
                  </strong>
                </div>
                {isAuction && artwork.bidCount ? (
                  <div className="artwork-drawer__fact">
                    <span className="artwork-drawer__fact-label">Bids</span>
                    <strong className="artwork-drawer__fact-value">
                      {artwork.bidCount}
                    </strong>
                  </div>
                ) : null}
                {artwork.yearCreated ? (
                  <div className="artwork-drawer__fact">
                    <span className="artwork-drawer__fact-label">Year</span>
                    <strong className="artwork-drawer__fact-value">
                      {artwork.yearCreated}
                    </strong>
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="artwork-drawer__actions">
                {artwork.available ? (
                  <Button
                    variant={isAuction ? 'primary' : 'default'}
                    className="w-full"
                    onClick={() => onAction(artwork)}
                  >
                    {isAuction ? 'Place Bid' : 'Inquire'}
                  </Button>
                ) : null}
                {artwork.sourceItemUrl ? (
                  <Button
                    variant="outline"
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
                    <ExternalLink size={14} />
                  </Button>
                ) : null}
              </div>

              {/* Prose sections */}
              <div className="artwork-drawer__prose">
                {description ? (
                  <div className="artwork-drawer__section">
                    <h3 className="artwork-drawer__section-label">Description</h3>
                    <p>{description}</p>
                  </div>
                ) : null}
                {story ? (
                  <div className="artwork-drawer__section">
                    <h3 className="artwork-drawer__section-label">Story</h3>
                    <p>{story}</p>
                  </div>
                ) : null}
                {provenance ? (
                  <div className="artwork-drawer__section">
                    <h3 className="artwork-drawer__section-label">Provenance</h3>
                    <p>{provenance}</p>
                  </div>
                ) : null}
                {authenticity ? (
                  <div className="artwork-drawer__section">
                    <h3 className="artwork-drawer__section-label">Authenticity</h3>
                    <p>{authenticity}</p>
                  </div>
                ) : null}
                {condition ? (
                  <div className="artwork-drawer__section">
                    <h3 className="artwork-drawer__section-label">Condition</h3>
                    <p>{condition}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
