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

const SOURCE_URLS = (process.env.CRAWL_SOURCE_URLS || 'https://hanoigrapevine.com/feed/')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
const GOOGLE_NEWS_QUERIES = (process.env.CRAWL_GOOGLE_NEWS_QUERIES || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
const GOOGLE_NEWS_HL = process.env.CRAWL_GOOGLE_NEWS_HL || 'en-US';
const GOOGLE_NEWS_GL = process.env.CRAWL_GOOGLE_NEWS_GL || 'US';
const GOOGLE_NEWS_CEID = process.env.CRAWL_GOOGLE_NEWS_CEID || 'US:en';
const FACEBOOK_GROUP_IDS = (process.env.CRAWL_FACEBOOK_GROUP_IDS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
const FACEBOOK_PAGE_IDS = (process.env.CRAWL_FACEBOOK_PAGE_IDS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
const FACEBOOK_GRAPH_TOKEN = process.env.FACEBOOK_GRAPH_ACCESS_TOKEN || '';
const FACEBOOK_LIMIT = Number(process.env.CRAWL_FACEBOOK_LIMIT || 25);

const NGUYEN_EVENTS_ENABLED = process.env.CRAWL_NGUYEN_EVENTS_ENABLED !== 'false';
const NGUYEN_EXHIBITIONS_API =
  process.env.CRAWL_NGUYEN_EXHIBITIONS_API || 'https://nguyenartfoundation.com/wp-json/wp/v2/exhibitions';
const NGUYEN_EDUCATION_API =
  process.env.CRAWL_NGUYEN_EDUCATION_API || 'https://nguyenartfoundation.com/wp-json/wp/v2/education';
const NGUYEN_EVENT_LIMIT = Number(process.env.CRAWL_NGUYEN_EVENT_LIMIT || 0);
const NGUYEN_EVENT_MAX_PAGES = Number(process.env.CRAWL_NGUYEN_EVENT_MAX_PAGES || 20);
const NGUYEN_EVENT_PER_PAGE = Math.min(100, Number(process.env.CRAWL_NGUYEN_EVENT_PER_PAGE || 100));

const DEFAULT_LOCATION = process.env.CRAWL_DEFAULT_LOCATION || 'Vietnam';
const DEFAULT_CATEGORY = process.env.CRAWL_DEFAULT_CATEGORY || 'exhibition';
const BATCH_LIMIT = Number(process.env.CRAWL_BATCH_LIMIT || 30);

const CITY_CENTERS = {
  'Ho Chi Minh City': { lat: 10.7769, lng: 106.7009 },
  Hanoi: { lat: 21.0285, lng: 105.8542 },
  'Da Nang': { lat: 16.0544, lng: 108.2022 },
  'Hai Phong': { lat: 20.8449, lng: 106.6881 },
  Hue: { lat: 16.4637, lng: 107.5909 },
  'Can Tho': { lat: 10.0452, lng: 105.7469 },
};

const ENGLISH_MONTHS = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const nafPageCache = new Map();
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

const decodeXml = (input = '') =>
  input
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

const stripHtml = (input = '') => decodeXml(input).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const stripHtmlRich = (input = '') =>
  decodeXml(input)
    .replace(/<\/(p|div|br|li|h1|h2|h3|h4|h5|h6)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();

const tagValue = (block, tag) => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
};

const cleanTitle = (raw = '') => {
  let title = stripHtml(raw)
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
  title = title
    .replace(/\s*[|\-–—]\s*(facebook|instagram|google news|youtube|x|twitter|hanoi grapevine)\s*$/i, '')
    .replace(/\s*\[[^\]]+\]\s*$/g, '')
    .replace(/\s*\((video|photos|gallery|update)\)\s*$/i, '')
    .trim();
  if (title.length > 160) title = `${title.slice(0, 157).trim()}...`;
  return title || 'Untitled Event';
};

const normalizeImageUrl = (raw = '') => {
  if (!raw) return '';
  let url = raw.trim();
  if (!url) return '';
  url = url.replace(/-\d{2,4}x\d{2,4}(?=\.(jpg|jpeg|png|webp))/i, '');
  try {
    const u = new URL(url);
    ['w', 'width', 'h', 'height', 'fit', 'resize', 'crop'].forEach((k) => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return url;
  }
};

const normalizeUrl = (raw = '', base = '') => {
  try {
    return new URL(raw, base || undefined).toString();
  } catch {
    return '';
  }
};

const detectCity = (item) => {
  const text =
    `${item?.title || ''}\n${item?.summary || ''}\n${item?.raw_payload?.full_text || ''}\n${item?.item_url || ''}\n${item?.raw_payload?.location_name || ''}`.toLowerCase();
  const rules = [
    { city: 'Ho Chi Minh City', patterns: [/ho chi minh/, /\bhcmc\b/, /\bsaigon\b/, /thủ đức/, /thu duc/] },
    { city: 'Hanoi', patterns: [/\bhanoi\b/, /\bha noi\b/] },
    { city: 'Da Nang', patterns: [/\bda nang\b/, /\bdanang\b/] },
    { city: 'Hai Phong', patterns: [/\bhai phong\b/, /\bhaiphong\b/] },
    { city: 'Hue', patterns: [/\bhue\b/, /\bhuế\b/] },
    { city: 'Can Tho', patterns: [/\bcan tho\b/, /\bcần thơ\b/] },
  ];
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return rule.city;
    }
  }
  return DEFAULT_LOCATION === 'Vietnam' ? 'Ho Chi Minh City' : DEFAULT_LOCATION;
};

const firstAttr = (block, regex) => {
  const match = block.match(regex);
  return match ? decodeXml(match[1]) : '';
};

const extractImageFromXmlBlock = (block) => {
  const enclosureUrl = firstAttr(block, /<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (enclosureUrl) return normalizeImageUrl(enclosureUrl);

  const mediaContentUrl = firstAttr(block, /<media:content[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (mediaContentUrl) return normalizeImageUrl(mediaContentUrl);

  const mediaThumbUrl = firstAttr(block, /<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (mediaThumbUrl) return normalizeImageUrl(mediaThumbUrl);

  const contentEncoded = tagValue(block, 'content:encoded');
  const description = tagValue(block, 'description');
  const html = contentEncoded || description;
  const srcset = firstAttr(html, /<img[^>]*srcset=["']([^"']+)["'][^>]*>/i);
  if (srcset) {
    const candidates = srcset
      .split(',')
      .map((entry) => entry.trim())
      .map((entry) => {
        const parts = entry.split(/\s+/);
        return { url: parts[0], width: Number((parts[1] || '').replace('w', '')) || 0 };
      })
      .sort((a, b) => b.width - a.width);
    if (candidates[0]?.url) return normalizeImageUrl(candidates[0].url);
  }

  const imgSrc = firstAttr(html, /<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (imgSrc) return normalizeImageUrl(imgSrc);

  return '';
};

const parseRssItems = (xml, sourceUrl) => {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return items.slice(0, BATCH_LIMIT).map((item) => {
    const title = cleanTitle(tagValue(item, 'title'));
    const link = stripHtml(tagValue(item, 'link'));
    const guid = stripHtml(tagValue(item, 'guid'));
    const htmlText = tagValue(item, 'content:encoded') || tagValue(item, 'description');
    const fullText = stripHtmlRich(htmlText);
    const summary = fullText.slice(0, 500).trim();
    const imageUrl = extractImageFromXmlBlock(item);
    const pubDateRaw = stripHtml(tagValue(item, 'pubDate'));
    const pubDate = pubDateRaw ? new Date(pubDateRaw) : null;

    const externalId = guid || link || crypto.createHash('sha1').update(`${sourceUrl}:${title}`).digest('hex');

    return {
      source_url: sourceUrl,
      external_id: externalId,
      source_type: 'rss',
      title: title || 'Untitled Event',
      summary: summary || null,
      item_url: link || null,
      published_at: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate.toISOString() : null,
      raw_payload: {
        title,
        link,
        guid,
        description: summary || null,
        full_text: fullText || null,
        image_url: imageUrl || null,
        pubDate: pubDateRaw || null,
      },
      crawl_status: 'new',
    };
  });
};

const parseAtomItems = (xml, sourceUrl) => {
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  return entries.slice(0, BATCH_LIMIT).map((entry) => {
    const title = cleanTitle(tagValue(entry, 'title'));
    const fullText = stripHtmlRich(tagValue(entry, 'content') || tagValue(entry, 'summary'));
    const summary = fullText.slice(0, 500).trim();
    const updated = stripHtml(tagValue(entry, 'updated') || tagValue(entry, 'published'));
    const id = stripHtml(tagValue(entry, 'id'));
    const linkMatch = entry.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
    const link = linkMatch ? decodeXml(linkMatch[1]) : '';
    const imageUrl = extractImageFromXmlBlock(entry);
    const pubDate = updated ? new Date(updated) : null;
    const externalId = id || link || crypto.createHash('sha1').update(`${sourceUrl}:${title}`).digest('hex');

    return {
      source_url: sourceUrl,
      external_id: externalId,
      source_type: 'atom',
      title: title || 'Untitled Event',
      summary: summary || null,
      item_url: link || null,
      published_at: pubDate && !Number.isNaN(pubDate.getTime()) ? pubDate.toISOString() : null,
      raw_payload: {
        title,
        link,
        id,
        summary,
        full_text: fullText || null,
        image_url: imageUrl || null,
        updated: updated || null,
      },
      crawl_status: 'new',
    };
  });
};

const googleNewsFeedUrl = (query) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${encodeURIComponent(
    GOOGLE_NEWS_HL
  )}&gl=${encodeURIComponent(GOOGLE_NEWS_GL)}&ceid=${encodeURIComponent(GOOGLE_NEWS_CEID)}`;

const fetchFacebookFeed = async (sourceId, sourceKind) => {
  const edge = sourceKind === 'group' ? 'feed' : 'posts';
  const endpoint = new URL(`https://graph.facebook.com/v21.0/${sourceId}/${edge}`);
  endpoint.searchParams.set('fields', 'id,message,created_time,permalink_url,attachments{media,type,url,title,description}');
  endpoint.searchParams.set('limit', String(FACEBOOK_LIMIT));
  endpoint.searchParams.set('access_token', FACEBOOK_GRAPH_TOKEN);

  const response = await fetch(endpoint.toString(), {
    headers: {
      'User-Agent': 'JudoooCrawler/1.0 (+https://judooo.art)',
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Facebook fetch failed (${response.status}) for ${sourceKind} ${sourceId}`);
  }
  return response.json();
};

const parseFacebookItems = (json, sourceId, sourceKind) => {
  const posts = Array.isArray(json?.data) ? json.data : [];
  const sourceUrl =
    sourceKind === 'group' ? `https://www.facebook.com/groups/${sourceId}` : `https://www.facebook.com/${sourceId}`;

  return posts.slice(0, FACEBOOK_LIMIT).map((post) => {
    const attachment = Array.isArray(post?.attachments?.data) ? post.attachments.data[0] : null;
    const imageUrl = normalizeImageUrl(attachment?.media?.image?.src || attachment?.url || '') || null;
    const message = stripHtmlRich(post?.message || attachment?.description || '');
    const titleBase = attachment?.title || post?.message || `Facebook ${sourceKind} post`;

    return {
      source_url: sourceUrl,
      external_id: String(post.id || `${sourceId}-${crypto.randomUUID()}`),
      source_type: sourceKind === 'group' ? 'facebook-group' : 'facebook-page',
      title: cleanTitle(titleBase),
      summary: message.slice(0, 500) || null,
      item_url: post?.permalink_url || sourceUrl,
      published_at: post?.created_time || null,
      raw_payload: {
        title: cleanTitle(titleBase),
        summary: message.slice(0, 500) || null,
        full_text: message || null,
        image_url: imageUrl,
        organizer: 'Facebook',
        category: DEFAULT_CATEGORY,
        post,
      },
      crawl_status: 'new',
    };
  });
};

const fetchSource = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'JudoooCrawler/1.0 (+https://judooo.art)',
      Accept: 'application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }

  return response.text();
};

const upsertSourceItems = async (records) => {
  if (!records.length) return [];

  const { data, error } = await supabase.from('source_items').upsert(records, { onConflict: 'source_url,external_id' }).select('*');

  if (error) throw error;
  return data || [];
};

const toDate = (value) => {
  if (!value) return new Date().toISOString().split('T')[0];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
};

const addDays = (isoDate, days) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return toDate(null);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
};

const parseNaturalDate = (value, fallbackYear) => {
  if (!value) return '';
  const text = stripHtml(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';

  let match = text.match(/\b(\d{1,2})\s*tháng\s*(\d{1,2})(?:\s*,?\s*(\d{4}))?/i);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3] || fallbackYear || new Date().getUTCFullYear());
    return `${year.toString().padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  match = text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
  if (match) {
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    return `${year.toString().padStart(4, '0')}-${String(Number(match[2])).padStart(2, '0')}-${String(
      Number(match[1])
    ).padStart(2, '0')}`;
  }

  match = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s*(\d{4})\b/i
  );
  if (match) {
    const month = ENGLISH_MONTHS[match[1].toLowerCase()];
    return `${match[3]}-${String(month).padStart(2, '0')}-${String(Number(match[2])).padStart(2, '0')}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return '';
};

const cleanLocationName = (value = '') => {
  const location = stripHtml(value).replace(/\s+/g, ' ').trim();
  if (!location) return '';
  if (location.length > 120) return '';
  if (/(RELATED:|prefetch|\.no|http|Xem catalogue|Chương\s*#)/i.test(location)) return '';
  return location;
};

const extractDateRange = (value, fallbackYear) => {
  const text = stripHtml(value).replace(/\s+/g, ' ').trim();
  if (!text) return { startDate: '', endDate: '' };

  const vnRange = text.match(
    /(\d{1,2}\s*tháng\s*\d{1,2}(?:\s*,?\s*\d{4})?)\s*(?:-|–|—|đến|to)\s*(\d{1,2}\s*tháng\s*\d{1,2}(?:\s*,?\s*\d{4})?)/i
  );
  if (vnRange) {
    return {
      startDate: parseNaturalDate(vnRange[1], fallbackYear),
      endDate: parseNaturalDate(vnRange[2], fallbackYear),
    };
  }

  const enRange = text.match(
    /((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s*\d{4})\s*(?:-|–|—|to)\s*((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s*\d{4})/i
  );
  if (enRange) {
    return {
      startDate: parseNaturalDate(enRange[1], fallbackYear),
      endDate: parseNaturalDate(enRange[2], fallbackYear),
    };
  }

  const single = parseNaturalDate(text, fallbackYear);
  return { startDate: single, endDate: '' };
};

const getEmbeddedTerms = (item, taxonomy) =>
  (Array.isArray(item?._embedded?.['wp:term']) ? item._embedded['wp:term'].flat() : [])
    .filter((term) => term?.taxonomy === taxonomy)
    .map((term) => stripHtml(term?.name || ''))
    .filter(Boolean);

const getEmbeddedImageUrl = (item) => {
  const media = Array.isArray(item?._embedded?.['wp:featuredmedia']) ? item._embedded['wp:featuredmedia'][0] : null;
  const full = media?.media_details?.sizes?.full?.source_url;
  return normalizeImageUrl(full || media?.source_url || '');
};

const fetchNguyenPageMetadata = async (url, fallbackImageUrl) => {
  if (!url) {
    return { imageUrl: fallbackImageUrl || '', locationName: '', startDate: '', endDate: '', fullText: '' };
  }
  if (nafPageCache.has(url)) return nafPageCache.get(url);

  const promise = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'text/html',
          'User-Agent': 'JudoooCrawler/1.0 (+https://judooo.art)',
        },
      });
      if (!response.ok) {
        return { imageUrl: fallbackImageUrl || '', locationName: '', startDate: '', endDate: '', fullText: '' };
      }
      const html = await response.text();
      const imageUrl =
        normalizeImageUrl(
          html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || ''
        ) || fallbackImageUrl || '';
      const fullText = stripHtmlRich(html);
      const lines = fullText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const pageYear = Number((html.match(/\b(20\d{2}|19\d{2})\b/) || [])[1] || new Date().getUTCFullYear());

      let locationName = '';
      let startDate = '';
      let endDate = '';

      for (const line of lines.slice(0, 80)) {
        if (!startDate && /(khai mạc|opening|date|thời gian|time)/i.test(line)) {
          const range = extractDateRange(line, pageYear);
          startDate = range.startDate || startDate;
          endDate = range.endDate || endDate;
        }
        if (!locationName && /^(địa điểm|venue)\s*[:\-]/i.test(line)) {
          locationName = cleanLocationName(line.replace(/^(địa điểm|venue)\s*[:\-]\s*/i, '').trim());
        }
        if (!locationName && /(khai mạc|opening)/i.test(line)) {
          const parts = line.split(/[–—-]/).map((part) => part.trim()).filter(Boolean);
          if (parts.length >= 3) {
            locationName = cleanLocationName(parts[parts.length - 2]);
          }
        }
        if (!startDate) {
          const maybeDate = parseNaturalDate(line, pageYear);
          if (maybeDate && /(khai mạc|opening|date|thời gian|time)/i.test(line)) {
            startDate = maybeDate;
          }
        }
        if (locationName && startDate) break;
      }

      return {
        imageUrl,
        locationName: cleanLocationName(locationName),
        startDate,
        endDate,
        fullText,
      };
    } catch {
      return { imageUrl: fallbackImageUrl || '', locationName: '', startDate: '', endDate: '', fullText: '' };
    }
  })();

  nafPageCache.set(url, promise);
  return promise;
};

const inferNguyenCategory = (kind, methodNames, title, summary) => {
  if (kind === 'exhibitions') return 'exhibition';
  const text = `${methodNames.join(' ')} ${title} ${summary}`.toLowerCase();
  if (/(workshop|studio|seminar|talk|lecture|archive|class|course|education)/i.test(text)) {
    return 'workshop';
  }
  return 'exhibition';
};

const fetchPaginatedWpItems = async (endpoint, limit) => {
  const items = [];
  let page = 1;
  let totalPages = NGUYEN_EVENT_MAX_PAGES;

  while (page <= totalPages && page <= NGUYEN_EVENT_MAX_PAGES && !(limit > 0 && items.length >= limit)) {
    const url = new URL(endpoint);
    url.searchParams.set('_embed', '1');
    url.searchParams.set('per_page', String(NGUYEN_EVENT_PER_PAGE));
    url.searchParams.set('page', String(page));
    url.searchParams.set('orderby', 'date');
    url.searchParams.set('order', 'desc');

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'JudoooCrawler/1.0 (+https://judooo.art)',
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
    items.push(...json);
    totalPages = Number(response.headers.get('x-wp-totalpages') || totalPages || page);
    page += 1;
  }

  return limit > 0 ? items.slice(0, limit) : items;
};

const buildNguyenSourceItems = async () => {
  const configs = [
    { kind: 'exhibitions', endpoint: NGUYEN_EXHIBITIONS_API },
    { kind: 'education', endpoint: NGUYEN_EDUCATION_API },
  ];
  const byKey = new Map();

  for (const config of configs) {
    const items = await fetchPaginatedWpItems(config.endpoint, NGUYEN_EVENT_LIMIT);
    for (const item of items) {
      const link = normalizeUrl(item?.link || '', config.endpoint);
      const fallbackImageUrl = getEmbeddedImageUrl(item);
      const pageMeta = await fetchNguyenPageMetadata(link, fallbackImageUrl);
      const title = cleanTitle(item?.title?.rendered || '');
      const excerpt = stripHtmlRich(item?.excerpt?.rendered || '');
      const content = stripHtmlRich(item?.content?.rendered || '');
      const methodNames = getEmbeddedTerms(item, 'method');
      const summary = (content || excerpt).slice(0, 1000);
      const category = inferNguyenCategory(config.kind, methodNames, title, summary);
      const publishedAt = item?.date_gmt || item?.date || null;
      const startDate = pageMeta.startDate || toDate(publishedAt);
      const endDate = pageMeta.endDate || addDays(startDate, config.kind === 'education' ? 1 : 45);
      const dedupeKey = pageMeta.imageUrl || `${config.kind}:${title}:${startDate}`;
      const candidate = {
        score: /\/vn\//i.test(link) ? 2 : 1,
        source_url: config.endpoint,
        external_id: `${config.kind}-${item.id}`,
        source_type: `nguyen-${config.kind}`,
        title,
        summary: summary.slice(0, 500) || null,
        item_url: link || null,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date(`${startDate}T00:00:00Z`).toISOString(),
        raw_payload: {
          source_name: 'Nguyen Art Foundation',
          title,
          summary: summary || null,
          full_text: pageMeta.fullText || content || excerpt || null,
          image_url: pageMeta.imageUrl || fallbackImageUrl || null,
          organizer: 'Nguyen Art Foundation',
          category,
          start_date: startDate,
          end_date: endDate,
          location_name: pageMeta.locationName || 'Ho Chi Minh City',
          method_names: methodNames,
          wp_kind: config.kind,
          wp_id: item.id,
        },
        crawl_status: 'new',
      };

      const existing = byKey.get(dedupeKey);
      if (!existing || candidate.score > existing.score) {
        byKey.set(dedupeKey, candidate);
      }
    }
  }

  return Array.from(byKey.values()).map(({ score, ...row }) => row);
};

const buildEventRow = (item) => {
  const rawStart = item?.raw_payload?.start_date || item.published_at;
  const startDate = toDate(rawStart);
  const endDate = toDate(item?.raw_payload?.end_date || addDays(startDate, 30));
  const city = item?.raw_payload?.city || detectCity(item);
  const center = CITY_CENTERS[city] || CITY_CENTERS['Ho Chi Minh City'];
  const imageUrl =
    item?.raw_payload?.image_url || 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200';
  const sourceHost = (() => {
    try {
      return new URL(item.source_url).hostname.replace(/^www\./, '');
    } catch {
      return 'Internet Source';
    }
  })();
  const descriptionText =
    item?.raw_payload?.full_text ||
    item.summary ||
    (item.item_url ? `Details unavailable from feed. Open the original source: ${item.item_url}` : 'Details unavailable from feed.');
  const slugSeed = item.item_url || `${item.source_url}:${item.external_id}`;

  return {
    title: item.title,
    slug: `${toSlug(item.title || 'event')}-${crypto.createHash('sha1').update(slugSeed).digest('hex').slice(0, 8)}`,
    organizer: item?.raw_payload?.organizer || item?.raw_payload?.source_name || sourceHost,
    startDate,
    endDate,
    location: item?.raw_payload?.location_name || city,
    lat: center.lat,
    lng: center.lng,
    imageUrl,
    description: descriptionText,
    category: item?.raw_payload?.category || DEFAULT_CATEGORY,
    media: [],
    source_url: item.source_url,
    source_item_url: item.item_url || null,
    external_id: item.external_id,
    source_item_id: item.id,
    imported_at: new Date().toISOString(),
  };
};

const upsertEvents = async (sourceItems) => {
  if (!sourceItems.length) return 0;

  const rows = sourceItems.map(buildEventRow);
  const rowsWithPublishing = rows.map((row) => ({
    ...row,
    status: 'published',
    moderation: 'approved',
  }));

  let { error } = await supabase.from('events').upsert(rowsWithPublishing, { onConflict: 'source_url,external_id' });

  if (error) {
    const fallback = await supabase.from('events').upsert(rows, { onConflict: 'source_url,external_id' });
    error = fallback.error;
  }

  if (error) throw error;
  return rows.length;
};

const run = async () => {
  const googleSources = GOOGLE_NEWS_QUERIES.map(googleNewsFeedUrl);
  const rssSources = [...SOURCE_URLS, ...googleSources];
  const seenItemUrls = new Set();
  console.log(
    `Crawler starting with rss_sources=${rssSources.length}, nguyen_events=${NGUYEN_EVENTS_ENABLED}, facebook_groups=${FACEBOOK_GROUP_IDS.length}, facebook_pages=${FACEBOOK_PAGE_IDS.length}.`
  );
  let crawled = 0;
  let ingested = 0;

  for (const sourceUrl of rssSources) {
    try {
      const text = await fetchSource(sourceUrl);
      const rssRecords = parseRssItems(text, sourceUrl);
      const atomRecords = rssRecords.length === 0 ? parseAtomItems(text, sourceUrl) : [];
      const records = (rssRecords.length > 0 ? rssRecords : atomRecords).filter((record) => {
        if (!record.item_url) return true;
        if (seenItemUrls.has(record.item_url)) return false;
        seenItemUrls.add(record.item_url);
        return true;
      });
      crawled += records.length;

      if (!records.length) {
        console.log(`No items parsed from ${sourceUrl}. Response head: ${text.slice(0, 180).replace(/\s+/g, ' ')}`);
        continue;
      }

      const sourceItems = await upsertSourceItems(records);
      const count = await upsertEvents(sourceItems);
      ingested += count;
      console.log(`Source ${sourceUrl}: parsed=${records.length}, upserted_events=${count}`);
    } catch (error) {
      console.error(`Source failed ${sourceUrl}:`, error.message || error);
    }
  }

  if (NGUYEN_EVENTS_ENABLED) {
    try {
      const records = await buildNguyenSourceItems();
      crawled += records.length;
      const sourceItems = await upsertSourceItems(records);
      const count = await upsertEvents(sourceItems);
      ingested += count;
      console.log(`Nguyen Art Foundation: parsed=${records.length}, upserted_events=${count}`);
    } catch (error) {
      console.error('Nguyen Art Foundation source failed:', error.message || error);
    }
  }

  const facebookSources = [
    ...FACEBOOK_GROUP_IDS.map((id) => ({ id, kind: 'group' })),
    ...FACEBOOK_PAGE_IDS.map((id) => ({ id, kind: 'page' })),
  ];

  if (facebookSources.length > 0) {
    if (!FACEBOOK_GRAPH_TOKEN) {
      console.error('Facebook sources configured but FACEBOOK_GRAPH_ACCESS_TOKEN is missing.');
    } else {
      for (const source of facebookSources) {
        try {
          const json = await fetchFacebookFeed(source.id, source.kind);
          const records = parseFacebookItems(json, source.id, source.kind);
          crawled += records.length;
          if (!records.length) {
            console.log(`No facebook posts parsed for ${source.kind} ${source.id}.`);
            continue;
          }
          const sourceItems = await upsertSourceItems(records);
          const count = await upsertEvents(sourceItems);
          ingested += count;
          console.log(`Facebook ${source.kind} ${source.id}: parsed=${records.length}, upserted_events=${count}`);
        } catch (error) {
          console.error(`Facebook source failed ${source.kind} ${source.id}:`, error.message || error);
        }
      }
    }
  }

  console.log(`Done. Crawled items=${crawled}, event upserts=${ingested}`);
};

run().catch((error) => {
  console.error('Crawler failed:', error.message || error);
  process.exit(1);
});
