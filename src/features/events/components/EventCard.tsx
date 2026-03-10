import { useMemo, useState, type KeyboardEvent } from 'react';
import { useLanguage } from '@/app/providers';
import { Badge, Card } from '@/components/ui';
import { formatDateRange } from '@/lib/date';
import type { ArtEvent } from '../types/event.types';

interface EventCardProps {
  event: ArtEvent;
  isSaved?: boolean;
  onOpen?: () => void;
  onToggleSave?: () => void;
}

const fallbackImage = 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200';

const eventCardCopy = {
  en: {
    removeFromRoute: 'Remove from route',
    saveToRoute: 'Save to route',
    emptyDescription: 'No description available yet. Open event for source details.',
    free: 'Free',
    virtual: 'Virtual',
    viewEvent: 'View event',
    dateLocale: 'en-US',
  },
  vi: {
    removeFromRoute: 'Bo khoi lo trinh',
    saveToRoute: 'Luu vao lo trinh',
    emptyDescription: 'Chua co mo ta. Mo su kien de xem them thong tin.',
    free: 'Mien phi',
    virtual: 'Truc tuyen',
    viewEvent: 'Xem su kien',
    dateLocale: 'vi-VN',
  },
} as const;

export const EventCard = ({ event, isSaved = false, onOpen, onToggleSave }: EventCardProps) => {
  const { language } = useLanguage();
  const copy = eventCardCopy[language];
  const imageCandidates = useMemo(() => {
    const mediaImages = (event.media || [])
      .filter((item) => item.type === 'image' && item.url)
      .map((item) => item.url);
    return Array.from(new Set([event.imageUrl, ...mediaImages, fallbackImage].filter(Boolean)));
  }, [event.imageUrl, event.media]);
  const eventTitle =
    language === 'vi'
      ? event.name_vie || event.name_en || event.title
      : event.name_en || event.name_vie || event.title;
  const eventDescription =
    language === 'vi'
      ? event.description_vie || event.description_en || event.description
      : event.description_en || event.description_vie || event.description;

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
            alt={eventTitle}
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
              aria-label={isSaved ? copy.removeFromRoute : copy.saveToRoute}
            >
              ♥
            </button>
          ) : null}
        </div>
        <div className="event-card__body">
          <div className="event-card__meta">
            <span>{event.city || event.location}</span>
            <span>{formatDateRange(event.startDate, event.endDate, copy.dateLocale)}</span>
          </div>
          <h3>{eventTitle}</h3>
          <p className="event-card__organizer">{event.organizer}</p>
          <p className="muted-text line-clamp-3">
            {eventDescription || copy.emptyDescription}
          </p>
          <div className="event-card__footer">
            <div className="event-card__flags">
              {event.is_free ? <Badge tone="success">{copy.free}</Badge> : null}
              {event.is_virtual ? <Badge>{copy.virtual}</Badge> : null}
            </div>
            <span className="event-card__link">{copy.viewEvent}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
