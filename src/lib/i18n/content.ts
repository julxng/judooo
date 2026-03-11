import type { ArtEvent } from '@/features/events/types/event.types';
import type { Artwork } from '@/features/marketplace/types/artwork.types';
import type { Locale } from './translations';

type DetectedContentLocale = Locale | 'unknown';

type TranslationRequest = {
  key: string;
  source: DetectedContentLocale;
  target: Locale;
  text: string;
};

type TranslationResponse = {
  key: string;
  text: string;
};

type BilingualTextInput = {
  value?: string | null;
  viValue?: string | null;
  enValue?: string | null;
};

const VIETNAMESE_CHAR_PATTERN =
  /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/;
const VIETNAMESE_ASCII_HINTS = [
  /\bnghe thuat\b/i,
  /\bsu kien\b/i,
  /\btac pham\b/i,
  /\bkham pha\b/i,
  /\bdang\b/i,
  /\btrien lam\b/i,
  /\blo trinh\b/i,
  /\blien he\b/i,
  /\bthanh pho\b/i,
  /\bviet nam\b/i,
  /\bco dinh\b/i,
  /\bdau gia\b/i,
];

const normalizeText = (value?: string | null): string => String(value || '').replace(/\s+/g, ' ').trim();

const hasVietnameseAccents = (value?: string | null): boolean =>
  VIETNAMESE_CHAR_PATTERN.test(normalizeText(value));

const looksLikeVietnamese = (value?: string | null): boolean => {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  if (hasVietnameseAccents(normalized)) return true;
  return VIETNAMESE_ASCII_HINTS.some((pattern) => pattern.test(normalized));
};

export const detectContentLocale = (value?: string | null): DetectedContentLocale => {
  const normalized = normalizeText(value);
  if (!normalized) return 'unknown';
  if (looksLikeVietnamese(normalized)) return 'vi';
  if (/[a-z]/i.test(normalized)) return 'en';
  return 'unknown';
};

export const getLocalizedValue = (
  language: Locale,
  viValue?: string | null,
  enValue?: string | null,
  fallbackValue?: string | null,
): string => {
  const fallback = normalizeText(fallbackValue);
  const vi = normalizeText(viValue);
  const en = normalizeText(enValue);

  if (language === 'vi') {
    return vi || en || fallback;
  }

  return en || vi || fallback;
};

const translateBatch = async (
  requests: TranslationRequest[],
): Promise<Map<string, string>> => {
  if (requests.length === 0) {
    return new Map();
  }

  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    throw new Error('Translation request failed.');
  }

  const payload = (await response.json()) as { translations?: TranslationResponse[] };
  return new Map((payload.translations || []).map((item) => [item.key, normalizeText(item.text)]));
};

const resolveBilingualText = async ({
  value,
  viValue,
  enValue,
}: BilingualTextInput): Promise<{ vi: string; en: string }> => {
  const normalizedValue = normalizeText(value);
  const normalizedVi = normalizeText(viValue);
  const normalizedEn = normalizeText(enValue);

  if (normalizedVi && normalizedEn && hasVietnameseAccents(normalizedVi)) {
    return { vi: normalizedVi, en: normalizedEn };
  }

  const sourceText = normalizedValue || normalizedEn || normalizedVi;
  if (!sourceText) {
    return { vi: '', en: '' };
  }

  const sourceLocale =
    normalizedValue
      ? detectContentLocale(normalizedValue)
      : normalizedEn && !normalizedVi
        ? 'en'
        : normalizedVi && !normalizedEn
          ? 'vi'
          : detectContentLocale(sourceText);

  const requests: TranslationRequest[] = [];
  const shouldTranslateEn = !normalizedEn;
  const shouldTranslateVi = !normalizedVi || !hasVietnameseAccents(normalizedVi);

  if (shouldTranslateEn) {
    requests.push({
      key: 'en',
      text: sourceText,
      source: sourceLocale,
      target: 'en',
    });
  }

  if (shouldTranslateVi) {
    requests.push({
      key: 'vi',
      text: normalizedEn || sourceText,
      source: normalizedEn ? 'en' : sourceLocale,
      target: 'vi',
    });
  }

  let translated = new Map<string, string>();
  if (requests.length > 0) {
    try {
      translated = await translateBatch(requests);
    } catch {
      translated = new Map();
    }
  }

  const en = normalizeText(normalizedEn || translated.get('en') || sourceText);
  const vi =
    normalizeText(normalizedVi && hasVietnameseAccents(normalizedVi) ? normalizedVi : translated.get('vi')) ||
    normalizeText(normalizedVi) ||
    en ||
    sourceText;

  return { vi, en };
};

export const enrichEventTranslations = async (
  event: Partial<ArtEvent>,
): Promise<Partial<ArtEvent>> => {
  const [
    title,
    description,
    artMedium,
    eventType,
    placeType,
    city,
    district,
    address,
  ] = await Promise.all([
    resolveBilingualText({
      value: event.title,
      viValue: event.name_vie,
      enValue: event.name_en,
    }),
    resolveBilingualText({
      value: event.description,
      viValue: event.description_vie,
      enValue: event.description_en,
    }),
    resolveBilingualText({
      value: event.art_medium,
      viValue: event.art_medium_vie,
      enValue: event.art_medium_en,
    }),
    resolveBilingualText({
      value: event.event_type,
      viValue: event.event_type_vie,
      enValue: event.event_type_en,
    }),
    resolveBilingualText({
      value: event.place_type,
      viValue: event.place_type_vie,
      enValue: event.place_type_en,
    }),
    resolveBilingualText({
      value: event.city,
      viValue: event.city_vie,
      enValue: event.city_en,
    }),
    resolveBilingualText({
      value: event.district,
      viValue: event.district_vie,
      enValue: event.district_en,
    }),
    resolveBilingualText({
      value: event.address || event.location,
      viValue: event.address_vie,
      enValue: event.address_en,
    }),
  ]);

  return {
    ...event,
    title: title.en || title.vi || event.title,
    name_vie: title.vi || event.name_vie,
    name_en: title.en || event.name_en,
    description: description.en || description.vi || event.description,
    description_vie: description.vi || event.description_vie,
    description_en: description.en || event.description_en,
    art_medium: artMedium.en || artMedium.vi || event.art_medium,
    art_medium_vie: artMedium.vi || event.art_medium_vie,
    art_medium_en: artMedium.en || event.art_medium_en,
    event_type: eventType.en || eventType.vi || event.event_type,
    event_type_vie: eventType.vi || event.event_type_vie,
    event_type_en: eventType.en || event.event_type_en,
    place_type: placeType.en || placeType.vi || event.place_type,
    place_type_vie: placeType.vi || event.place_type_vie,
    place_type_en: placeType.en || event.place_type_en,
    city: city.en || city.vi || event.city,
    city_vie: city.vi || event.city_vie,
    city_en: city.en || event.city_en,
    district: district.en || district.vi || event.district,
    district_vie: district.vi || event.district_vie,
    district_en: district.en || event.district_en,
    location: address.en || address.vi || event.location,
    address: address.en || address.vi || event.address,
    address_vie: address.vi || event.address_vie,
    address_en: address.en || event.address_en,
  };
};

export const enrichArtworkTranslations = async (
  artwork: Partial<Artwork>,
): Promise<Partial<Artwork>> => {
  const [
    title,
    medium,
    description,
    story,
    style,
    city,
    country,
    provenance,
    authenticity,
    conditionReport,
  ] = await Promise.all([
    resolveBilingualText({
      value: artwork.title,
      viValue: artwork.title_vie,
      enValue: artwork.title_en,
    }),
    resolveBilingualText({
      value: artwork.medium,
      viValue: artwork.medium_vie,
      enValue: artwork.medium_en,
    }),
    resolveBilingualText({
      value: artwork.description,
      viValue: artwork.description_vie,
      enValue: artwork.description_en,
    }),
    resolveBilingualText({
      value: artwork.story,
      viValue: artwork.story_vie,
      enValue: artwork.story_en,
    }),
    resolveBilingualText({
      value: artwork.style,
      viValue: artwork.style_vie,
      enValue: artwork.style_en,
    }),
    resolveBilingualText({
      value: artwork.city,
      viValue: artwork.city_vie,
      enValue: artwork.city_en,
    }),
    resolveBilingualText({
      value: artwork.country,
      viValue: artwork.country_vie,
      enValue: artwork.country_en,
    }),
    resolveBilingualText({
      value: artwork.provenance,
      viValue: artwork.provenance_vie,
      enValue: artwork.provenance_en,
    }),
    resolveBilingualText({
      value: artwork.authenticity,
      viValue: artwork.authenticity_vie,
      enValue: artwork.authenticity_en,
    }),
    resolveBilingualText({
      value: artwork.conditionReport,
      viValue: artwork.conditionReport_vie,
      enValue: artwork.conditionReport_en,
    }),
  ]);

  return {
    ...artwork,
    title: title.en || title.vi || artwork.title,
    title_vie: title.vi || artwork.title_vie,
    title_en: title.en || artwork.title_en,
    medium: medium.en || medium.vi || artwork.medium,
    medium_vie: medium.vi || artwork.medium_vie,
    medium_en: medium.en || artwork.medium_en,
    description: description.en || description.vi || artwork.description,
    description_vie: description.vi || artwork.description_vie,
    description_en: description.en || artwork.description_en,
    story: story.en || story.vi || artwork.story,
    story_vie: story.vi || artwork.story_vie,
    story_en: story.en || artwork.story_en,
    style: style.en || style.vi || artwork.style,
    style_vie: style.vi || artwork.style_vie,
    style_en: style.en || artwork.style_en,
    city: city.en || city.vi || artwork.city,
    city_vie: city.vi || artwork.city_vie,
    city_en: city.en || artwork.city_en,
    country: country.en || country.vi || artwork.country,
    country_vie: country.vi || artwork.country_vie,
    country_en: country.en || artwork.country_en,
    provenance: provenance.en || provenance.vi || artwork.provenance,
    provenance_vie: provenance.vi || artwork.provenance_vie,
    provenance_en: provenance.en || artwork.provenance_en,
    authenticity: authenticity.en || authenticity.vi || artwork.authenticity,
    authenticity_vie: authenticity.vi || artwork.authenticity_vie,
    authenticity_en: authenticity.en || artwork.authenticity_en,
    conditionReport: conditionReport.en || conditionReport.vi || artwork.conditionReport,
    conditionReport_vie: conditionReport.vi || artwork.conditionReport_vie,
    conditionReport_en: conditionReport.en || artwork.conditionReport_en,
  };
};
