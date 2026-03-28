import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import { toIsoDate, toSlug } from './shared';

export const mapEvent = (row: Record<string, any>): ArtEvent => ({
  id: String(row.id),
  slug: row.slug || toSlug(row.title || row.name_en || row.name_vie || 'untitled-event'),
  title: row.title || row.name_en || row.name_vie || 'Untitled Event',
  name_vie: row.name_vie,
  name_en: row.name_en,
  organizer: row.organizer || row.gallery || 'Gallery',
  description_vie: row.description_vie,
  description_en: row.description_en,
  art_medium_vie: row.art_medium_vie,
  art_medium_en: row.art_medium_en,
  event_type_vie: row.event_type_vie,
  event_type_en: row.event_type_en,
  place_type_vie: row.place_type_vie,
  place_type_en: row.place_type_en,
  startDate: toIsoDate(row.startDate || row.start_date || row.start_at),
  endDate: toIsoDate(row.endDate || row.end_date || row.end_at),
  location: row.location || row.district || row.city || row.address || 'Vietnam',
  city: row.city,
  city_vie: row.city_vie,
  city_en: row.city_en,
  district: row.district,
  district_vie: row.district_vie,
  district_en: row.district_en,
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
  address_vie: row.address_vie,
  address_en: row.address_en,
  google_map_link: row.google_map_link,
  moderation_status: row.moderation_status || row.moderation,
  featured: row.featured,
  submitter_name: row.submitter_name,
  submitter_email: row.submitter_email,
  submitter_organization: row.submitter_organization,
  gallery_contact: row.gallery_contact,
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
    title: String(row.title ?? row.title_en ?? row.title_vie ?? 'Untitled Artwork'),
    title_vie: row.title_vie,
    title_en: row.title_en,
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
    medium: String(row.medium ?? row.medium_en ?? row.medium_vie ?? 'Mixed Media'),
    medium_vie: row.medium_vie,
    medium_en: row.medium_en,
    dimensions: String(row.dimensions ?? 'N/A'),
    description: String(row.description ?? row.description_en ?? row.description_vie ?? ''),
    description_vie: row.description_vie,
    description_en: row.description_en,
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
    style: row.style || row.style_en || row.style_vie || row.art_form,
    style_vie: row.style_vie,
    style_en: row.style_en,
    city: row.city || row.city_en || row.city_vie || row.location_city,
    city_vie: row.city_vie,
    city_en: row.city_en,
    country: row.country || row.country_en || row.country_vie || 'Vietnam',
    country_vie: row.country_vie,
    country_en: row.country_en,
    provenance: row.provenance || row.provenance_en || row.provenance_vie,
    provenance_vie: row.provenance_vie,
    provenance_en: row.provenance_en,
    authenticity: row.authenticity || row.authenticity_en || row.authenticity_vie,
    authenticity_vie: row.authenticity_vie,
    authenticity_en: row.authenticity_en,
    conditionReport:
      row.conditionReport || row.condition_report || row.condition_report_en || row.condition_report_vie,
    conditionReport_vie: row.condition_report_vie,
    conditionReport_en: row.condition_report_en,
    story: row.story || row.story_en || row.story_vie,
    story_vie: row.story_vie,
    story_en: row.story_en,
    sourceUrl: row.sourceUrl || row.source_url,
    sourceItemUrl: row.sourceItemUrl || row.source_item_url,
    importedAt: row.importedAt || row.imported_at,
    imageGallery: gallery,
    moderation_status: row.moderation_status || row.moderation,
  };
};

export const buildEventPayloads = (event: Partial<ArtEvent>) => {
  const canonicalTitle = event.name_en || event.name_vie || event.title || 'event';
  const canonicalDescription = event.description_en || event.description_vie || event.description || '';
  const slug = `${toSlug(canonicalTitle)}-${Date.now()}`;
  return [
    {
      title: canonicalTitle,
      slug,
      name_vie: event.name_vie,
      name_en: event.name_en,
      organizer: event.organizer,
      description: canonicalDescription,
      description_vie: event.description_vie,
      description_en: event.description_en,
      category: event.category || 'exhibition',
      moderation: event.moderation_status || 'approved',
      moderation_status: event.moderation_status || 'approved',
      status: 'published',
      start_at: event.startDate,
      end_at: event.endDate,
      city: event.city_en || event.city || event.location,
      city_vie: event.city_vie,
      city_en: event.city_en,
      district: event.district,
      district_vie: event.district_vie,
      district_en: event.district_en,
      location: event.address_en || event.address || event.location,
      location_name: event.address_en || event.address || event.location,
      address_vie: event.address_vie,
      address_en: event.address_en,
      lat: event.lat,
      lng: event.lng,
      cover_image_url: event.imageUrl,
      art_medium: event.art_medium,
      art_medium_vie: event.art_medium_vie,
      art_medium_en: event.art_medium_en,
      event_type: event.event_type,
      event_type_vie: event.event_type_vie,
      event_type_en: event.event_type_en,
      place_type: event.place_type,
      place_type_vie: event.place_type_vie,
      place_type_en: event.place_type_en,
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
      gallery_contact: event.gallery_contact,
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
      art_medium_vie: event.art_medium_vie,
      art_medium_en: event.art_medium_en,
      event_type_vie: event.event_type_vie,
      event_type_en: event.event_type_en,
      place_type_vie: event.place_type_vie,
      place_type_en: event.place_type_en,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      city: event.city,
      city_vie: event.city_vie,
      city_en: event.city_en,
      district: event.district,
      district_vie: event.district_vie,
      district_en: event.district_en,
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
      location_name: event.address,
      address_vie: event.address_vie,
      address_en: event.address_en,
      google_map_link: event.google_map_link,
      socialvideo_url: event.socialvideo_url,
      moderation_status: event.moderation_status,
      featured: event.featured,
      submitter_name: event.submitter_name,
      submitter_email: event.submitter_email,
      submitter_organization: event.submitter_organization,
      gallery_contact: event.gallery_contact,
      createdBy: event.createdBy,
    },
  ];
};

export const buildArtworkPayloads = (artwork: Partial<Artwork>) => {
  const canonicalTitle = artwork.title_en || artwork.title_vie || artwork.title || 'artwork';
  const canonicalDescription =
    artwork.description_en || artwork.description_vie || artwork.description || '';
  const slug = `${toSlug(canonicalTitle)}-${Date.now()}`;
  const isAuction = artwork.saleType === 'auction';
  const numericPrice = Number(artwork.price || 0);

  return [
    {
      title: canonicalTitle,
      title_vie: artwork.title_vie,
      title_en: artwork.title_en,
      slug,
      artist: artwork.artist,
      description: canonicalDescription,
      description_vie: artwork.description_vie,
      description_en: artwork.description_en,
      medium: artwork.medium_en || artwork.medium_vie || artwork.medium,
      medium_vie: artwork.medium_vie,
      medium_en: artwork.medium_en,
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
      style: artwork.style_en || artwork.style_vie || artwork.style || null,
      style_vie: artwork.style_vie || null,
      style_en: artwork.style_en || null,
      city: artwork.city_en || artwork.city || null,
      city_vie: artwork.city_vie || null,
      city_en: artwork.city_en || null,
      country: artwork.country_en || artwork.country || 'Vietnam',
      country_vie: artwork.country_vie || null,
      country_en: artwork.country_en || null,
      provenance: artwork.provenance_en || artwork.provenance || null,
      provenance_vie: artwork.provenance_vie || null,
      provenance_en: artwork.provenance_en || null,
      authenticity: artwork.authenticity_en || artwork.authenticity || null,
      authenticity_vie: artwork.authenticity_vie || null,
      authenticity_en: artwork.authenticity_en || null,
      condition_report: artwork.conditionReport_en || artwork.conditionReport || null,
      condition_report_vie: artwork.conditionReport_vie || null,
      condition_report_en: artwork.conditionReport_en || null,
      story: artwork.story_en || artwork.story || null,
      story_vie: artwork.story_vie || null,
      story_en: artwork.story_en || null,
      source_url: artwork.sourceUrl || null,
      source_item_url: artwork.sourceItemUrl || null,
      imported_at: artwork.importedAt || null,
    },
    {
      id: artwork.id,
      title: artwork.title,
      title_vie: artwork.title_vie,
      title_en: artwork.title_en,
      artist: artwork.artist,
      price: numericPrice,
      currentBid: artwork.currentBid,
      bidCount: artwork.bidCount,
      saleType: artwork.saleType || 'fixed',
      imageUrl: artwork.imageUrl,
      medium: artwork.medium,
      medium_vie: artwork.medium_vie,
      medium_en: artwork.medium_en,
      dimensions: artwork.dimensions,
      description: artwork.description,
      description_vie: artwork.description_vie,
      description_en: artwork.description_en,
      available: artwork.available ?? true,
      endTime: artwork.endTime,
      eventId: artwork.eventId,
      createdBy: artwork.createdBy,
      style: artwork.style,
      style_vie: artwork.style_vie,
      style_en: artwork.style_en,
      city: artwork.city,
      city_vie: artwork.city_vie,
      city_en: artwork.city_en,
      country: artwork.country,
      country_vie: artwork.country_vie,
      country_en: artwork.country_en,
      provenance: artwork.provenance,
      provenance_vie: artwork.provenance_vie,
      provenance_en: artwork.provenance_en,
      authenticity: artwork.authenticity,
      authenticity_vie: artwork.authenticity_vie,
      authenticity_en: artwork.authenticity_en,
      conditionReport: artwork.conditionReport,
      conditionReport_vie: artwork.conditionReport_vie,
      conditionReport_en: artwork.conditionReport_en,
      story: artwork.story,
      story_vie: artwork.story_vie,
      story_en: artwork.story_en,
      moderation_status: artwork.moderation_status,
    },
  ];
};
