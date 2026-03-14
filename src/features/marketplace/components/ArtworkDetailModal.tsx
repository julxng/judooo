import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/app/providers';
import { Badge, Button, Card, Modal } from '@/components/ui';
import { Lightbox } from '@/components/ui/Lightbox';
import { Grid } from '@/components/layout/Grid';
import { formatCurrency } from '@/lib/format';
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

interface ArtworkDetailModalProps {
  artwork: Artwork;
  onClose: () => void;
  onAction: (artwork: Artwork) => void;
}

export const ArtworkDetailModal = ({ artwork, onClose, onAction }: ArtworkDetailModalProps) => {
  const { language } = useLanguage();
  const gallery = useMemo(() => {
    const base = artwork.imageGallery && artwork.imageGallery.length ? artwork.imageGallery : [artwork.imageUrl];
    return Array.from(new Set(base.filter(Boolean)));
  }, [artwork.imageGallery, artwork.imageUrl]);
  const [activeImage, setActiveImage] = useState(gallery[0] || artwork.imageUrl);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isAuction = artwork.saleType === 'auction';

  useEffect(() => {
    setActiveImage(gallery[0] || artwork.imageUrl);
  }, [artwork.id, artwork.imageUrl, gallery]);

  const lightboxIndex = gallery.indexOf(activeImage);

  return (
    <>
    <Modal title={getArtworkTitle(artwork, language)} onClose={onClose} size="xl">
      <div className="artwork-detail">
        <div className="artwork-detail__gallery">
          <div className="artwork-detail__hero">
            <img
              src={activeImage}
              alt={getArtworkTitle(artwork, language)}
              onClick={() => setLightboxOpen(true)}
              className="cursor-zoom-in"
            />
          </div>
          {gallery.length > 1 ? (
            <Grid columns={4} gap={12}>
              {gallery.slice(0, 8).map((image) => (
                <button
                  key={image}
                  type="button"
                  className={`artwork-detail__thumb ${activeImage === image ? 'artwork-detail__thumb--active' : ''}`}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt={getArtworkTitle(artwork, language)} />
                </button>
              ))}
            </Grid>
          ) : null}
        </div>

        <div className="artwork-detail__content">
          <Badge tone="accent">{isAuction ? 'Auction Lot' : 'Fixed Price'}</Badge>
          <p className="muted-text">{artwork.artist}</p>

          <Grid columns={2} gap={12}>
            <Card className="detail-panel">
              <span className="artwork-card__label">{isAuction ? 'Current Bid' : 'Price'}</span>
              <strong>{formatCurrency(isAuction ? artwork.currentBid || artwork.price : artwork.price)}</strong>
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
              <strong>{getArtworkLocation(artwork, language) || 'Vietnam'}</strong>
            </Card>
          </Grid>

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

          <div className="detail-panel__actions">
            {artwork.available ? (
              <Button variant={isAuction ? 'primary' : 'secondary'} onClick={() => onAction(artwork)}>
                {isAuction ? 'Place Bid' : 'Auto Inquire'}
              </Button>
            ) : null}
            {artwork.sourceItemUrl ? (
              <Button
                variant="ghost"
                onClick={() => window.open(artwork.sourceItemUrl, '_blank', 'noopener,noreferrer')}
              >
                Source
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>

    {lightboxOpen ? (
      <Lightbox
        images={gallery}
        initialIndex={lightboxIndex >= 0 ? lightboxIndex : 0}
        onClose={() => setLightboxOpen(false)}
        alt={getArtworkTitle(artwork, language)}
      />
    ) : null}
    </>
  );
};
