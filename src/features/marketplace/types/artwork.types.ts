export type SaleType = 'fixed' | 'auction';
export type ArtworkModerationStatus = 'pending' | 'approved' | 'rejected';

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
  moderation_status?: ArtworkModerationStatus;
}

export type ArtworkPriceFilter = 'all' | 'high' | 'low';
export type ArtworkSaleFilter = SaleType | 'all';
