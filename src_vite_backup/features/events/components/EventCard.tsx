import { useMemo, useState, type KeyboardEvent } from 'react';
import { Badge, Button, Card } from '@ui/index';
import { formatDateRange } from '@lib/date';
import type { ArtEvent } from '../types/event.types';

interface EventCardProps {
  event: ArtEvent;
  isSaved?: boolean;
  onOpen?: () => void;
  onToggleSave?: () => void;
}

const fallbackImage = 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200';

export const EventCard = ({ event, isSaved = false, onOpen, onToggleSave }: EventCardProps) => {
  const imageCandidates = useMemo(() => {
    const mediaImages = (event.media || [])
      .filter((item) => item.type === 'image' && item.url)
      .map((item) => item.url);
    return Array.from(new Set([event.imageUrl, ...mediaImages, fallbackImage].filter(Boolean)));
  }, [event.imageUrl, event.media]);

  const [imageIndex, setImageIndex] = useState(0);
  const activeImage = imageCandidates[imageIndex] || fallbackImage;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen?.();
    }
  };

  return (
    <Card className="event-card">
      <div
        role="button"
        tabIndex={0}
        className="event-card__surface"
        onClick={onOpen}
        onKeyDown={handleKeyDown}
      >
        <div className="event-card__image-wrap">
          <img
            src={activeImage}
            alt={event.title}
            className="event-card__image"
            loading="lazy"
            onError={() => {
              if (imageIndex < imageCandidates.length - 1) {
                setImageIndex((value) => value + 1);
              }
            }}
          />
          <div className="event-card__overlay" />
          <Badge tone="accent" className="event-card__badge">
            {event.event_type || event.category}
          </Badge>
          {onToggleSave ? (
            <button
              type="button"
              className={`event-card__save ${isSaved ? 'event-card__save--active' : ''}`}
              onClick={(eventTarget) => {
                eventTarget.stopPropagation();
                onToggleSave();
              }}
              aria-label={isSaved ? 'Remove from route' : 'Save to route'}
            >
              ♥
            </button>
          ) : null}
        </div>
        <div className="event-card__body">
          <div className="event-card__meta">
            <span>{event.city || event.location}</span>
            <span>{formatDateRange(event.startDate, event.endDate)}</span>
          </div>
          <h3>{event.name_vie || event.name_en || event.title}</h3>
          <p className="event-card__organizer">{event.organizer}</p>
          <p className="muted-text line-clamp-3">
            {event.description || 'No description available yet. Open event for source details.'}
          </p>
          <div className="event-card__footer">
            <div className="event-card__flags">
              {event.is_free ? <Badge tone="success">Free</Badge> : null}
              {event.is_virtual ? <Badge>Virtual</Badge> : null}
            </div>
            <span className="event-card__link">View details</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
