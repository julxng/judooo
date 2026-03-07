import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Modal } from '@ui/index';
import { Grid } from '@components/layout/Grid';
import { Stack } from '@components/layout/Stack';
import {
  DetailLayout,
  DetailPanel,
  DetailPanelTitle,
  DetailPanelActions,
  DetailCopy,
  DetailMediaStripItem,
} from '@components/layout/DetailLayout';
import { formatCurrency } from '@lib/format';
import type { Artwork } from '../types/artwork.types';

interface ArtworkDetailModalProps {
  artwork: Artwork;
  onClose: () => void;
  onAction: (artwork: Artwork) => void;
}

export const ArtworkDetailModal = ({ artwork, onClose, onAction }: ArtworkDetailModalProps) => {
  const gallery = useMemo(() => {
    const base = artwork.imageGallery && artwork.imageGallery.length ? artwork.imageGallery : [artwork.imageUrl];
    return Array.from(new Set(base.filter(Boolean)));
  }, [artwork.imageGallery, artwork.imageUrl]);
  const [activeImage, setActiveImage] = useState(gallery[0] || artwork.imageUrl);
  const isAuction = artwork.saleType === 'auction';

  useEffect(() => {
    setActiveImage(gallery[0] || artwork.imageUrl);
  }, [artwork.id, artwork.imageUrl, gallery]);

  return (
    <Modal title={artwork.title} onClose={onClose} size="xl">
      <DetailLayout
        sidebar={
          <Stack gap={12}>
            <Card className="detail-panel">
              <DetailPanelTitle>Artwork Info</DetailPanelTitle>
              <p className="muted-text">{artwork.artist}</p>
              <DetailPanelActions>
                {artwork.available ? (
                  <Button variant={isAuction ? 'primary' : 'secondary'} fullWidth onClick={() => onAction(artwork)}>
                    {isAuction ? 'Place Bid' : 'Inquire'}
                  </Button>
                ) : null}
                {artwork.sourceItemUrl ? (
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => window.open(artwork.sourceItemUrl, '_blank', 'noopener,noreferrer')}
                  >
                    Source
                  </Button>
                ) : null}
              </DetailPanelActions>
            </Card>
          </Stack>
        }
        media={
          <>
            <img src={activeImage} alt={artwork.title} className="detail-hero__media" />
            <div className="detail-hero__copy">
              <Badge tone="accent">{isAuction ? 'Auction Lot' : 'Fixed Price'}</Badge>
              <p className="muted-text">{artwork.artist}</p>
            </div>
          </>
        }
        mediaStrip={
          gallery.length > 1 ? (
            gallery.slice(0, 8).map((image) => (
              <DetailMediaStripItem
                key={image}
                isActive={activeImage === image}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt={artwork.title} />
              </DetailMediaStripItem>
            ))
          ) : undefined
        }
        content={
          <>
            <Grid columns={2} gap={12}>
              <Card className="detail-panel">
                <span className="media-card__label">{isAuction ? 'Current Bid' : 'Price'}</span>
                <strong>{formatCurrency(isAuction ? artwork.currentBid || artwork.price : artwork.price)}</strong>
              </Card>
              <Card className="detail-panel">
                <span className="media-card__label">Medium</span>
                <strong>{artwork.medium || 'N/A'}</strong>
              </Card>
              <Card className="detail-panel">
                <span className="media-card__label">Dimensions</span>
                <strong>{artwork.dimensions || 'N/A'}</strong>
              </Card>
              <Card className="detail-panel">
                <span className="media-card__label">Location</span>
                <strong>{[artwork.city, artwork.country].filter(Boolean).join(', ') || 'Vietnam'}</strong>
              </Card>
            </Grid>

            <DetailCopy>
              {artwork.description ? (
                <div>
                  <DetailPanelTitle>Description</DetailPanelTitle>
                  <p>{artwork.description}</p>
                </div>
              ) : null}
              {artwork.story ? (
                <div>
                  <DetailPanelTitle>Story</DetailPanelTitle>
                  <p>{artwork.story}</p>
                </div>
              ) : null}
              {artwork.provenance ? (
                <div>
                  <DetailPanelTitle>Provenance</DetailPanelTitle>
                  <p>{artwork.provenance}</p>
                </div>
              ) : null}
              {artwork.authenticity ? (
                <div>
                  <DetailPanelTitle>Authenticity</DetailPanelTitle>
                  <p>{artwork.authenticity}</p>
                </div>
              ) : null}
            </DetailCopy>
          </>
        }
      />
    </Modal>
  );
};
