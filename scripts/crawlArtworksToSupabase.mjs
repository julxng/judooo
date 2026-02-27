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
const NGUYEN_MAX_PAGES = Number(process.env.CRAWL_NGUYEN_MAX_PAGES || 120);
const WEB_QUERIES = (process.env.CRAWL_WEB_ARTWORK_QUERIES || 'site:nguyenartfoundation.com vietnam collection artwork')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
const CITY_POOL = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hue'];
const STYLE_POOL = ['Contemporary', 'Modernist', 'Lacquer Contemporary', 'Abstract', 'Impressionist'];
const MEDIUM_POOL = ['Oil on canvas', 'Acrylic on canvas', 'Lacquer on wood', 'Ink on paper', 'Mixed media'];
const DIMENSIONS_POOL = ['80 x 100 cm', '100 x 120 cm', '90 x 90 cm', '70 x 100 cm', '120 x 150 cm'];
const FALLBACK_LIMIT = ARTWORK_LIMIT > 0 ? ARTWORK_LIMIT : 50;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const toSlug = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

const parseYear = (value) => {
  if (!value) return null;
  const match = String(value).match(/\d{4}/);
  return match ? Number(match[0]) : null;
};

const randomPrice = () => {
  const min = Math.min(DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX);
  const max = Math.max(DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX);
  return Math.round((min + Math.random() * (max - min)) / 100000) * 100000;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stripHtml = (s = '') => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const reachedLimit = (count, limit) => limit > 0 && count >= limit;
const normalizeUrl = (url = '', base = '') => {
  try {
    return new URL(url, base || undefined).toString();
  } catch {
    return '';
  }
};
const unique = (arr) => Array.from(new Set(arr.filter(Boolean)));
const pick = (arr, seed = 0) => arr[Math.abs(seed) % arr.length];
const hash = (s = '') => [...s].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7);

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
        summary: String(summary).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
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
        sourceItemUrl: json?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/\s+/g, '_'))}`,
      });
    } catch {
      // continue
    }
  }
  return results.slice(0, limit);
};

const fetchNguyenArtFoundationArtworks = async (limit) => {
  const headers = {
    'User-Agent': 'JudoooArtworkCrawler/1.0 (+https://judooo.art)',
    Accept: 'text/html',
  };
  const extractClickTargets = (html, baseUrl) => {
    const urls = [];

    const attrPatterns = [
      /(?:href|data-href|data-url|data-link|data-permalink|data-post-url)=["']([^"']+)["']/gi,
      /"(https?:\/\/[^"]*nguyenartfoundation\.com[^"]*)"/gi,
      /'(https?:\/\/[^']*nguyenartfoundation\.com[^']*)'/gi,
    ];
    for (const pattern of attrPatterns) {
      for (const match of html.matchAll(pattern)) {
        urls.push(normalizeUrl(match[1] || '', baseUrl));
      }
    }

    const onclickMatches = [...html.matchAll(/onclick=["']([\s\S]*?)["']/gi)];
    for (const match of onclickMatches) {
      const js = match[1] || '';
      const quoted = [...js.matchAll(/['"]((?:https?:\/\/|\/)[^'"]+)['"]/gi)];
      for (const q of quoted) urls.push(normalizeUrl(q[1] || '', baseUrl));
      const wpPostId = js.match(/(?:post|id)\s*[:=]\s*['"]?(\d{2,10})['"]?/i)?.[1];
      if (wpPostId) urls.push(normalizeUrl(`/?p=${wpPostId}`, baseUrl));
    }

    for (const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
      const body = script[1] || '';
      const jsonUrlMatches = [...body.matchAll(/"(\/[^"]*collection\/[^"]*)"/gi)];
      for (const m of jsonUrlMatches) urls.push(normalizeUrl(m[1] || '', baseUrl));
      const absMatches = [...body.matchAll(/"(https?:\/\/[^"]*nguyenartfoundation\.com[^"]*)"/gi)];
      for (const m of absMatches) urls.push(normalizeUrl(m[1] || '', baseUrl));
    }

    return unique(urls).filter((href) => /nguyenartfoundation\.com/i.test(href));
  };

  const listPages = [NGUYEN_COLLECTION_URL];
  const seenPages = new Set();
  const detailLinks = [];
  const seenDetailLinks = new Set();

  for (let idx = 0; idx < listPages.length; idx += 1) {
    if (seenPages.size >= NGUYEN_MAX_PAGES) break;
    const pageUrl = listPages[idx];
    if (!pageUrl || seenPages.has(pageUrl)) continue;
    seenPages.add(pageUrl);

    try {
      const response = await fetch(pageUrl, { headers });
      if (!response.ok) continue;
      const html = await response.text();

      const anchors = extractClickTargets(html, pageUrl);
      for (const href of anchors) {
        if (!href || !/nguyenartfoundation\.com/i.test(href)) continue;
        if (/\/collection\//i.test(href) && !/\/collection\/suu-tap\/?$/i.test(href) && !/\/page\/\d+\/?$/i.test(href)) {
          if (!seenDetailLinks.has(href)) {
            seenDetailLinks.add(href);
            detailLinks.push(href);
          }
          continue;
        }
        if (/\/collection\/suu-tap\/page\/\d+\/?$/i.test(href) || /\/page\/\d+\/?$/i.test(href) || /[?&]paged=\d+/i.test(href)) {
          if (!seenPages.has(href) && !listPages.includes(href)) listPages.push(href);
        }
      }

      const nextHref = normalizeUrl(
        html.match(/<a[^>]+(?:rel=["']next["']|class=["'][^"']*(?:next|page-numbers)[^"']*["'])[^>]+href=["']([^"']+)["']/i)?.[1] || '',
        pageUrl
      );
      if (nextHref && !seenPages.has(nextHref) && !listPages.includes(nextHref)) {
        listPages.push(nextHref);
      }

      const currentPageNum = Number(
        pageUrl.match(/\/page\/(\d+)\/?$/i)?.[1] ||
          new URL(pageUrl).searchParams.get('paged') ||
          1
      );
      const guessedNext = normalizeUrl(`./page/${currentPageNum + 1}/`, NGUYEN_COLLECTION_URL);
      if (guessedNext && !seenPages.has(guessedNext) && !listPages.includes(guessedNext)) {
        listPages.push(guessedNext);
      }
    } catch {
      // continue
    }
  }

  const toMetaMap = (html) => {
    const map = {};
    const pairs = [
      ...html.matchAll(/<(?:li|p|div)[^>]*>\s*(?:<strong>|<b>)?\s*([^:<]{2,40})\s*:?\s*(?:<\/strong>|<\/b>)?\s*([^<]{1,200})<\/(?:li|p|div)>/gi),
      ...html.matchAll(/<tr[^>]*>\s*<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi),
      ...html.matchAll(/<dt[^>]*>([^<]+)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi),
    ];
    for (const pair of pairs) {
      const key = stripHtml(pair[1] || '').toLowerCase();
      const value = stripHtml(pair[2] || '');
      if (key && value && !map[key]) map[key] = value;
    }
    return map;
  };

  const pickMeta = (meta, patterns) => {
    for (const key of Object.keys(meta)) {
      if (patterns.some((p) => p.test(key))) return meta[key];
    }
    return '';
  };

  const rows = [];
  for (const link of detailLinks) {
    if (reachedLimit(rows.length, limit)) break;
    try {
      const detailResponse = await fetch(link, { headers });
      if (!detailResponse.ok) continue;
      const html = await detailResponse.text();
      const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
      const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
      const twImage = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
      const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
      const firstImage = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)?.[1] || '';
      const meta = toMetaMap(html);
      const title = stripHtml(ogTitle || h1 || 'Untitled Vietnamese Artwork');
      const imageUrl = normalizeUrl(ogImage || twImage || firstImage, link);
      const summary = stripHtml(ogDesc || meta.description || meta['mô tả'] || '');
      if (!imageUrl) continue;
      rows.push({
        title,
        imageUrl,
        sourceItemUrl: link,
        summary,
        medium: pickMeta(meta, [/medium/i, /chất liệu/i]),
        dimensions: pickMeta(meta, [/dimension/i, /kích thước/i, /size/i]),
        year: pickMeta(meta, [/year/i, /\bnăm\b/i]),
        style: pickMeta(meta, [/style/i, /phong cách/i]),
        provenance: pickMeta(meta, [/provenance/i, /xuất xứ/i]),
        condition: pickMeta(meta, [/condition/i, /tình trạng/i]),
        artistName: pickMeta(meta, [/artist/i, /họa sĩ/i, /tác giả/i]),
      });
    } catch {
      // continue
    }
  }
  return rows;
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
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
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
  const looksLikeArtistName = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(cleaned);
  if (!cleaned) return 'Untitled Vietnamese Artwork';
  if (looksLikeArtistName && !hasArtworkWord) return `Untitled Work after ${cleaned}`;
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
  title,
  imageUrl,
  summary,
  sourceUrl,
  sourceItemUrl,
  slugPrefix,
  indexSeed = 0,
  medium,
  dimensions,
  year,
  style,
  provenance,
  condition,
}) => {
  const seed = hash(`${title}|${imageUrl}|${sourceItemUrl}|${indexSeed}`);
  const normalizedTitle = normalizeArtworkTitle(title, summary);
  const city = pick(CITY_POOL, seed);
  const styleValue = style || pick(STYLE_POOL, seed + 11);
  const mediumValue = medium || pick(MEDIUM_POOL, seed + 23);
  const dimensionsValue = dimensions || pick(DIMENSIONS_POOL, seed + 37);
  const parsedYear = parseYear(year);
  const yearCreated = parsedYear || 1995 + (Math.abs(seed) % 30);
  const fallbackStory = `Curated marketplace placeholder based on online reference imagery for ${city}.`;
  const story = (summary || fallbackStory).slice(0, 700);

  return {
    artist_id: artistId,
    created_by: sellerId,
    title: normalizedTitle,
    slug: `${slugPrefix}-${toSlug(normalizedTitle)}-${Date.now()}-${Math.abs(seed % 10000)}`,
    description: story || 'Imported artwork reference from public online sources.',
    art_form: 'painting',
    medium: mediumValue,
    dimensions: dimensionsValue,
    year_created: yearCreated,
    image_url: imageUrl,
    image_urls: [imageUrl],
    sale_type: 'fixed',
    price: randomPrice(),
    availability: 'active',
    moderation: 'approved',
    style: styleValue,
    city,
    country: 'Vietnam',
    provenance: provenance || `Catalogued from online source at ${new Date().toISOString().split('T')[0]}.`,
    authenticity: 'Marketplace placeholder; seller verification required.',
    condition_report: condition || 'Good',
    story,
    source_url: sourceUrl,
    source_item_url: sourceItemUrl || null,
    imported_at: new Date().toISOString(),
  };
};

const upsertArtworks = async (rows) => {
  if (!rows.length) return [];
  const { data, error } = await supabase
    .from('artworks')
    .upsert(rows, { onConflict: 'slug' })
    .select('id,slug,title');
  if (error) throw error;
  return data || [];
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
  const foundationRows = await fetchNguyenArtFoundationArtworks(ARTWORK_LIMIT);
  for (const row of foundationRows) {
    if (isLikelyArtistProfile(row.title, row.summary, row.sourceItemUrl)) continue;
    normalized.push(
      buildImportedArtwork({
        artistId,
        sellerId,
        title: row.title,
        imageUrl: row.imageUrl,
        summary: row.summary || 'Imported from Nguyen Art Foundation collection.',
        sourceUrl: NGUYEN_COLLECTION_URL,
        sourceItemUrl: row.sourceItemUrl || null,
        slugPrefix: 'nguyen-foundation',
        indexSeed: normalized.length,
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

      const qid = artworkUrl.split('/').pop() || `${Date.now()}`;
      const articleUrl = row?.article?.value || '';
      const summary = await fetchWikipediaSummary(articleUrl);
      if (isLikelyArtistProfile(title, summary, articleUrl || artworkUrl)) continue;
      const item = buildImportedArtwork({
        artistId,
        sellerId,
        title,
        imageUrl,
        summary: summary || `Imported artwork reference from Wikidata (${qid}).`,
        sourceUrl: 'https://query.wikidata.org/',
        sourceItemUrl: articleUrl || artworkUrl,
        slugPrefix: 'wikidata',
        indexSeed: normalized.length,
      });
      if (row?.materialLabel?.value) item.medium = row.materialLabel.value;
      if (parseYear(row?.inception?.value)) item.year_created = parseYear(row.inception.value);
      normalized.push(item);
    }
  } else {
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
          title: row.title,
          imageUrl: row.imageUrl,
          summary: row.summary || 'Imported from Wikimedia Commons category data.',
          sourceUrl: 'https://commons.wikimedia.org/',
          sourceItemUrl: row.sourceItemUrl,
          slugPrefix: 'commons',
          indexSeed: normalized.length,
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
          title: row.title,
          imageUrl: row.imageUrl,
          summary: row.summary || 'Imported from web search results.',
          sourceUrl: 'https://html.duckduckgo.com/html/',
          sourceItemUrl: row.sourceItemUrl || null,
          slugPrefix: 'web',
          indexSeed: normalized.length,
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
          title: row.title,
          imageUrl: row.imageUrl,
          summary: row.summary || 'Imported from Wikipedia artist references.',
          sourceUrl: 'https://en.wikipedia.org/',
          sourceItemUrl: row.sourceItemUrl,
          slugPrefix: 'wikipedia',
          indexSeed: normalized.length,
        })
      );
    }
  }

  if (!normalized.length) {
    console.log('No artwork records available from Nguyen Art Foundation, Wikidata, Wikimedia Commons, web search, or Wikipedia fallback.');
    process.exit(0);
  }

  const inserted = await upsertArtworks(normalized);
  console.log(`Imported/updated ${inserted.length} Vietnamese artwork placeholders via ${source}.`);
};

main().catch((error) => {
  console.error('crawlArtworksToSupabase failed:', error);
  process.exit(1);
});
