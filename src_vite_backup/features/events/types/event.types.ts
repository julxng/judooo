export interface EventMedia {
  type: 'image' | 'video';
  url: string;
}

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
  category: 'exhibition' | 'auction' | 'workshop';
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
}

export type EventCategory = ArtEvent['category'] | 'all';
export type EventTimeline = 'active' | 'past';
