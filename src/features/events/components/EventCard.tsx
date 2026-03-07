import { useMemo, useState } from 'react';
import { Badge } from '@ui/index';
import {
  MediaCard,
  MediaCardMeta,
  MediaCardTitle,
  MediaCardSubtitle,
  MediaCardFooter,
  MediaCardLink,
  MediaCardFlags,
} from '@components/shared/MediaCard';
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

  return (
    <MediaCard
      imageUrl={activeImage}
      imageAlt={event.title}
      aspectRatio="4/3"
      badge={{ label: event.event_type || event.category, tone: 'accent' }}
      overlay
      onSave={onToggleSave}
      isSaved={isSaved}
      onClick={onOpen}
      onImageError={() => {
        if (imageIndex < imageCandidates.length - 1) {
          setImageIndex((value) => value + 1);
        }
      }}
      className="event-card"
    >
      <MediaCardMeta>
        <span>{event.city || event.location}</span>
        <span>{formatDateRange(event.startDate, event.endDate)}</span>
      </MediaCardMeta>
      <MediaCardTitle>{event.name_vie || event.name_en || event.title}</MediaCardTitle>
      <MediaCardSubtitle>{event.organizer}</MediaCardSubtitle>
      <p className="muted-text line-clamp-3">
        {event.description || 'No description available yet. Open event for source details.'}
      </p>
      <MediaCardFooter>
        <MediaCardFlags>
          {event.is_free ? <Badge tone="success">Free</Badge> : null}
          {event.is_virtual ? <Badge>Virtual</Badge> : null}
        </MediaCardFlags>
        <MediaCardLink>View details</MediaCardLink>
      </MediaCardFooter>
    </MediaCard>
  );
};
