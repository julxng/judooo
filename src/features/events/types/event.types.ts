export interface EventMedia {
  type: 'image' | 'video';
  url: string;
}

export type EventModerationStatus = 'pending' | 'approved' | 'rejected';
export type EventCategory = 'exhibition' | 'auction' | 'workshop' | 'performance' | 'talk' | 'all';

export interface ArtEvent {
  id: string;
  title: string;
  name_vie?: string;
  name_en?: string;
  organizer: string;
  description_vie?: string;
  description_en?: string;
  startDate: string;
  endDate: string;
  location: string;
  city?: string;
  district?: string;
  lat: number;
  lng: number;
  imageUrl: string;
  media?: EventMedia[];
  description: string;
  category: Exclude<EventCategory, 'all'>;
  art_medium?: string;
  event_type?: string;
  place_type?: string;
  is_virtual?: boolean;
  is_free?: boolean;
  tags?: string[];
  price?: number;
  registration_required?: boolean;
  registration_link?: string;
  address?: string;
  google_map_link?: string;
  saved_count?: number;
  createdBy?: string;
  sourceUrl?: string;
  sourceItemUrl?: string;
  importedAt?: string;
  socialvideo_url?: string;
  moderation_status?: EventModerationStatus;
  featured?: boolean;
  submitter_name?: string;
  submitter_email?: string;
  submitter_organization?: string;
}

export type EventTimeline = 'active' | 'past' | 'all';
