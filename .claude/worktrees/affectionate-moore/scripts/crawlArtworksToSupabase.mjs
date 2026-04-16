import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (recommended).');
  process.exit(1);
}

const ARTWORK_LIMIT = Number(process.env.CRAWL_ARTWORK_LIMIT || 0);
const DEFAULT_PRICE_MIN = Number(process.env.CRAWL_ARTWORK_PRICE_MIN || 6000000);
const DEFAULT_PRICE_MAX = Number(process.env.CRAWL_ARTWORK_PRICE_MAX || 30000000);
const WIKIDATA_RETRIES = Number(process.env.CRAWL_WIKIDATA_RETRIES || 4);
const NGUYEN_COLLECTION_URL =
  process.env.CRAWL_NGUYEN_COLLECTION_URL || 'https://nguyenartfoundation.com/vn/collection/suu-tap/';
const NGUYEN_ARTWORKS_API =
  process.env.CRAWL_NGUYEN_ARTWORKS_API || 'https://nguyenartfoundation.com/wp-json/wp/v2/artwork';
const NGUYEN_MAX_PAGES = Number(process.env.CRAWL_NGUYEN_MAX_PAGES || 40);
const NGUYEN_PER_PAGE = Math.min(100, Number(process.env.CRAWL_NGUYEN_PER_PAGE || 100));
const WEB_QUERIES = (process.env.CRAWL_WEB_ARTWORK_QUERIES || 'site:nguyenartfoundation.com vietnam collection artwork')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
const CITY_POOL = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hue'];
const STYLE_POOL = ['Contemporary', 'Modernist', 'Lacquer Contemporary', 'Abstract', 'Impressionist'];
const MEDIUM_POOL = ['Oil on canvas', 'Acrylic on canvas', 'Lacquer on wood', 'Ink on paper', 'Mixed media'];
const FALLBACK_LIMIT = ARTWORK_LIMIT > 0 ? ARTWORK_LIMIT : 50;
const UPSERT_BATCH_SIZE = 100;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const toSlug = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

const parseYear = (value) => {
  if (!value) return null;
  const match = String(value).match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const decodeHtml = (value = '') =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
const stripHtml = (value = '') => decodeHtml(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const stripHtmlRich = (value = '') =>
  decodeHtml(value)
    .replace(/<\/(p|div|br|li|h1|h2|h3|h4|h5|h6)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
const reachedLimit = (count, limit) => limit > 0 && count >= limit;
const normalizeUrl = (url = '', base = '') => {
  try {
    return new URL(url, base || undefined).toString();
  } catch {
    return '';
  }
};
const unique = (values) => Array.from(new Set(values.filter(Boolean)));
const pick = (arr, seed = 0) => arr[Math.abs(seed) % arr.length];
const hashNumber = (value = '') => [...value].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7);
const stableId = (value = '') => crypto.createHash('sha1').update(value).digest('hex').slice(0, 12);
const stablePrice = (seedText) => {
  const min = Math.min(DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX);
  const max = Math.max(DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX);
  const span = Math.max(1, max - min);
  const seed = Math.abs(hashNumber(seedText));
  return Math.round((min + (seed % span)) / 100000) * 100000;
};
const isVietnameseLink = (url = '') => /\/vn\//i.test(url);

const fetchSeller = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['artist', 'gallery', 'art_dealer'])
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
};

const fetchArtistForSeller = async (sellerId) => {
  const { data, error } = await supabase
    .from('artists')
    .select('id')
    .eq('profile_id', sellerId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
};

const fetchWikidataArtworks = async (limit) => {
  const query = `
SELECT DISTINCT ?artwork ?artworkLabel ?creatorLabel ?inception ?materialLabel ?image ?article
WHERE {
  ?artwork wdt:P31/wdt:P279* wd:Q3305213.
  {
    ?artwork wdt:P495 wd:Q881.
  }
  UNION
  {
    ?artwork wdt:P170 ?creator.
    ?creator wdt:P27 wd:Q881.
  }
  OPTIONAL { ?artwork wdt:P170 ?creator2. }
  OPTIONAL { ?artwork wdt:P571 ?inception. }
  OPTIONAL { ?artwork wdt:P186 ?material. }
  OPTIONAL { ?artwork wdt:P18 ?image. }
  OPTIONAL {
    ?article schema:about ?artwork;
             schema:isPartOf <https://en.wikipedia.org/>.
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "vi,en". }
}
LIMIT ${Math.max(1, limit)}
`;

  const endpoint = new URL('https://query.wikidata.org/sparql');
  endpoint.searchParams.set('query', query);
  endpoint.searchParams.set('format', 'json');

  let lastError = null;
  for (let attempt = 1; attempt <= WIKIDATA_RETRIES; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(endpoint.toString(), {
        headers: {
          Accept: 'application/sparql-results+json',
          'User-Agent': 'JudoooArtworkCrawler/1.0 (+https://judooo.art)',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error(`Wikidata query failed (${response.status})`);
      }
      const json = await response.json();
      return Array.isArray(json?.results?.bindings) ? json.results.bindings : [];
    } catch (error) {
      lastError = error;
      if (attempt < WIKIDATA_RETRIES) {
        const delay = 800 * attempt;
        console.warn(`Wikidata attempt ${attempt}/${WIKIDATA_RETRIES} failed. Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  throw lastError || new Error('Wikidata query failed after retries');
};

const fetchCommonsCategoryImages = async (categoryTitle, limit) => {
  const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
  endpoint.searchParams.set('action', 'query');
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('origin', '*');
  endpoint.searchParams.set('generator', 'categorymembers');
  endpoint.searchParams.set('gcmtitle', categoryTitle);
  endpoint.searchParams.set('gcmtype', 'file');
  endpoint.searchParams.set('gcmlimit', String(limit));
  endpoint.searchParams.set('prop', 'imageinfo');
  endpoint.searchParams.set('iiprop', 'url|extmetadata');

  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'JudoooArtworkCrawler/1.0 (+https://judooo.art)',
    },
  });
  if (!response.ok) return [];
  const json = await response.json();
  const pages = Object.values(json?.query?.pages || {});
  return pages
    .map((page) => {
      const info = page?.imageinfo?.[0];
      const imageUrl = info?.url || '';
      const title = String(page?.title || '').replace(/^File:/i, '').replace(/[_]+/g, ' ');
      const summary = info?.extmetadata?.ImageDescription?.value || '';
      if (!imageUrl || !title) return null;
      return {
        title: title.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '').trim(),
        imageUrl,
        summary: stripHtml(summary),
        sourceItemUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page?.title || '')}`,
      };
    })
    .filter(Boolean);
};

const fetchCommonsFallbackArtworks = async (limit) => {
  const categories = [
    'Category:Paintings by Vietnamese artists',
    'Category:Vietnamese paintings',
    'Category:Vietnamese art',
  ];
  const aggregated = [];
  for (const category of categories) {
    const records = await fetchCommonsCategoryImages(category, limit);
    for (const record of records) {
      aggregated.push(record);
      if (aggregated.length >= limit) return aggregated;
    }
  }
  return aggregated;
};

const fetchWikipediaArtistFallback = async (limit) => {
  const artists = [
    'Bui Xuan Phai',
    'To Ngoc Van',
    'Nguyen Gia Tri',
    'Le Pho',
    'Mai Trung Thu',
    'Vu Cao Dam',
    'Nguyen Tu Nghiem',
    'Duong Bich Lien',
  ];

  const results = [];
  for (const name of artists) {
    if (results.length >= limit) break;
    const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'JudoooArtworkCrawler/1.0 (+https://judooo.art)',
        },
      });
      if (!response.ok) continue;
      const json = await response.json();
      const imageUrl = json?.originalimage?.source || json?.thumbnail?.source || '';
      if (!imageUrl) continue;
      results.push({
        title: `${name} Study`,
        imageUrl,
        summary: (json?.extract || '').trim(),
        sourceItemUrl:
          json?.content_urls?.desktop?.page ||
          `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/\s+/g, '_'))}`,
      });
    } catch {
      // continue
    }
  }
  return results.slice(0, limit);
};

const getEmbeddedTerms = (item, taxonomy) =>
  (Array.isArray(item?._embedded?.['wp:term']) ? item._embedded['wp:term'].flat() : [])
    .filter((term) => term?.taxonomy === taxonomy)
    .map((term) => stripHtml(term?.name || ''))
    .filter(Boolean);

const getEmbeddedImageUrl = (item) => {
  const media = Array.isArray(item?._embedded?.['wp:featuredmedia']) ? item._embedded['wp:featuredmedia'][0] : null;
  const full = media?.media_details?.sizes?.full?.source_url;
  return normalizeUrl(full || media?.source_url || '', item?.link || NGUYEN_COLLECTION_URL);
};

const fetchPaginatedWpItems = async (endpoint, limit) => {
  const rows = [];
  let page = 1;
  let totalPages = NGUYEN_MAX_PAGES;

  while (page <= totalPages && page <= NGUYEN_MAX_PAGES && !reachedLimit(rows.length, limit)) {
    const url = new URL(endpoint);
    url.searchParams.set('_embed', '1');
    url.searchParams.set('per_page', String(NGUYEN_PER_PAGE));
    url.searchParams.set('page', String(page));
    url.searchParams.set('orderby', 'date');
    url.searchParams.set('order', 'desc');

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'JudoooArtworkCrawler/1.0 (+https://judooo.art)',
      },
    });

    if (!response.ok) {
      if (page === 1) {
        throw new Error(`Nguyen Art Foundation API fetch failed (${response.status})`);
      }
      break;
    }

    const json = await response.json();
    if (!Array.isArray(json) || json.length === 0) break;
    rows.push(...json);
    totalPages = Number(response.headers.get('x-wp-totalpages') || totalPages || page);
    page += 1;
  }

  return limit > 0 ? rows.slice(0, limit) : rows;
};

const buildNguyenArtworkCandidates = async (limit) => {
  const items = await fetchPaginatedWpItems(NGUYEN_ARTWORKS_API, limit);
  const deduped = new Map();

  for (const item of items) {
    const title = stripHtml(item?.title?.rendered || '');
    const content = stripHtmlRich(item?.content?.rendered || '');
    const excerpt = stripHtml(item?.excerpt?.rendered || '');
    const imageUrl = getEmbeddedImageUrl(item);
    if (!title || !imageUrl) continue;

    const artistNames = getEmbeddedTerms(item, 'artist');
    const artworkTypes = getEmbeddedTerms(item, 'artwork_type');
    const collections = getEmbeddedTerms(item, 'collection');
    const dedupeKey =
      imageUrl ||
      `${artistNames.join('|')}::${toSlug(title)}::${toSlug(excerpt || content.slice(0, 80))}`;

    const candidate = {
      title,
      artistName: artistNames.join(', '),
      imageUrl,
      sourceItemUrl: normalizeUrl(item?.link || '', NGUYEN_COLLECTION_URL),
      summary: content || excerpt,
      medium: excerpt || artworkTypes.join(', '),
      dimensions: '',
      year: '',
      style: artworkTypes.join(', '),
      provenance: collections.length
        ? `Imported from Nguyen Art Foundation (${collections.join(', ')}).`
        : 'Imported from Nguyen Art Foundation.',
      condition: 'Not specified',
      score: isVietnameseLink(item?.link || '') ? 2 : 1,
    };

    const existing = deduped.get(dedupeKey);
    if (!existing || candidate.score > existing.score || candidate.summary.length > existing.summary.length) {
      deduped.set(dedupeKey, candidate);
    }
  }

  const rows = Array.from(deduped.values())
    .sort((a, b) => a.sourceItemUrl.localeCompare(b.sourceItemUrl))
    .map(({ score, ...row }) => row);

  return limit > 0 ? rows.slice(0, limit) : rows;
};

const decodeDuckUrl = (href = '') => {
  try {
    if (href.startsWith('http://') || href.startsWith('https://')) return href;
    const url = new URL(href, 'https://duckduckgo.com');
    const uddg = url.searchParams.get('uddg');
    return uddg ? decodeURIComponent(uddg) : '';
  } catch {
    return '';
  }
};

const fetchDuckDuckGoResults = async (query) => {
  const endpoint = new URL('https://html.duckduckgo.com/html/');
  endpoint.searchParams.set('q', query);
  endpoint.searchParams.set('ia', 'web');

  const response = await fetch(endpoint.toString(), {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'text/html',
    },
  });
  if (!response.ok) return [];
  const html = await response.text();
  const matches = [...html.matchAll(/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  return matches
    .map((m) => ({
      url: decodeDuckUrl(m[1] || ''),
      title: stripHtml(m[2] || ''),
    }))
    .filter((row) => row.url && row.title);
};

const fetchPagePreviewImage = async (url) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,*/*;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!response.ok) return { imageUrl: '', description: '' };
    const html = await response.text();
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
    const twImage = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
    const ogDesc =
      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
    return {
      imageUrl: ogImage || twImage || '',
      description: stripHtml(ogDesc || ''),
    };
  } catch {
    return { imageUrl: '', description: '' };
  }
};

const fetchWebSearchFallbackArtworks = async (limit) => {
  const rows = [];
  const seenPages = new Set();
  const seenImages = new Set();

  for (const query of WEB_QUERIES) {
    if (rows.length >= limit) break;
    const results = await fetchDuckDuckGoResults(query);
    for (const result of results) {
      if (rows.length >= limit) break;
      if (!result.url || seenPages.has(result.url)) continue;
      seenPages.add(result.url);
      const preview = await fetchPagePreviewImage(result.url);
      if (!preview.imageUrl || seenImages.has(preview.imageUrl)) continue;
      seenImages.add(preview.imageUrl);
      rows.push({
        title: result.title,
        imageUrl: preview.imageUrl,
        sourceItemUrl: result.url,
        summary: preview.description || `Imported from web search result: ${result.title}`,
      });
    }
  }

  return rows;
};

const fetchWikipediaSummary = async (articleUrl) => {
  if (!articleUrl) return '';
  try {
    const title = decodeURIComponent(articleUrl.split('/wiki/')[1] || '');
    if (!title) return '';
    const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'JudoooArtworkCrawler/1.0 (+https://judooo.art)',
      },
    });
    if (!response.ok) return '';
    const json = await response.json();
    return (json?.extract || '').trim();
  } catch {
    return '';
  }
};

const normalizeArtworkTitle = (title = '', summary = '') => {
  const cleaned = stripHtml(title)
    .replace(/\s*[-|]\s*(wikipedia|wikidata|commons).*$/i, '')
    .replace(/^file:\s*/i, '')
    .trim();
  const text = `${cleaned} ${summary}`.toLowerCase();
  const hasArtworkWord =
    /(painting|artwork|canvas|lacquer|portrait|landscape|composition|still life|study|untitled|triptych|work)/i.test(
      text
    );
  if (!cleaned) return 'Untitled Vietnamese Artwork';
  if (!hasArtworkWord && cleaned.length < 4) return 'Untitled Vietnamese Artwork';
  return cleaned;
};

const isLikelyArtistProfile = (title = '', summary = '', sourceItemUrl = '') => {
  const text = `${title} ${summary} ${sourceItemUrl}`.toLowerCase();
  const personSignals = /(biography|born|died|painter|artist profile|about the artist|life and work)/i.test(text);
  const artworkSignals =
    /(painting|artwork|canvas|lacquer|collection|gallery|auction|museum|study|untitled|composition)/i.test(text);
  return personSignals && !artworkSignals;
};

const buildImportedArtwork = ({
  artistId,
  sellerId,
  artistName,
  title,
  imageUrl,
  summary,
  sourceUrl,
  sourceItemUrl,
  slugPrefix,
  medium,
  dimensions,
  year,
  style,
  provenance,
  condition,
}) => {
  const normalizedTitle = normalizeArtworkTitle(title, summary);
  const stableKey = sourceItemUrl || imageUrl || `${sourceUrl}:${normalizedTitle}`;
  const seed = hashNumber(`${normalizedTitle}|${stableKey}`);
  const city = /nguyenartfoundation\.com/i.test(sourceUrl) ? 'Ho Chi Minh City' : pick(CITY_POOL, seed);
  const styleValue = style || pick(STYLE_POOL, seed + 11);
  const mediumValue = medium || pick(MEDIUM_POOL, seed + 23);
  const parsedYear = parseYear(year);
  const story = (summary || `Imported artwork reference for ${normalizedTitle}.`).slice(0, 1400);

  return {
    artist: artistName || 'Unknown Artist',
    artist_id: artistId,
    created_by: sellerId,
    title: normalizedTitle,
    slug: `${slugPrefix}-${stableId(stableKey)}`,
    description: story || 'Imported artwork reference from public online sources.',
    art_form: 'painting',
    medium: mediumValue,
    dimensions: dimensions || 'Unknown',
    year_created: parsedYear,
    image_url: imageUrl,
    image_urls: unique([imageUrl]),
    sale_type: 'fixed',
    price: stablePrice(stableKey),
    availability: 'active',
    moderation: 'approved',
    style: styleValue,
    city,
    country: 'Vietnam',
    provenance: provenance || `Catalogued from online source at ${new Date().toISOString().split('T')[0]}.`,
    authenticity: /nguyenartfoundation\.com/i.test(sourceUrl)
      ? 'Imported from Nguyen Art Foundation public catalog.'
      : 'Public reference imported from online sources.',
    condition_report: condition || 'Not specified',
    story,
    source_url: sourceUrl,
    source_item_url: sourceItemUrl || null,
    imported_at: new Date().toISOString(),
  };
};

const upsertArtworks = async (rows) => {
  if (!rows.length) return [];

  const inserted = [];
  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_BATCH_SIZE);
    const { data, error } = await supabase.from('artworks').upsert(chunk, { onConflict: 'slug' }).select('id,slug,title');
    if (error) throw error;
    inserted.push(...(data || []));
  }

  return inserted;
};

const main = async () => {
  const sellerId = await fetchSeller();
  if (!sellerId) {
    console.error('No seller profile found. Create at least one profile with role artist/gallery/art_dealer.');
    process.exit(1);
  }

  const artistId = await fetchArtistForSeller(sellerId);
  const normalized = [];
  const seen = new Set();

  let source = 'nguyenartfoundation';
  let foundationRows = [];
  try {
    foundationRows = await buildNguyenArtworkCandidates(ARTWORK_LIMIT);
  } catch (error) {
    console.warn(`Nguyen Art Foundation API unavailable (${error?.message || error}). Falling back to open data.`);
  }

  for (const row of foundationRows) {
    if (isLikelyArtistProfile(row.title, row.summary, row.sourceItemUrl)) continue;
    const dedupeKey = row.sourceItemUrl || row.imageUrl;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    normalized.push(
      buildImportedArtwork({
        artistId,
        sellerId,
        artistName: row.artistName,
        title: row.title,
        imageUrl: row.imageUrl,
        summary: row.summary || 'Imported from Nguyen Art Foundation collection.',
        sourceUrl: NGUYEN_ARTWORKS_API,
        sourceItemUrl: row.sourceItemUrl || null,
        slugPrefix: 'nguyen-foundation',
        medium: row.medium,
        dimensions: row.dimensions,
        year: row.year,
        style: row.style,
        provenance: row.provenance,
        condition: row.condition,
      })
    );
  }

  if (!normalized.length) {
    source = 'wikidata';
  }

  let records = [];
  if (source === 'wikidata') {
    try {
      records = await fetchWikidataArtworks(FALLBACK_LIMIT);
    } catch (error) {
      console.warn(`Wikidata unavailable (${error?.message || error}). Falling back to Wikimedia Commons.`);
      source = 'commons';
    }
  }

  if (source === 'wikidata') {
    for (const row of records) {
      const artworkUrl = row?.artwork?.value || '';
      const title = row?.artworkLabel?.value || '';
      const imageUrl = row?.image?.value || '';
      if (!artworkUrl || !title || !imageUrl) continue;
      if (seen.has(artworkUrl)) continue;
      seen.add(artworkUrl);

      const qid = artworkUrl.split('/').pop() || stableId(artworkUrl);
      const articleUrl = row?.article?.value || '';
      const summary = await fetchWikipediaSummary(articleUrl);
      if (isLikelyArtistProfile(title, summary, articleUrl || artworkUrl)) continue;
      normalized.push(
        buildImportedArtwork({
          artistId,
          sellerId,
          artistName: row?.creatorLabel?.value || 'Unknown Artist',
          title,
          imageUrl,
          summary: summary || `Imported artwork reference from Wikidata (${qid}).`,
          sourceUrl: 'https://query.wikidata.org/',
          sourceItemUrl: articleUrl || artworkUrl,
          slugPrefix: 'wikidata',
          medium: row?.materialLabel?.value || '',
          year: row?.inception?.value || '',
        })
      );
    }
  } else if (!normalized.length) {
    const commonsRows = await fetchCommonsFallbackArtworks(FALLBACK_LIMIT);
    for (const row of commonsRows) {
      if (!row?.title || !row?.imageUrl) continue;
      if (seen.has(row.sourceItemUrl)) continue;
      seen.add(row.sourceItemUrl);
      if (isLikelyArtistProfile(row.title, row.summary, row.sourceItemUrl)) continue;
      normalized.push(
        buildImportedArtwork({
          artistId,
          sellerId,
          artistName: 'Unknown Artist',
          title: row.title,
          imageUrl: row.imageUrl,
          summary: row.summary || 'Imported from Wikimedia Commons category data.',
          sourceUrl: 'https://commons.wikimedia.org/',
          sourceItemUrl: row.sourceItemUrl,
          slugPrefix: 'commons',
        })
      );
    }
  }

  if (!normalized.length) {
    const webRows = await fetchWebSearchFallbackArtworks(FALLBACK_LIMIT);
    source = 'web-search';
    for (const row of webRows) {
      if (isLikelyArtistProfile(row.title, row.summary, row.sourceItemUrl)) continue;
      normalized.push(
        buildImportedArtwork({
          artistId,
          sellerId,
          artistName: 'Unknown Artist',
          title: row.title,
          imageUrl: row.imageUrl,
          summary: row.summary || 'Imported from web search results.',
          sourceUrl: 'https://html.duckduckgo.com/html/',
          sourceItemUrl: row.sourceItemUrl || null,
          slugPrefix: 'web',
        })
      );
    }
  }

  if (!normalized.length) {
    const wikipediaRows = await fetchWikipediaArtistFallback(FALLBACK_LIMIT);
    source = 'wikipedia-artist';
    for (const row of wikipediaRows) {
      normalized.push(
        buildImportedArtwork({
          artistId,
          sellerId,
          artistName: 'Unknown Artist',
          title: row.title,
          imageUrl: row.imageUrl,
          summary: row.summary || 'Imported from Wikipedia artist references.',
          sourceUrl: 'https://en.wikipedia.org/',
          sourceItemUrl: row.sourceItemUrl,
          slugPrefix: 'wikipedia',
        })
      );
    }
  }

  if (!normalized.length) {
    console.log('No artwork records available from Nguyen Art Foundation, Wikidata, Wikimedia Commons, web search, or Wikipedia fallback.');
    process.exit(0);
  }

  const inserted = await upsertArtworks(normalized);
  console.log(`Imported/updated ${inserted.length} artwork rows via ${source}.`);
};

main().catch((error) => {
  console.error('crawlArtworksToSupabase failed:', error);
  process.exit(1);
});
