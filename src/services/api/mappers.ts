import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import { toIsoDate, toSlug } from './shared';

export const mapEvent = (row: Record<string, any>): ArtEvent => ({
  id: String(row.id),
  title: row.title || row.name_en || row.name_vie || 'Untitled Event',
  name_vie: row.name_vie,
  name_en: row.name_en,
  organizer: row.organizer || row.gallery || 'Gallery',
  description_vie: row.description_vie,
  description_en: row.description_en,
  startDate: toIsoDate(row.startDate || row.start_date || row.start_at),
  endDate: toIsoDate(row.endDate || row.end_date || row.end_at),
  location: row.location || row.district || row.city || row.address || 'Vietnam',
  city: row.city,
  district: row.district,
  lat: Number(row.lat ?? 10.7769),
  lng: Number(row.lng ?? 106.7009),
  imageUrl:
    row.imageUrl ||
    row.image_url ||
    row.cover_image_url ||
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200',
  media: Array.isArray(row.media) ? row.media : [],
  description: row.description || row.description_vie || '',
  category: row.category || 'exhibition',
  createdBy: row.createdBy || row.created_by,
  sourceUrl: row.sourceUrl || row.source_url,
  sourceItemUrl: row.sourceItemUrl || row.source_item_url || row.item_url,
  importedAt: row.importedAt || row.imported_at,
  socialvideo_url: row.socialvideo_url,
  art_medium: row.art_medium,
  event_type: row.event_type,
  place_type: row.place_type,
  is_virtual: row.is_virtual,
  is_free: row.is_free,
  tags: row.tags,
  price: row.price,
  registration_required: row.registration_required,
  registration_link: row.registration_link,
  address: row.address,
  google_map_link: row.google_map_link,
  moderation_status: row.moderation_status || row.moderation,
  featured: row.featured,
  submitter_name: row.submitter_name,
  submitter_email: row.submitter_email,
  submitter_organization: row.submitter_organization,
});

export const mapArtwork = (row: Record<string, any>): Artwork => {
  const availability = row.availability || (row.available ? 'active' : 'sold');
  const gallery = Array.isArray(row.image_urls)
    ? row.image_urls
    : Array.isArray(row.imageGallery)
      ? row.imageGallery
      : row.image_url
        ? [row.image_url]
        : row.imageUrl
          ? [row.imageUrl]
          : [];

  return {
    id: String(row.id),
    title: String(row.title ?? 'Untitled Artwork'),
    artist: String(row.artist ?? row.artist_name ?? row.artistName ?? 'Unknown Artist'),
    price: Number(row.price || 0),
    currentBid:
      row.currentBid != null
        ? Number(row.currentBid)
        : row.current_bid != null
          ? Number(row.current_bid)
          : undefined,
    bidCount:
      row.bidCount != null
        ? Number(row.bidCount)
        : row.bid_count != null
          ? Number(row.bid_count)
          : undefined,
    saleType: String(row.saleType ?? row.sale_type ?? 'fixed') as Artwork['saleType'],
    imageUrl:
      String(
        row.imageUrl ??
          row.image_url ??
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1200',
      ),
    medium: String(row.medium ?? 'Mixed Media'),
    dimensions: String(row.dimensions ?? 'N/A'),
    description: String(row.description ?? ''),
    available:
      row.available != null ? Boolean(row.available) : availability === 'active' || availability === 'draft',
    endTime: row.endTime || row.bid_ends_at,
    createdBy: row.createdBy || row.created_by,
    eventId: row.eventId || row.event_id,
    yearCreated:
      row.yearCreated != null
        ? Number(row.yearCreated)
        : row.year_created != null
          ? Number(row.year_created)
          : undefined,
    style: row.style || row.art_form,
    city: row.city || row.location_city,
    country: row.country || 'Vietnam',
    provenance: row.provenance,
    authenticity: row.authenticity,
    conditionReport: row.conditionReport || row.condition_report,
    story: row.story,
    sourceUrl: row.sourceUrl || row.source_url,
    sourceItemUrl: row.sourceItemUrl || row.source_item_url,
    importedAt: row.importedAt || row.imported_at,
    imageGallery: gallery,
    moderation_status: row.moderation_status || row.moderation,
  };
};

export const buildEventPayloads = (event: Partial<ArtEvent>) => {
  const slug = `${toSlug(event.title || 'event')}-${Date.now()}`;
  return [
    {
      title: event.title,
      slug,
      name_vie: event.name_vie,
      name_en: event.name_en,
      organizer: event.organizer,
      description: event.description || '',
      description_vie: event.description_vie,
      description_en: event.description_en,
      category: event.category || 'exhibition',
      moderation: event.moderation_status || 'approved',
      moderation_status: event.moderation_status || 'approved',
      status: 'published',
      start_at: event.startDate,
      end_at: event.endDate,
      city: event.location,
      address: event.location,
      lat: event.lat,
      lng: event.lng,
      cover_image_url: event.imageUrl,
      art_medium: event.art_medium,
      event_type: event.event_type,
      place_type: event.place_type,
      is_virtual: event.is_virtual,
      is_free: event.is_free,
      tags: event.tags,
      price: event.price,
      registration_required: event.registration_required,
      registration_link: event.registration_link,
      google_map_link: event.google_map_link,
      socialvideo_url: event.socialvideo_url,
      featured: event.featured,
      submitter_name: event.submitter_name,
      submitter_email: event.submitter_email,
      submitter_organization: event.submitter_organization,
      created_by: event.createdBy,
    },
    {
      id: event.id,
      title: event.title,
      name_vie: event.name_vie,
      name_en: event.name_en,
      organizer: event.organizer,
      description_vie: event.description_vie,
      description_en: event.description_en,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      city: event.city,
      district: event.district,
      lat: event.lat,
      lng: event.lng,
      imageUrl: event.imageUrl,
      media: event.media || [],
      description: event.description,
      category: event.category || 'exhibition',
      art_medium: event.art_medium,
      event_type: event.event_type,
      place_type: event.place_type,
      is_virtual: event.is_virtual,
      is_free: event.is_free,
      tags: event.tags,
      price: event.price,
      registration_required: event.registration_required,
      registration_link: event.registration_link,
      address: event.address,
      google_map_link: event.google_map_link,
      socialvideo_url: event.socialvideo_url,
      moderation_status: event.moderation_status,
      featured: event.featured,
      submitter_name: event.submitter_name,
      submitter_email: event.submitter_email,
      submitter_organization: event.submitter_organization,
      createdBy: event.createdBy,
    },
  ];
};

export const buildArtworkPayloads = (artwork: Partial<Artwork>) => {
  const slug = `${toSlug(artwork.title || 'artwork')}-${Date.now()}`;
  const isAuction = artwork.saleType === 'auction';
  const numericPrice = Number(artwork.price || 0);

  return [
    {
      title: artwork.title,
      slug,
      artist: artwork.artist,
      description: artwork.description || '',
      medium: artwork.medium,
      dimensions: artwork.dimensions,
      image_url: artwork.imageUrl,
      image_urls:
        artwork.imageGallery && artwork.imageGallery.length
          ? artwork.imageGallery
          : [artwork.imageUrl].filter(Boolean),
      sale_type: artwork.saleType || 'fixed',
      price: isAuction ? null : numericPrice,
      starting_bid: isAuction ? numericPrice : null,
      current_bid: isAuction ? Number(artwork.currentBid || numericPrice) : null,
      bid_increment: isAuction ? 500000 : null,
      bid_ends_at: isAuction
        ? artwork.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      availability: artwork.available ? 'active' : 'sold',
      moderation: artwork.moderation_status || 'approved',
      moderation_status: artwork.moderation_status || 'approved',
      created_by: artwork.createdBy,
      event_id: artwork.eventId || null,
      year_created: artwork.yearCreated ?? null,
      style: artwork.style || null,
      city: artwork.city || null,
      country: artwork.country || 'Vietnam',
      provenance: artwork.provenance || null,
      authenticity: artwork.authenticity || null,
      condition_report: artwork.conditionReport || null,
      story: artwork.story || null,
      source_url: artwork.sourceUrl || null,
      source_item_url: artwork.sourceItemUrl || null,
      imported_at: artwork.importedAt || null,
    },
    {
      id: artwork.id,
      title: artwork.title,
      artist: artwork.artist,
      price: numericPrice,
      currentBid: artwork.currentBid,
      bidCount: artwork.bidCount,
      saleType: artwork.saleType || 'fixed',
      imageUrl: artwork.imageUrl,
      medium: artwork.medium,
      dimensions: artwork.dimensions,
      description: artwork.description,
      available: artwork.available ?? true,
      endTime: artwork.endTime,
      eventId: artwork.eventId,
      createdBy: artwork.createdBy,
      moderation_status: artwork.moderation_status,
    },
  ];
};
