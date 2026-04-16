import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const VIETNAMESE_CHAR_PATTERN =
  /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/;
const VIETNAMESE_ASCII_HINTS = [
  /\bnghe thuat\b/i,
  /\bsu kien\b/i,
  /\btac pham\b/i,
  /\bkham pha\b/i,
  /\btrien lam\b/i,
  /\blo trinh\b/i,
  /\bviet nam\b/i,
];

const normalizeText = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();
const MAX_TRANSLATE_CHARS = 1800;
const ROW_CONCURRENCY = 4;
const translationCache = new Map();

const chunkText = (text) => {
  const normalized = normalizeText(text);
  if (!normalized || normalized.length <= MAX_TRANSLATE_CHARS) {
    return normalized ? [normalized] : [];
  }

  const segments = normalized.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let buffer = '';

  const pushSegment = (segment) => {
    const trimmed = normalizeText(segment);
    if (!trimmed) return;

    if (trimmed.length <= MAX_TRANSLATE_CHARS) {
      chunks.push(trimmed);
      return;
    }

    let start = 0;
    while (start < trimmed.length) {
      chunks.push(trimmed.slice(start, start + MAX_TRANSLATE_CHARS).trim());
      start += MAX_TRANSLATE_CHARS;
    }
  };

  for (const segment of segments) {
    const trimmed = normalizeText(segment);
    if (!trimmed) continue;

    const candidate = buffer ? `${buffer} ${trimmed}` : trimmed;
    if (candidate.length <= MAX_TRANSLATE_CHARS) {
      buffer = candidate;
      continue;
    }

    if (buffer) {
      pushSegment(buffer);
    }
    buffer = '';
    pushSegment(trimmed);
  }

  if (buffer) {
    pushSegment(buffer);
  }

  return chunks;
};

const hasVietnameseAccents = (value = '') => VIETNAMESE_CHAR_PATTERN.test(normalizeText(value));
const hasVietnameseContent = (value = '') => {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  return hasVietnameseAccents(normalized) || !/[a-z]/i.test(normalized);
};

const detectLocale = (value = '') => {
  const normalized = normalizeText(value);
  if (!normalized) return 'unknown';
  if (hasVietnameseAccents(normalized) || VIETNAMESE_ASCII_HINTS.some((pattern) => pattern.test(normalized))) {
    return 'vi';
  }
  if (/[a-z]/i.test(normalized)) return 'en';
  return 'unknown';
};

const needsBilingualValue = ({ value, viValue, enValue }) => {
  if (!normalizeText(value) && !normalizeText(viValue) && !normalizeText(enValue)) {
    return false;
  }

  return !normalizeText(enValue) || !hasVietnameseContent(viValue);
};

const processWithConcurrency = async (rows, worker) => {
  const pendingRows = [...rows];

  const runners = Array.from({ length: Math.min(ROW_CONCURRENCY, pendingRows.length) }, async () => {
    while (pendingRows.length > 0) {
      const row = pendingRows.shift();
      if (!row) break;
      await worker(row);
    }
  });

  await Promise.all(runners);
};

const translateText = async (text, source, target) => {
  const normalized = normalizeText(text);
  if (!normalized) return '';
  if (source === target) return normalized;
  const cacheKey = `${source}:${target}:${normalized}`;
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const translationPromise = (async () => {
  if (normalized.length > MAX_TRANSLATE_CHARS) {
      const translatedParts = [];
      for (const part of chunkText(normalized)) {
        translatedParts.push(await translateText(part, source, target));
      }
      return translatedParts.join(' ').trim();
    }

    const endpoint = new URL('https://translate.googleapis.com/translate_a/single');
    endpoint.searchParams.set('client', 'gtx');
    endpoint.searchParams.set('sl', source === 'unknown' ? 'auto' : source);
    endpoint.searchParams.set('tl', target);
    endpoint.searchParams.set('dt', 't');
    endpoint.searchParams.set('q', normalized);

    const response = await fetch(endpoint.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      return normalized;
    }

    const payload = await response.json();
    return Array.isArray(payload?.[0])
      ? payload[0]
          .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === 'string' ? chunk[0] : ''))
          .join('')
          .replace(/\s+/g, ' ')
          .trim()
      : normalized;
  })();

  translationCache.set(cacheKey, translationPromise);

  try {
    return await translationPromise;
  } catch (error) {
    translationCache.delete(cacheKey);
    throw error;
  }
};

const resolveBilingualText = async ({ value, viValue, enValue }) => {
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
      ? detectLocale(normalizedValue)
      : normalizedEn && !normalizedVi
        ? 'en'
        : normalizedVi && !normalizedEn
          ? 'vi'
          : detectLocale(sourceText);

  const en = normalizedEn || (await translateText(sourceText, sourceLocale, 'en'));
  const vi =
    (normalizedVi && hasVietnameseAccents(normalizedVi) ? normalizedVi : '') ||
    (await translateText(normalizedEn || sourceText, normalizedEn ? 'en' : sourceLocale, 'vi')) ||
    normalizedVi ||
    en;

  return {
    vi: normalizeText(vi),
    en: normalizeText(en),
  };
};

const backfillEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select(
      'id,title,name_vie,name_en,description,description_vie,description_en,art_medium,art_medium_vie,art_medium_en,event_type,event_type_vie,event_type_en,place_type,place_type_vie,place_type_en,city,city_vie,city_en,district,district_vie,district_en,location,address_vie,address_en',
    );

  if (error) throw error;

  const rowsToBackfill = (data || []).filter((row) =>
    [
      { value: row.title, viValue: row.name_vie, enValue: row.name_en },
      { value: row.description, viValue: row.description_vie, enValue: row.description_en },
      { value: row.art_medium, viValue: row.art_medium_vie, enValue: row.art_medium_en },
      { value: row.event_type, viValue: row.event_type_vie, enValue: row.event_type_en },
      { value: row.place_type, viValue: row.place_type_vie, enValue: row.place_type_en },
      { value: row.city, viValue: row.city_vie, enValue: row.city_en },
      { value: row.district, viValue: row.district_vie, enValue: row.district_en },
      { value: row.location, viValue: row.address_vie, enValue: row.address_en },
    ].some(needsBilingualValue),
  );

  console.log(`Backfilling ${rowsToBackfill.length} event rows...`);

  await processWithConcurrency(rowsToBackfill, async (row) => {
    const [title, description, artMedium, eventType, placeType, city, district, address] =
      await Promise.all([
        resolveBilingualText({ value: row.title, viValue: row.name_vie, enValue: row.name_en }),
        resolveBilingualText({
          value: row.description,
          viValue: row.description_vie,
          enValue: row.description_en,
        }),
        resolveBilingualText({
          value: row.art_medium,
          viValue: row.art_medium_vie,
          enValue: row.art_medium_en,
        }),
        resolveBilingualText({
          value: row.event_type,
          viValue: row.event_type_vie,
          enValue: row.event_type_en,
        }),
        resolveBilingualText({
          value: row.place_type,
          viValue: row.place_type_vie,
          enValue: row.place_type_en,
        }),
        resolveBilingualText({ value: row.city, viValue: row.city_vie, enValue: row.city_en }),
        resolveBilingualText({
          value: row.district,
          viValue: row.district_vie,
          enValue: row.district_en,
        }),
        resolveBilingualText({
          value: row.location,
          viValue: row.address_vie,
          enValue: row.address_en,
        }),
      ]);

    const payload = {
      title: title.en || row.title,
      name_vie: title.vi || null,
      name_en: title.en || null,
      description: description.en || row.description || null,
      description_vie: description.vi || null,
      description_en: description.en || null,
      art_medium: artMedium.en || row.art_medium || null,
      art_medium_vie: artMedium.vi || null,
      art_medium_en: artMedium.en || null,
      event_type: eventType.en || row.event_type || null,
      event_type_vie: eventType.vi || null,
      event_type_en: eventType.en || null,
      place_type: placeType.en || row.place_type || null,
      place_type_vie: placeType.vi || null,
      place_type_en: placeType.en || null,
      city: city.en || row.city || null,
      city_vie: city.vi || null,
      city_en: city.en || null,
      district: district.en || row.district || null,
      district_vie: district.vi || null,
      district_en: district.en || null,
      location: address.en || row.location || null,
      address_vie: address.vi || null,
      address_en: address.en || null,
    };

    const { error: updateError } = await supabase.from('events').update(payload).eq('id', row.id);
    if (updateError) throw updateError;
    console.log(`Backfilled event ${row.id}`);
  });
};

const backfillArtworks = async () => {
  const { data, error } = await supabase
    .from('artworks')
    .select(
      'id,title,title_vie,title_en,description,description_vie,description_en,medium,medium_vie,medium_en,style,style_vie,style_en,city,city_vie,city_en,country,country_vie,country_en,provenance,provenance_vie,provenance_en,authenticity,authenticity_vie,authenticity_en,condition_report,condition_report_vie,condition_report_en,story,story_vie,story_en',
    );

  if (error) throw error;

  const rowsToBackfill = (data || []).filter((row) =>
    [
      { value: row.title, viValue: row.title_vie, enValue: row.title_en },
      { value: row.description, viValue: row.description_vie, enValue: row.description_en },
      { value: row.medium, viValue: row.medium_vie, enValue: row.medium_en },
      { value: row.style, viValue: row.style_vie, enValue: row.style_en },
      { value: row.city, viValue: row.city_vie, enValue: row.city_en },
      { value: row.country, viValue: row.country_vie, enValue: row.country_en },
      { value: row.provenance, viValue: row.provenance_vie, enValue: row.provenance_en },
      { value: row.authenticity, viValue: row.authenticity_vie, enValue: row.authenticity_en },
      { value: row.condition_report, viValue: row.condition_report_vie, enValue: row.condition_report_en },
      { value: row.story, viValue: row.story_vie, enValue: row.story_en },
    ].some(needsBilingualValue),
  );

  console.log(`Backfilling ${rowsToBackfill.length} artwork rows...`);

  await processWithConcurrency(rowsToBackfill, async (row) => {
    const [title, description, medium, style, city, country, provenance, authenticity, conditionReport, story] =
      await Promise.all([
        resolveBilingualText({ value: row.title, viValue: row.title_vie, enValue: row.title_en }),
        resolveBilingualText({
          value: row.description,
          viValue: row.description_vie,
          enValue: row.description_en,
        }),
        resolveBilingualText({
          value: row.medium,
          viValue: row.medium_vie,
          enValue: row.medium_en,
        }),
        resolveBilingualText({
          value: row.style,
          viValue: row.style_vie,
          enValue: row.style_en,
        }),
        resolveBilingualText({ value: row.city, viValue: row.city_vie, enValue: row.city_en }),
        resolveBilingualText({
          value: row.country,
          viValue: row.country_vie,
          enValue: row.country_en,
        }),
        resolveBilingualText({
          value: row.provenance,
          viValue: row.provenance_vie,
          enValue: row.provenance_en,
        }),
        resolveBilingualText({
          value: row.authenticity,
          viValue: row.authenticity_vie,
          enValue: row.authenticity_en,
        }),
        resolveBilingualText({
          value: row.condition_report,
          viValue: row.condition_report_vie,
          enValue: row.condition_report_en,
        }),
        resolveBilingualText({ value: row.story, viValue: row.story_vie, enValue: row.story_en }),
      ]);

    const payload = {
      title: title.en || row.title,
      title_vie: title.vi || null,
      title_en: title.en || null,
      description: description.en || row.description || null,
      description_vie: description.vi || null,
      description_en: description.en || null,
      medium: medium.en || row.medium || null,
      medium_vie: medium.vi || null,
      medium_en: medium.en || null,
      style: style.en || row.style || null,
      style_vie: style.vi || null,
      style_en: style.en || null,
      city: city.en || row.city || null,
      city_vie: city.vi || null,
      city_en: city.en || null,
      country: country.en || row.country || null,
      country_vie: country.vi || null,
      country_en: country.en || null,
      provenance: provenance.en || row.provenance || null,
      provenance_vie: provenance.vi || null,
      provenance_en: provenance.en || null,
      authenticity: authenticity.en || row.authenticity || null,
      authenticity_vie: authenticity.vi || null,
      authenticity_en: authenticity.en || null,
      condition_report: conditionReport.en || row.condition_report || null,
      condition_report_vie: conditionReport.vi || null,
      condition_report_en: conditionReport.en || null,
      story: story.en || row.story || null,
      story_vie: story.vi || null,
      story_en: story.en || null,
    };

    const { error: updateError } = await supabase.from('artworks').update(payload).eq('id', row.id);
    if (updateError) throw updateError;
    console.log(`Backfilled artwork ${row.id}`);
  });
};

const main = async () => {
  await backfillEvents();
  await backfillArtworks();
  console.log('Bilingual backfill complete.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
