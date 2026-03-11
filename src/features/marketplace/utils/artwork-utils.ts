import type { Locale } from '@/lib/i18n/translations';
import { getLocalizedValue } from '@/lib/i18n/content';
import type { Artwork } from '../types/artwork.types';

export const getArtworkTitle = (artwork: Artwork, language: Locale): string =>
  getLocalizedValue(language, artwork.title_vie, artwork.title_en, artwork.title);

export const getArtworkDescription = (artwork: Artwork, language: Locale): string =>
  getLocalizedValue(
    language,
    artwork.description_vie,
    artwork.description_en,
    artwork.description,
  );

export const getArtworkStory = (artwork: Artwork, language: Locale): string =>
  getLocalizedValue(language, artwork.story_vie, artwork.story_en, artwork.story);

export const getArtworkMedium = (artwork: Artwork, language: Locale): string =>
  getLocalizedValue(language, artwork.medium_vie, artwork.medium_en, artwork.medium);

export const getArtworkStyle = (artwork: Artwork, language: Locale): string =>
  getLocalizedValue(language, artwork.style_vie, artwork.style_en, artwork.style);

export const getArtworkCity = (artwork: Artwork, language: Locale): string =>
  getLocalizedValue(language, artwork.city_vie, artwork.city_en, artwork.city);

export const getArtworkCountry = (artwork: Artwork, language: Locale): string =>
  getLocalizedValue(language, artwork.country_vie, artwork.country_en, artwork.country);

export const getArtworkLocation = (artwork: Artwork, language: Locale): string =>
  [getArtworkCity(artwork, language), getArtworkCountry(artwork, language)]
    .filter(Boolean)
    .join(', ');

export const getArtworkProvenance = (artwork: Artwork, language: Locale): string =>
  getLocalizedValue(language, artwork.provenance_vie, artwork.provenance_en, artwork.provenance);

export const getArtworkAuthenticity = (artwork: Artwork, language: Locale): string =>
  getLocalizedValue(
    language,
    artwork.authenticity_vie,
    artwork.authenticity_en,
    artwork.authenticity,
  );

export const getArtworkConditionReport = (artwork: Artwork, language: Locale): string =>
  getLocalizedValue(
    language,
    artwork.conditionReport_vie,
    artwork.conditionReport_en,
    artwork.conditionReport,
  );
