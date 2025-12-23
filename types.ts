
export type TabType = 'events' | 'marketplace' | 'saved' | 'admin' | 'about';
export type UserRole = 'art_lover' | 'artist' | 'art_dealer' | 'gallery';
export type Language = 'vn' | 'en';

export interface EventMedia {
  type: 'image' | 'video';
  url: string;
}

export interface ArtEvent {
  id: string;
  title: string;
  organizer: string;
  startDate: string;
  endDate: string;
  location: string;
  lat: number;
  lng: number;
  imageUrl: string;
  media?: EventMedia[];
  description: string;
  category: 'exhibition' | 'auction' | 'workshop';
  createdBy?: string; 
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
