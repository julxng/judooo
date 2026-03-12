'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
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
  const detailsRef = useRef<HTMLDivElement>(null);

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
    detailsRef.current?.scrollTo({ top: 0 });
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
    artworks.length > 0 ? `${currentIndex + 1} of ${artworks.length}` : '';

  const title = getArtworkTitle(artwork, language);
  const description = getArtworkDescription(artwork, language);
  const story = getArtworkStory(artwork, language);
  const provenance = getArtworkProvenance(artwork, language);
  const authenticity = getArtworkAuthenticity(artwork, language);
  const condition = getArtworkConditionReport(artwork, language);

  return (
    <div className="av" role="dialog" aria-modal="true" aria-label={title}>
      {/* Top bar */}
      <div className="av__topbar">
        <button type="button" className="av__back" onClick={onClose}>
          <ArrowLeft size={18} />
          <span>Back to collection</span>
        </button>

        <div className="av__nav">
          <button
            type="button"
            className={cn('av__nav-btn', !hasPrev && 'av__nav-btn--disabled')}
            onClick={goPrev}
            disabled={!hasPrev}
            aria-label="Previous artwork"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="av__position">{positionLabel}</span>
          <button
            type="button"
            className={cn('av__nav-btn', !hasNext && 'av__nav-btn--disabled')}
            onClick={goNext}
            disabled={!hasNext}
            aria-label="Next artwork"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button type="button" className="av__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      {/* Main: image stage + details sidebar */}
      <div className="av__main">
        {/* Image stage — dark bg, centered artwork */}
        <div className="av__stage">
          <img className="av__image" src={activeImage} alt={title} key={activeImage} />

          {gallery.length > 1 ? (
            <div className="av__thumbstrip">
              {gallery.slice(0, 8).map((image) => (
                <button
                  key={image}
                  type="button"
                  className={cn(
                    'av__thumb',
                    activeImage === image && 'av__thumb--active',
                  )}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt={title} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Details sidebar */}
        <div className="av__sidebar" ref={detailsRef}>
          <div className="av__sidebar-inner">
            {/* Badge + Title */}
            <div className="av__heading">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">
                  {isAuction ? 'Auction Lot' : 'Fixed Price'}
                </Badge>
                {!artwork.available ? <Badge tone="default">Collected</Badge> : null}
                {isAuction && artwork.bidCount ? (
                  <Badge>{artwork.bidCount} bids</Badge>
                ) : null}
              </div>
              <h2 className="av__title">{title}</h2>
              <p className="av__artist">{artwork.artist}</p>
            </div>

            {/* Price block */}
            <div className="av__price-block">
              <span className="av__price-label">
                {isAuction ? 'Current Bid' : 'Price'}
              </span>
              <span className="av__price">
                {formatCurrency(
                  isAuction ? artwork.currentBid || artwork.price : artwork.price,
                )}
              </span>
            </div>

            {/* Actions */}
            <div className="av__actions">
              {artwork.available ? (
                <Button
                  variant={isAuction ? 'primary' : 'default'}
                  className="w-full"
                  size="lg"
                  onClick={() => onAction(artwork)}
                >
                  {isAuction ? 'Place Bid' : 'Inquire About This Work'}
                </Button>
              ) : null}
              {artwork.sourceItemUrl ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    window.open(artwork.sourceItemUrl, '_blank', 'noopener,noreferrer')
                  }
                >
                  View Source
                  <ExternalLink size={14} />
                </Button>
              ) : null}
            </div>

            {/* Meta details list */}
            <div className="av__meta">
              <div className="av__meta-row">
                <span className="av__meta-label">Medium</span>
                <span className="av__meta-value">
                  {getArtworkMedium(artwork, language) || 'N/A'}
                </span>
              </div>
              <div className="av__meta-row">
                <span className="av__meta-label">Dimensions</span>
                <span className="av__meta-value">
                  {artwork.dimensions || 'Unknown'}
                </span>
              </div>
              <div className="av__meta-row">
                <span className="av__meta-label">Location</span>
                <span className="av__meta-value">
                  {getArtworkLocation(artwork, language) || 'Vietnam'}
                </span>
              </div>
              {artwork.yearCreated ? (
                <div className="av__meta-row">
                  <span className="av__meta-label">Year</span>
                  <span className="av__meta-value">{artwork.yearCreated}</span>
                </div>
              ) : null}
            </div>

            {/* Prose sections */}
            {description || story || provenance || authenticity || condition ? (
              <div className="av__prose">
                {description ? (
                  <div className="av__section">
                    <h3 className="av__section-label">Description</h3>
                    <p className="av__section-text">{description}</p>
                  </div>
                ) : null}
                {story ? (
                  <div className="av__section">
                    <h3 className="av__section-label">Story</h3>
                    <p className="av__section-text">{story}</p>
                  </div>
                ) : null}
                {provenance ? (
                  <div className="av__section">
                    <h3 className="av__section-label">Provenance</h3>
                    <p className="av__section-text">{provenance}</p>
                  </div>
                ) : null}
                {authenticity ? (
                  <div className="av__section">
                    <h3 className="av__section-label">Authenticity</h3>
                    <p className="av__section-text">{authenticity}</p>
                  </div>
                ) : null}
                {condition ? (
                  <div className="av__section">
                    <h3 className="av__section-label">Condition</h3>
                    <p className="av__section-text">{condition}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
