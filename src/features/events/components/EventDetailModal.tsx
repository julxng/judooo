import { useEffect, useMemo, useState } from 'react';
import { Stack } from '@/components/layout/Stack';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { Badge, Button, Card, Modal } from '@/components/ui';
import { formatDateRange } from '@/lib/date';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import type { ArtEvent, EventMedia } from '../types/event.types';
import { useNotice } from '@/app/providers/NoticeProvider';

interface EventDetailModalProps {
  event: ArtEvent;
  linkedArtworks: Artwork[];
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onOpenArtwork: (artwork: Artwork) => void;
  onBidArtwork: (artwork: Artwork) => void;
}

const fallbackImage = 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1600';

export const EventDetailModal = ({
  event,
  linkedArtworks,
  isSaved,
  onClose,
  onToggleSave,
  onOpenArtwork,
  onBidArtwork,
}: EventDetailModalProps) => {
  const { notify } = useNotice();
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [event.id]);

  const mediaItems: EventMedia[] = useMemo(() => {
    const merged = [{ type: 'image' as const, url: event.imageUrl || fallbackImage }, ...(event.media || [])];
    const unique = merged.filter(
      (media, index, items) =>
        media.url && items.findIndex((candidate) => candidate.type === media.type && candidate.url === media.url) === index,
    );
    return unique.length ? unique : [{ type: 'image', url: fallbackImage }];
  }, [event.imageUrl, event.media]);

  const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0];

  const shareEvent = async () => {
    const shareData = {
      title: event.name_vie || event.name_en || event.title,
      text: event.description?.slice(0, 180) || 'Check this event on Judooo',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        //
      }
    }

    await navigator.clipboard.writeText(window.location.href);
    notify('Link copied to clipboard.', 'success');
  };

  return (
    <Modal title={event.name_vie || event.name_en || event.title} onClose={onClose} size="xl">
      <SidebarLayout
        sidebar={
          <Stack gap={12}>
            <Card className="detail-panel">
              <p className="eyebrow">Event Snapshot</p>
              <p>{formatDateRange(event.startDate, event.endDate)}</p>
              <p className="muted-text">{event.city || event.location}</p>
              <div className="detail-panel__actions">
                <Button variant="secondary" className="w-full" onClick={onToggleSave}>
                  {isSaved ? 'Remove from Route' : 'Save to Route'}
                </Button>
                <Button variant="ghost" className="w-full" onClick={shareEvent}>
                  Share
                </Button>
                {event.registration_link ? (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => window.open(event.registration_link, '_blank', 'noopener,noreferrer')}
                  >
                    Register Now
                  </Button>
                ) : null}
                {event.sourceItemUrl ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => window.open(event.sourceItemUrl, '_blank', 'noopener,noreferrer')}
                  >
                    Open Source
                  </Button>
                ) : null}
              </div>
            </Card>
          </Stack>
        }
      >
        <div className="detail-hero">
          {activeMedia.type === 'image' ? (
            <img src={activeMedia.url} alt={event.title} className="detail-hero__media" />
          ) : (
            <video src={activeMedia.url} controls className="detail-hero__media" />
          )}
          <div className="detail-hero__copy">
            <Badge tone="accent">{event.event_type || event.category}</Badge>
            <p className="muted-text">
              {formatDateRange(event.startDate, event.endDate)} • {event.city || event.location}
            </p>
            <p>{event.description_vie || event.description_en || event.description}</p>
          </div>
        </div>

        <div className="detail-media-strip">
          {mediaItems.map((media, index) => (
            <button
              key={`${media.url}-${index}`}
              type="button"
              className={`detail-media-strip__item ${index === activeMediaIndex ? 'detail-media-strip__item--active' : ''}`}
              onClick={() => setActiveMediaIndex(index)}
            >
              {media.type === 'image' ? (
                <img src={media.url} alt={event.title} />
              ) : (
                <span>Video</span>
              )}
            </button>
          ))}
        </div>

        <div className="detail-grid">
          <Card className="detail-panel">
            <p className="eyebrow">Details</p>
            <div className="detail-list">
              <div>
                <span>Date</span>
                <strong>{formatDateRange(event.startDate, event.endDate)}</strong>
              </div>
              <div>
                <span>Address</span>
                <strong>{event.address || event.location || 'Updating...'}</strong>
              </div>
              <div>
                <span>Price</span>
                <strong>{event.is_free ? 'Free' : event.price ? `${event.price.toLocaleString()} VND` : 'Contact organizer'}</strong>
              </div>
            </div>
            <div className="detail-chip-row">
              {[event.art_medium, event.event_type, event.place_type, ...(event.tags || [])]
                .filter(Boolean)
                .map((chip) => (
                  <Badge key={chip}>{chip}</Badge>
                ))}
            </div>
          </Card>

          {linkedArtworks.length > 0 ? (
            <Card className="detail-panel">
              <p className="eyebrow">Related Artworks</p>
              <div className="related-artworks">
                {linkedArtworks.map((artwork) => (
                  <button
                    key={artwork.id}
                    type="button"
                    className="related-artworks__item"
                    onClick={() => onOpenArtwork(artwork)}
                  >
                    <img src={artwork.imageUrl} alt={artwork.title} />
                    <div>
                      <strong>{artwork.title}</strong>
                      <span>{artwork.artist}</span>
                    </div>
                    {artwork.saleType === 'auction' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          onBidArtwork(artwork);
                        }}
                      >
                        Bid
                      </Button>
                    ) : null}
                  </button>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </SidebarLayout>
    </Modal>
  );
};
