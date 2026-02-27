
export type TabType = 'marketplace' | 'events' | 'saved' | 'admin' | 'about';
export type UserRole = 'art_lover' | 'artist' | 'art_dealer' | 'gallery';
export type Language = 'vn' | 'en';

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
  image_url?: string;
  socialvideo_url?: string;
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
  latitude?: number;
  longitude?: number;
  saved_count?: number;
  createdBy?: string;
  sourceUrl?: string;
  sourceItemUrl?: string;
  importedAt?: string;
}

export type EventFilterKey =
  | 'name'
  | 'description'
  | 'art_medium'
  | 'event_type'
  | 'place_type'
  | 'start_date'
  | 'end_date'
  | 'city'
  | 'district'
  | 'is_virtual'
  | 'is_free'
  | 'tags'
  | 'price'
  | 'registration_required'
  | 'search';

export interface FilterConfig {
  key: EventFilterKey;
  label: string;
  enabled: boolean;
}

export type SaleType = 'fixed' | 'auction';

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  price: number;
  currentBid?: number;
  bidCount?: number;
  saleType: SaleType;
  imageUrl: string;
  medium: string;
  dimensions: string;
  description: string;
  available: boolean;
  endTime?: string;
  createdBy?: string;
  eventId?: string;
  yearCreated?: number;
  style?: string;
  city?: string;
  country?: string;
  provenance?: string;
  authenticity?: string;
  conditionReport?: string;
  story?: string;
  sourceUrl?: string;
  sourceItemUrl?: string;
  importedAt?: string;
  imageGallery?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface OptimizationResult {
  orderedIds: string[];
  narrative: string;
}
