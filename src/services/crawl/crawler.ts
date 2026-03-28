/**
 * Crawl service — importable module for Vercel serverless.
 *
 * Converted from scripts/crawlToSupabase.mjs + scripts/dedupeEvents.mjs.
 * Runs entirely in-process (no child_process, no file-system scripts).
 *
 * NOTE: Vercel Hobby plan has a 60-second function timeout. Long crawls
 * (many WP sites + HTML scraping) may exceed this limit. Consider
 * splitting into smaller invocations or upgrading to Vercel Pro (300s)
 * if timeouts occur.
 */
import crypto from 'node:crypto';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CrawlResult = {
  crawled: number;
  ingested: number;
  logs: string[];
};

type DedupeResult = {
  deleted: number;
  total: number;
  logs: string[];
};

type SourceItem = {
  id?: string;
  source_url: string;
  external_id: string;
  source_type: string;
  title: string;
  summary: string | null;
  item_url: string | null;
  published_at: string | null;
  raw_payload: Record<string, unknown>;
  crawl_status: string;
};

type CityName = keyof typeof CITY_CENTERS;

// ---------------------------------------------------------------------------
// Static crawl config (hardcoded — these are public URLs, not secrets)
// ---------------------------------------------------------------------------

const SOURCE_URLS = [
  'https://hanoigrapevine.com/feed/',
  'https://saigoneer.com/index.php?option=com_ninjarsssyndicator&feed_id=5&format=raw',
  'https://galeriequynh.com/feed/',
  'https://factoryartscentre.com/feed/',
];

const WP_SITES = [
  'https://factoryartscentre.com',
  'https://artvietnamgallery.com',
  'https://nguyenartgallery.com',
  'https://san-art.co',
];

const HTML_SCRAPE_URLS = [
  'https://manziart.space',
  'https://cucgallery.vn',
  'https://vccavietnam.com',
  'https://vnfam.vn',
];

const NGUYEN_EVENTS_ENABLED = true;
const NGUYEN_EXHIBITIONS_API =
  'https://nguyenartfoundation.com/wp-json/wp/v2/exhibitions';
const NGUYEN_EDUCATION_API =
  'https://nguyenartfoundation.com/wp-json/wp/v2/education';
const NGUYEN_EVENT_LIMIT = 0;
const NGUYEN_EVENT_MAX_PAGES = 20;
const NGUYEN_EVENT_PER_PAGE = 100;

const DEFAULT_LOCATION = 'Vietnam';
const DEFAULT_CATEGORY = 'exhibition';
const BATCH_LIMIT = 30;

// Google News RSS queries — free, no API key needed
const GOOGLE_NEWS_QUERIES: string[] = [
  'triển lãm nghệ thuật Việt Nam',
  'triển lãm tranh Hồ Chí Minh',
  'triển lãm tranh Hà Nội',
  'art exhibition Vietnam',
  'art exhibition Ho Chi Minh City',
  'art exhibition Hanoi',
  'gallery opening Vietnam',
  'sự kiện nghệ thuật Việt Nam',
  'workshop nghệ thuật Sài Gòn',
  'đấu giá tranh Việt Nam',
];
const GOOGLE_NEWS_HL = 'vi';
const GOOGLE_NEWS_GL = 'VN';
const GOOGLE_NEWS_CEID = 'VN:vi';

// Facebook (no token configured by default)
const FACEBOOK_GROUP_IDS: string[] = [];
const FACEBOOK_PAGE_IDS: string[] = [];
const FACEBOOK_LIMIT = 25;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CITY_CENTERS = {
  'Ho Chi Minh City': { lat: 10.7769, lng: 106.7009 },
  Hanoi: { lat: 21.0285, lng: 105.8542 },
  'Da Nang': { lat: 16.0544, lng: 108.2022 },
  'Hai Phong': { lat: 20.8449, lng: 106.6881 },
  Hue: { lat: 16.4637, lng: 107.5909 },
  'Can Tho': { lat: 10.0452, lng: 105.7469 },
} as const;

const ENGLISH_MONTHS: Record<string, number> = {
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

// ---------------------------------------------------------------------------
// Event keyword filter — only keep items that look like art events
// ---------------------------------------------------------------------------

const EVENT_KEYWORDS_EN = [
  'exhibition', 'exhibit', 'gallery', 'art show', 'art fair', 'solo show',
  'group show', 'opening', 'vernissage', 'workshop', 'art workshop',
  'auction', 'art auction', 'residency', 'art residency', 'biennale',
  'biennial', 'retrospective', 'installation', 'sculpture', 'painting',
  'photography', 'contemporary art', 'fine art', 'visual art', 'art space',
  'museum', 'curator', 'curated', 'art event', 'cultural event',
  'art festival', 'festival', 'performance art', 'mixed media',
  'collection', 'artwork', 'artworks', 'artist talk', 'art talk',
  'creative', 'ceramic', 'printmaking', 'watercolor', 'oil painting',
  'lacquer', 'silk painting', 'woodcut', 'lithograph', 'etching',
];

const EVENT_KEYWORDS_VI = [
  'triển lãm', 'trưng bày', 'phòng tranh', 'gallery', 'nghệ thuật',
  'hội họa', 'điêu khắc', 'sắp đặt', 'workshop', 'hội thảo',
  'khai mạc', 'đấu giá', 'bảo tàng', 'mỹ thuật', 'nghệ sĩ',
  'sự kiện nghệ thuật', 'sự kiện', 'liên hoan', 'festival',
  'sơn dầu', 'sơn mài', 'lụa', 'gốm', 'ceramic', 'tranh',
  'tác phẩm', 'giám tuyển', 'curator', 'không gian nghệ thuật',
  'art space', 'triển lãm cá nhân', 'triển lãm nhóm',
  'nhiếp ảnh', 'photography', 'đương đại', 'contemporary',
  'trình diễn', 'performance', 'video art', 'new media',
];

const ALL_EVENT_KEYWORDS = [...EVENT_KEYWORDS_EN, ...EVENT_KEYWORDS_VI].map((k) =>
  k.toLowerCase(),
);

/**
 * Returns true if the item's title or summary contains at least one
 * art/event-related keyword. Sources that are inherently about art
 * (gallery websites, art foundations) bypass this filter.
 */
const ART_SOURCE_DOMAINS = [
  'galeriequynh.com',
  'factoryartscentre.com',
  'artvietnamgallery.com',
  'nguyenartgallery.com',
  'san-art.co',
  'nguyenartfoundation.com',
  'manziart.space',
  'cucgallery.vn',
  'vccavietnam.com',
  'vnfam.vn',
];

const isArtEventItem = (item: SourceItem): boolean => {
  // Items from dedicated art sources always pass
  try {
    const host = new URL(item.source_url).hostname.replace(/^www\./, '');
    if (ART_SOURCE_DOMAINS.some((d) => host.includes(d))) return true;
  } catch {
    // ignore invalid URLs
  }

  // Check title + summary for event keywords
  const text = `${item.title} ${item.summary || ''}`.toLowerCase();
  return ALL_EVENT_KEYWORDS.some((keyword) => text.includes(keyword));
};

// ---------------------------------------------------------------------------
// Logger helper — collects logs and also console.logs for debugging
// ---------------------------------------------------------------------------

function createLogger(onLog?: (message: string) => void) {
  const logs: string[] = [];
  return {
    logs,
    log(msg: string) {
      logs.push(msg);
      console.log(msg);
      onLog?.(msg);
    },
    error(msg: string) {
      const errMsg = `[ERROR] ${msg}`;
      logs.push(errMsg);
      console.error(msg);
      onLog?.(errMsg);
    },
  };
}

// ---------------------------------------------------------------------------
// Supabase client factory
// ---------------------------------------------------------------------------

function buildSupabaseClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

  if (!url || !key) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

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
    .replace(/&#8211;|&ndash;/g, '\u2013')
    .replace(/&#8212;|&mdash;/g, '\u2014')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const stripHtml = (input = '') =>
  decodeXml(input).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const stripHtmlRich = (input = '') =>
  decodeXml(input)
    .replace(/<\/(p|div|br|li|h1|h2|h3|h4|h5|h6)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\u2022 ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();

const tagValue = (block: string, tag: string) => {
  const match = block.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'),
  );
  return match ? decodeXml(match[1].trim()) : '';
};

const cleanTitle = (raw = '') => {
  let title = stripHtml(raw)
    .replace(/\s+/g, ' ')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();
  title = title
    .replace(
      /\s*[|\-\u2013\u2014]\s*(facebook|instagram|google news|youtube|x|twitter|hanoi grapevine)\s*$/i,
      '',
    )
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
    ['w', 'width', 'h', 'height', 'fit', 'resize', 'crop'].forEach((k) =>
      u.searchParams.delete(k),
    );
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

const detectCity = (item: {
  title?: string;
  summary?: string | null;
  raw_payload?: Record<string, unknown>;
  item_url?: string | null;
}): CityName => {
  const text =
    `${item?.title || ''}\n${item?.summary || ''}\n${(item?.raw_payload?.full_text as string) || ''}\n${item?.item_url || ''}\n${(item?.raw_payload?.location_name as string) || ''}`.toLowerCase();
  const rules: Array<{ city: CityName; patterns: RegExp[] }> = [
    {
      city: 'Ho Chi Minh City',
      patterns: [/ho chi minh/, /\bhcmc\b/, /\bsaigon\b/, /thủ đức/, /thu duc/],
    },
    { city: 'Hanoi', patterns: [/\bhanoi\b/, /\bha noi\b/] },
    { city: 'Da Nang', patterns: [/\bda nang\b/, /\bdanang\b/] },
    { city: 'Hai Phong', patterns: [/\bhai phong\b/, /\bhaiphong\b/] },
    { city: 'Hue', patterns: [/\bhue\b/, /\bhu\u1ebf\b/] },
    { city: 'Can Tho', patterns: [/\bcan tho\b/, /\bc\u1ea7n th\u01a1\b/] },
  ];
  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return rule.city;
    }
  }
  return DEFAULT_LOCATION === 'Vietnam' ? 'Ho Chi Minh City' : 'Ho Chi Minh City';
};

const firstAttr = (block: string, regex: RegExp) => {
  const match = block.match(regex);
  return match ? decodeXml(match[1]) : '';
};

// ---------------------------------------------------------------------------
// Image extraction
// ---------------------------------------------------------------------------

const extractImageFromXmlBlock = (block: string) => {
  const enclosureUrl = firstAttr(
    block,
    /<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i,
  );
  if (enclosureUrl) return normalizeImageUrl(enclosureUrl);

  const mediaContentUrl = firstAttr(
    block,
    /<media:content[^>]*url=["']([^"']+)["'][^>]*>/i,
  );
  if (mediaContentUrl) return normalizeImageUrl(mediaContentUrl);

  const mediaThumbUrl = firstAttr(
    block,
    /<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*>/i,
  );
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
        return {
          url: parts[0],
          width: Number((parts[1] || '').replace('w', '')) || 0,
        };
      })
      .sort((a, b) => b.width - a.width);
    if (candidates[0]?.url) return normalizeImageUrl(candidates[0].url);
  }

  const imgSrc = firstAttr(html, /<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (imgSrc) return normalizeImageUrl(imgSrc);

  return '';
};

const extractAllImagesFromXmlBlock = (block: string) => {
  const images: string[] = [];
  const contentHtml =
    tagValue(block, 'content:encoded') ||
    tagValue(block, 'description') ||
    tagValue(block, 'content') ||
    tagValue(block, 'summary');

  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(contentHtml)) !== null) {
    const url = normalizeImageUrl(match[1]);
    if (url && !images.includes(url)) images.push(url);
  }

  const srcsetRegex = /<img[^>]*srcset=["']([^"']+)["'][^>]*>/gi;
  while ((match = srcsetRegex.exec(contentHtml)) !== null) {
    const candidates = match[1]
      .split(',')
      .map((e) => e.trim().split(/\s+/))
      .sort(
        (a, b) =>
          (Number((b[1] || '').replace('w', '')) || 0) -
          (Number((a[1] || '').replace('w', '')) || 0),
      );
    for (const [url] of candidates) {
      const normalized = normalizeImageUrl(url);
      if (normalized && !images.includes(normalized)) images.push(normalized);
    }
  }

  const mediaRegex = /<media:content[^>]*url=["']([^"']+)["'][^>]*>/gi;
  while ((match = mediaRegex.exec(block)) !== null) {
    const url = normalizeImageUrl(match[1]);
    if (url && !images.includes(url)) images.push(url);
  }

  return images;
};

const extractAllImages = (html: string) => {
  const images: string[] = [];
  const ogImage =
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    )?.[1] ||
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    )?.[1];
  if (ogImage) images.push(normalizeImageUrl(ogImage));

  const imgRegex = /<img[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const url = normalizeImageUrl(match[1]);
    if (
      url &&
      !images.includes(url) &&
      !/logo|icon|avatar|placeholder|pixel|tracking/i.test(url)
    ) {
      images.push(url);
    }
  }

  const srcsetRegex = /<img[^>]*srcset=["']([^"']+)["'][^>]*>/gi;
  while ((match = srcsetRegex.exec(html)) !== null) {
    const candidates = match[1]
      .split(',')
      .map((e) => e.trim().split(/\s+/))
      .sort(
        (a, b) =>
          (Number((b[1] || '').replace('w', '')) || 0) -
          (Number((a[1] || '').replace('w', '')) || 0),
      );
    for (const [url] of candidates) {
      const normalized = normalizeImageUrl(url);
      if (normalized && !images.includes(normalized)) images.push(normalized);
    }
  }

  const bgRegex =
    /background(?:-image)?\s*:\s*url\(["']?(https?:\/\/[^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
    const url = normalizeImageUrl(match[1]);
    if (
      url &&
      !images.includes(url) &&
      !/logo|icon|avatar|placeholder/i.test(url)
    ) {
      images.push(url);
    }
  }

  return images;
};

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

const parseRssItems = (xml: string, sourceUrl: string): SourceItem[] => {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return items.slice(0, BATCH_LIMIT).map((item) => {
    const title = cleanTitle(tagValue(item, 'title'));
    const link = stripHtml(tagValue(item, 'link'));
    const guid = stripHtml(tagValue(item, 'guid'));
    const htmlText =
      tagValue(item, 'content:encoded') || tagValue(item, 'description');
    const fullText = stripHtmlRich(htmlText);
    const summary = fullText.slice(0, 500).trim();
    const imageUrl = extractImageFromXmlBlock(item);
    const pubDateRaw = stripHtml(tagValue(item, 'pubDate'));
    const pubDate = pubDateRaw ? new Date(pubDateRaw) : null;

    const externalId =
      guid ||
      link ||
      crypto.createHash('sha1').update(`${sourceUrl}:${title}`).digest('hex');

    return {
      source_url: sourceUrl,
      external_id: externalId,
      source_type: 'rss',
      title: title || 'Untitled Event',
      summary: summary || null,
      item_url: link || null,
      published_at:
        pubDate && !Number.isNaN(pubDate.getTime())
          ? pubDate.toISOString()
          : null,
      raw_payload: {
        title,
        link,
        guid,
        description: summary || null,
        full_text: fullText || null,
        image_url: imageUrl || null,
        gallery_images: extractAllImagesFromXmlBlock(item),
        pubDate: pubDateRaw || null,
      },
      crawl_status: 'new',
    };
  });
};

const parseAtomItems = (xml: string, sourceUrl: string): SourceItem[] => {
  const entries = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  return entries.slice(0, BATCH_LIMIT).map((entry) => {
    const title = cleanTitle(tagValue(entry, 'title'));
    const fullText = stripHtmlRich(
      tagValue(entry, 'content') || tagValue(entry, 'summary'),
    );
    const summary = fullText.slice(0, 500).trim();
    const updated = stripHtml(
      tagValue(entry, 'updated') || tagValue(entry, 'published'),
    );
    const id = stripHtml(tagValue(entry, 'id'));
    const linkMatch = entry.match(
      /<link[^>]*href=["']([^"']+)["'][^>]*>/i,
    );
    const link = linkMatch ? decodeXml(linkMatch[1]) : '';
    const imageUrl = extractImageFromXmlBlock(entry);
    const pubDate = updated ? new Date(updated) : null;
    const externalId =
      id ||
      link ||
      crypto.createHash('sha1').update(`${sourceUrl}:${title}`).digest('hex');

    return {
      source_url: sourceUrl,
      external_id: externalId,
      source_type: 'atom',
      title: title || 'Untitled Event',
      summary: summary || null,
      item_url: link || null,
      published_at:
        pubDate && !Number.isNaN(pubDate.getTime())
          ? pubDate.toISOString()
          : null,
      raw_payload: {
        title,
        link,
        id,
        summary,
        full_text: fullText || null,
        image_url: imageUrl || null,
        gallery_images: extractAllImagesFromXmlBlock(entry),
        updated: updated || null,
      },
      crawl_status: 'new',
    };
  });
};

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const toDate = (value: string | null | undefined) => {
  if (!value) return new Date().toISOString().split('T')[0];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
};

const addDays = (isoDate: string, days: number) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return toDate(null);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
};

const parseNaturalDate = (value: string | undefined, fallbackYear?: number) => {
  if (!value) return '';
  const text = stripHtml(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';

  let match = text.match(
    /\b(\d{1,2})\s*th\u00e1ng\s*(\d{1,2})(?:\s*,?\s*(\d{4}))?/i,
  );
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(
      match[3] || fallbackYear || new Date().getUTCFullYear(),
    );
    return `${year.toString().padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  match = text.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
  if (match) {
    const year = Number(
      match[3].length === 2 ? `20${match[3]}` : match[3],
    );
    return `${year.toString().padStart(4, '0')}-${String(Number(match[2])).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
  }

  match = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s*(\d{4})\b/i,
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
  if (
    /(RELATED:|prefetch|\.no|http|Xem catalogue|Chương\s*#)/i.test(location)
  )
    return '';
  return location;
};

const extractDateRange = (value: string, fallbackYear?: number) => {
  const text = stripHtml(value).replace(/\s+/g, ' ').trim();
  if (!text) return { startDate: '', endDate: '' };

  const vnRange = text.match(
    /(\d{1,2}\s*th\u00e1ng\s*\d{1,2}(?:\s*,?\s*\d{4})?)\s*(?:-|\u2013|\u2014|\u0111\u1ebfn|to)\s*(\d{1,2}\s*th\u00e1ng\s*\d{1,2}(?:\s*,?\s*\d{4})?)/i,
  );
  if (vnRange) {
    return {
      startDate: parseNaturalDate(vnRange[1], fallbackYear),
      endDate: parseNaturalDate(vnRange[2], fallbackYear),
    };
  }

  const enRange = text.match(
    /((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s*\d{4})\s*(?:-|\u2013|\u2014|to)\s*((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s*\d{4})/i,
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

// ---------------------------------------------------------------------------
// WordPress helpers
// ---------------------------------------------------------------------------

type WpItem = {
  id: number;
  link?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  content?: { rendered?: string };
  date_gmt?: string;
  date?: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
      media_details?: { sizes?: { full?: { source_url?: string } } };
    }>;
    'wp:term'?: Array<Array<{ taxonomy?: string; name?: string }>>;
  };
};

const getEmbeddedTerms = (item: WpItem, taxonomy: string) =>
  (Array.isArray(item?._embedded?.['wp:term'])
    ? item._embedded['wp:term'].flat()
    : []
  )
    .filter((term) => term?.taxonomy === taxonomy)
    .map((term) => stripHtml(term?.name || ''))
    .filter(Boolean);

const getEmbeddedImageUrl = (item: WpItem) => {
  const media = Array.isArray(item?._embedded?.['wp:featuredmedia'])
    ? item._embedded['wp:featuredmedia'][0]
    : null;
  const full = media?.media_details?.sizes?.full?.source_url;
  return normalizeImageUrl(full || media?.source_url || '');
};

const fetchPaginatedWpItems = async (
  endpoint: string,
  limit: number,
): Promise<WpItem[]> => {
  const items: WpItem[] = [];
  let page = 1;
  let totalPages = NGUYEN_EVENT_MAX_PAGES;

  while (
    page <= totalPages &&
    page <= NGUYEN_EVENT_MAX_PAGES &&
    !(limit > 0 && items.length >= limit)
  ) {
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
        throw new Error(
          `WordPress API fetch failed (${response.status}) for ${endpoint}`,
        );
      }
      break;
    }

    const json = await response.json();
    if (!Array.isArray(json) || json.length === 0) break;
    items.push(...json);
    totalPages = Number(
      response.headers.get('x-wp-totalpages') || totalPages || page,
    );
    page += 1;
  }

  return limit > 0 ? items.slice(0, limit) : items;
};

// ---------------------------------------------------------------------------
// Nguyen Art Foundation page metadata scraper
// ---------------------------------------------------------------------------

const nafPageCache = new Map<string, Promise<{
  imageUrl: string;
  locationName: string;
  startDate: string;
  endDate: string;
  fullText: string;
}>>();

const fetchNguyenPageMetadata = async (
  url: string,
  fallbackImageUrl: string,
) => {
  const empty = {
    imageUrl: fallbackImageUrl || '',
    locationName: '',
    startDate: '',
    endDate: '',
    fullText: '',
  };
  if (!url) return empty;
  if (nafPageCache.has(url)) return nafPageCache.get(url)!;

  const promise = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'text/html',
          'User-Agent': 'JudoooCrawler/1.0 (+https://judooo.art)',
        },
      });
      if (!response.ok) return empty;
      const html = await response.text();
      const imageUrl =
        normalizeImageUrl(
          html.match(
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
          )?.[1] || '',
        ) ||
        fallbackImageUrl ||
        '';
      const fullText = stripHtmlRich(html);
      const lines = fullText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const pageYear = Number(
        (html.match(/\b(20\d{2}|19\d{2})\b/) || [])[1] ||
          new Date().getUTCFullYear(),
      );

      let locationName = '';
      let startDate = '';
      let endDate = '';

      for (const line of lines.slice(0, 80)) {
        if (
          !startDate &&
          /(khai m\u1ea1c|opening|date|th\u1eddi gian|time)/i.test(line)
        ) {
          const range = extractDateRange(line, pageYear);
          startDate = range.startDate || startDate;
          endDate = range.endDate || endDate;
        }
        if (
          !locationName &&
          /^(\u0111\u1ecba \u0111i\u1ec3m|venue)\s*[:\-]/i.test(line)
        ) {
          locationName = cleanLocationName(
            line
              .replace(
                /^(\u0111\u1ecba \u0111i\u1ec3m|venue)\s*[:\-]\s*/i,
                '',
              )
              .trim(),
          );
        }
        if (
          !locationName &&
          /(khai m\u1ea1c|opening)/i.test(line)
        ) {
          const parts = line
            .split(/[\u2013\u2014-]/)
            .map((part) => part.trim())
            .filter(Boolean);
          if (parts.length >= 3) {
            locationName = cleanLocationName(parts[parts.length - 2]);
          }
        }
        if (!startDate) {
          const maybeDate = parseNaturalDate(line, pageYear);
          if (
            maybeDate &&
            /(khai m\u1ea1c|opening|date|th\u1eddi gian|time)/i.test(line)
          ) {
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
      return empty;
    }
  })();

  nafPageCache.set(url, promise);
  return promise;
};

const inferNguyenCategory = (
  kind: string,
  methodNames: string[],
  title: string,
  summary: string,
) => {
  if (kind === 'exhibitions') return 'exhibition';
  const text = `${methodNames.join(' ')} ${title} ${summary}`.toLowerCase();
  if (
    /(workshop|studio|seminar|talk|lecture|archive|class|course|education)/i.test(
      text,
    )
  ) {
    return 'workshop';
  }
  return 'exhibition';
};

// ---------------------------------------------------------------------------
// Source builders
// ---------------------------------------------------------------------------

const buildNguyenSourceItems = async (): Promise<SourceItem[]> => {
  const configs = [
    { kind: 'exhibitions', endpoint: NGUYEN_EXHIBITIONS_API },
    { kind: 'education', endpoint: NGUYEN_EDUCATION_API },
  ];
  const byKey = new Map<string, SourceItem & { score: number }>();

  for (const config of configs) {
    const items = await fetchPaginatedWpItems(
      config.endpoint,
      NGUYEN_EVENT_LIMIT,
    );
    for (const item of items) {
      const link = normalizeUrl(item?.link || '', config.endpoint);
      const fallbackImageUrl = getEmbeddedImageUrl(item);
      const pageMeta = await fetchNguyenPageMetadata(link, fallbackImageUrl);
      const title = cleanTitle(item?.title?.rendered || '');
      const excerpt = stripHtmlRich(item?.excerpt?.rendered || '');
      const content = stripHtmlRich(item?.content?.rendered || '');
      const methodNames = getEmbeddedTerms(item, 'method');
      const summary = (content || excerpt).slice(0, 1000);
      const category = inferNguyenCategory(
        config.kind,
        methodNames,
        title,
        summary,
      );
      const publishedAt = item?.date_gmt || item?.date || null;
      const startDate = pageMeta.startDate || toDate(publishedAt);
      const endDate =
        pageMeta.endDate ||
        addDays(startDate, config.kind === 'education' ? 1 : 45);
      const dedupeKey =
        pageMeta.imageUrl || `${config.kind}:${title}:${startDate}`;
      const candidate = {
        score: /\/vn\//i.test(link) ? 2 : 1,
        source_url: config.endpoint,
        external_id: `${config.kind}-${item.id}`,
        source_type: `nguyen-${config.kind}`,
        title,
        summary: summary.slice(0, 500) || null,
        item_url: link || null,
        published_at: publishedAt
          ? new Date(publishedAt).toISOString()
          : new Date(`${startDate}T00:00:00Z`).toISOString(),
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

  return Array.from(byKey.values()).map(({ score: _score, ...row }) => row);
};

const buildWpSiteSourceItems = async (
  siteBaseUrl: string,
): Promise<SourceItem[]> => {
  const apiBase = siteBaseUrl.replace(/\/+$/, '');
  const endpoint = `${apiBase}/wp-json/wp/v2/posts`;
  const items = await fetchPaginatedWpItems(endpoint, BATCH_LIMIT);
  const results: SourceItem[] = [];

  for (const item of items) {
    const title = cleanTitle(item?.title?.rendered || '');
    const excerpt = stripHtmlRich(item?.excerpt?.rendered || '');
    const content = stripHtmlRich(item?.content?.rendered || '');
    const htmlContent = item?.content?.rendered || '';
    const summary = (content || excerpt).slice(0, 1000);
    const link = normalizeUrl(item?.link || '', apiBase);
    const publishedAt = item?.date_gmt || item?.date || null;
    const featuredImage = getEmbeddedImageUrl(item);

    const galleryImages: string[] = [];
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(htmlContent)) !== null) {
      const imgUrl = normalizeImageUrl(imgMatch[1]);
      if (imgUrl && !galleryImages.includes(imgUrl)) galleryImages.push(imgUrl);
    }
    const srcsetRegex = /<img[^>]*srcset=["']([^"']+)["'][^>]*>/gi;
    let srcsetMatch;
    while ((srcsetMatch = srcsetRegex.exec(htmlContent)) !== null) {
      const candidates = srcsetMatch[1]
        .split(',')
        .map((e) => e.trim().split(/\s+/)[0])
        .map(normalizeImageUrl)
        .filter(Boolean);
      for (const url of candidates) {
        if (!galleryImages.includes(url)) galleryImages.push(url);
      }
    }

    const imageUrl = featuredImage || galleryImages[0] || '';
    const startDate = toDate(publishedAt);
    const endDate = addDays(startDate, 30);
    let hostName: string;
    try {
      hostName = new URL(apiBase).hostname.replace(/^www\./, '');
    } catch {
      hostName = apiBase;
    }

    results.push({
      source_url: endpoint,
      external_id: `wp-post-${item.id}`,
      source_type: 'wordpress',
      title: title || 'Untitled Event',
      summary: summary.slice(0, 500) || null,
      item_url: link || null,
      published_at: publishedAt
        ? new Date(publishedAt).toISOString()
        : null,
      raw_payload: {
        source_name: hostName,
        title,
        summary: summary || null,
        full_text: content || excerpt || null,
        image_url: imageUrl || null,
        gallery_images: galleryImages.length > 0 ? galleryImages : null,
        organizer: hostName,
        category: DEFAULT_CATEGORY,
        start_date: startDate,
        end_date: endDate,
        location_name: detectCity({ title, summary, item_url: link }),
      },
      crawl_status: 'new',
    });
  }

  return results;
};

// ---------------------------------------------------------------------------
// HTML scraper
// ---------------------------------------------------------------------------

const JSON_LD_EVENT_TYPES = new Set([
  'Event',
  'ExhibitionEvent',
  'VisualArtsEvent',
  'Festival',
  'TheaterEvent',
  'MusicEvent',
  'SocialEvent',
  'BusinessEvent',
  'EducationEvent',
  'SaleEvent',
]);

const extractJsonLdItem = (item: Record<string, unknown>) => {
  const typeRaw = item['@type'];
  const types = Array.isArray(typeRaw) ? typeRaw : [typeRaw];
  if (!types.some((t) => typeof t === 'string' && JSON_LD_EVENT_TYPES.has(t))) return null;

  const loc = item.location as Record<string, unknown> | undefined;
  const address = loc?.address as Record<string, string> | undefined;
  const locationName =
    (loc?.name as string) ||
    address?.addressLocality ||
    address?.streetAddress ||
    '';

  const imageRaw = item.image;
  const imageUrl =
    typeof imageRaw === 'string'
      ? imageRaw
      : Array.isArray(imageRaw)
        ? (imageRaw[0] as string) || ''
        : (imageRaw as Record<string, string>)?.url || '';

  return {
    title: cleanTitle((item.name as string) || ''),
    description: stripHtmlRich((item.description as string) || ''),
    startDate: (item.startDate as string) || '',
    endDate: (item.endDate as string) || '',
    location: locationName,
    imageUrl: normalizeImageUrl(imageUrl),
    url: (item.url as string) || '',
  };
};

const extractJsonLdEvents = (html: string, _sourceUrl: string) => {
  const results: Array<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    imageUrl: string;
    url: string;
  }> = [];
  const jsonLdRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        // Handle direct event objects
        const ev = extractJsonLdItem(item as Record<string, unknown>);
        if (ev) { results.push(ev); continue; }

        // Handle @graph arrays (common in WordPress sites)
        const graph = (item as Record<string, unknown>)['@graph'];
        if (Array.isArray(graph)) {
          for (const node of graph) {
            const gev = extractJsonLdItem(node as Record<string, unknown>);
            if (gev) results.push(gev);
          }
        }
      }
    } catch {
      // invalid JSON-LD
    }
  }
  return results;
};

const extractOgMeta = (html: string) => {
  const og: Record<string, string> = {};
  const metaRegex =
    /<meta[^>]+property=["'](og:[^"']+)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    og[match[1]] = decodeXml(match[2]);
  }
  const metaRegex2 =
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["'](og:[^"']+)["'][^>]*>/gi;
  while ((match = metaRegex2.exec(html)) !== null) {
    og[match[2]] = decodeXml(match[1]);
  }
  return og;
};

const scrapeHtmlPage = async (pageUrl: string) => {
  try {
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  } catch {
    return '';
  }
};

const findSubpageLinks = (html: string, baseUrl: string) => {
  const links: string[] = [];
  const linkRegex = /<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const fullUrl = normalizeUrl(href, baseUrl);
    if (!fullUrl) continue;
    if (
      /(exhibit|event|show|workshop|program|display|gallery|collection|trung-bay|trien-lam|su-kien)/i.test(
        fullUrl,
      ) &&
      fullUrl.startsWith(
        baseUrl
          .replace(/\/+$/, '')
          .split('/')
          .slice(0, 3)
          .join('/'),
      )
    ) {
      if (!links.includes(fullUrl)) links.push(fullUrl);
    }
  }
  return links.slice(0, BATCH_LIMIT);
};

const buildHtmlScrapedItems = async (
  siteUrl: string,
  logger: ReturnType<typeof createLogger>,
): Promise<SourceItem[]> => {
  const html = await scrapeHtmlPage(siteUrl);
  if (!html) return [];

  let hostName: string;
  try {
    hostName = new URL(siteUrl).hostname.replace(/^www\./, '');
  } catch {
    hostName = siteUrl;
  }

  const results: SourceItem[] = [];

  // 1. Try JSON-LD structured data first
  const jsonLdEvents = extractJsonLdEvents(html, siteUrl);
  for (const ev of jsonLdEvents) {
    const allImages = ev.imageUrl ? [ev.imageUrl] : [];
    results.push({
      source_url: siteUrl,
      external_id: crypto
        .createHash('sha1')
        .update(`${siteUrl}:${ev.title}`)
        .digest('hex'),
      source_type: 'html-jsonld',
      title: ev.title || 'Untitled Event',
      summary: ev.description?.slice(0, 500) || null,
      item_url: ev.url || siteUrl,
      published_at: ev.startDate
        ? new Date(ev.startDate).toISOString()
        : new Date().toISOString(),
      raw_payload: {
        source_name: hostName,
        title: ev.title,
        summary: ev.description?.slice(0, 500) || null,
        full_text: ev.description || null,
        image_url: ev.imageUrl || null,
        gallery_images: allImages.length > 0 ? allImages : null,
        organizer: hostName,
        category: DEFAULT_CATEGORY,
        start_date: ev.startDate ? toDate(ev.startDate) : toDate(null),
        end_date: ev.endDate ? toDate(ev.endDate) : '',
        location_name: ev.location || '',
      },
      crawl_status: 'new',
    });
  }

  if (results.length > 0) return results;

  // 2. Follow exhibition/event subpage links
  const subpageLinks = findSubpageLinks(html, siteUrl);
  logger.log(
    `  HTML scraper: found ${subpageLinks.length} potential event links on ${siteUrl}`,
  );

  for (const link of subpageLinks) {
    try {
      const pageHtml = await scrapeHtmlPage(link);
      if (!pageHtml) continue;

      const subJsonLd = extractJsonLdEvents(pageHtml, link);
      if (subJsonLd.length > 0) {
        for (const ev of subJsonLd) {
          const allImages = extractAllImages(pageHtml);
          results.push({
            source_url: siteUrl,
            external_id: crypto
              .createHash('sha1')
              .update(`${siteUrl}:${ev.title}`)
              .digest('hex'),
            source_type: 'html-jsonld',
            title: ev.title || 'Untitled Event',
            summary: ev.description?.slice(0, 500) || null,
            item_url: link,
            published_at: ev.startDate
              ? new Date(ev.startDate).toISOString()
              : new Date().toISOString(),
            raw_payload: {
              source_name: hostName,
              title: ev.title,
              summary: ev.description?.slice(0, 500) || null,
              full_text: ev.description || null,
              image_url: allImages[0] || ev.imageUrl || null,
              gallery_images: allImages.length > 0 ? allImages : null,
              organizer: hostName,
              category: DEFAULT_CATEGORY,
              start_date: ev.startDate ? toDate(ev.startDate) : toDate(null),
              end_date: ev.endDate ? toDate(ev.endDate) : '',
              location_name: ev.location || '',
            },
            crawl_status: 'new',
          });
        }
        continue;
      }

      // Fallback: OG tags + page content
      const og = extractOgMeta(pageHtml);
      const title = cleanTitle(og['og:title'] || '');
      if (!title || title === 'Untitled Event') continue;

      const allImages = extractAllImages(pageHtml);
      const fullText = stripHtmlRich(pageHtml).slice(0, 2000);
      const pageYear = Number(
        (pageHtml.match(/\b(20\d{2})\b/) || [])[1] ||
          new Date().getUTCFullYear(),
      );

      let startDate = '';
      let endDate = '';
      const lines = fullText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      for (const line of lines.slice(0, 60)) {
        if (
          !startDate &&
          /(khai m\u1ea1c|opening|date|th\u1eddi gian|time|from|duration)/i.test(
            line,
          )
        ) {
          const range = extractDateRange(line, pageYear);
          startDate = range.startDate || startDate;
          endDate = range.endDate || endDate;
        }
        if (startDate) break;
      }

      results.push({
        source_url: siteUrl,
        external_id: crypto
          .createHash('sha1')
          .update(`${siteUrl}:${title}`)
          .digest('hex'),
        source_type: 'html-og',
        title,
        summary: stripHtml(og['og:description'] || '').slice(0, 500) || null,
        item_url: link,
        published_at: new Date().toISOString(),
        raw_payload: {
          source_name: hostName,
          title,
          summary:
            stripHtml(og['og:description'] || '').slice(0, 500) || null,
          full_text: fullText || null,
          image_url: allImages[0] || null,
          gallery_images: allImages.length > 0 ? allImages : null,
          organizer: hostName,
          category: DEFAULT_CATEGORY,
          start_date: startDate || toDate(null),
          end_date: endDate || '',
          location_name: detectCity({
            title,
            summary: og['og:description'] || '',
            item_url: link,
          }),
        },
        crawl_status: 'new',
      });
    } catch (error) {
      logger.error(
        `  HTML scraper subpage failed ${link}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return results;
};

// ---------------------------------------------------------------------------
// Google News feed URL builder
// ---------------------------------------------------------------------------

const googleNewsFeedUrl = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${encodeURIComponent(GOOGLE_NEWS_HL)}&gl=${encodeURIComponent(GOOGLE_NEWS_GL)}&ceid=${encodeURIComponent(GOOGLE_NEWS_CEID)}`;

// ---------------------------------------------------------------------------
// Facebook fetcher + parser
// ---------------------------------------------------------------------------

const fetchFacebookFeed = async (
  sourceId: string,
  sourceKind: string,
  token: string,
) => {
  const edge = sourceKind === 'group' ? 'feed' : 'posts';
  const endpoint = new URL(
    `https://graph.facebook.com/v21.0/${sourceId}/${edge}`,
  );
  endpoint.searchParams.set(
    'fields',
    'id,message,created_time,permalink_url,attachments{media,type,url,title,description}',
  );
  endpoint.searchParams.set('limit', String(FACEBOOK_LIMIT));
  endpoint.searchParams.set('access_token', token);

  const response = await fetch(endpoint.toString(), {
    headers: {
      'User-Agent': 'JudoooCrawler/1.0 (+https://judooo.art)',
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(
      `Facebook fetch failed (${response.status}) for ${sourceKind} ${sourceId}`,
    );
  }
  return response.json();
};

const parseFacebookItems = (
  json: { data?: Array<Record<string, unknown>> },
  sourceId: string,
  sourceKind: string,
): SourceItem[] => {
  const posts = Array.isArray(json?.data) ? json.data : [];
  const sourceUrl =
    sourceKind === 'group'
      ? `https://www.facebook.com/groups/${sourceId}`
      : `https://www.facebook.com/${sourceId}`;

  return posts.slice(0, FACEBOOK_LIMIT).map((post) => {
    const attachments = post?.attachments as
      | { data?: Array<Record<string, unknown>> }
      | undefined;
    const attachment = Array.isArray(attachments?.data)
      ? (attachments.data[0] as Record<string, unknown>)
      : null;
    const media = attachment?.media as
      | { image?: { src?: string } }
      | undefined;
    const imageUrl =
      normalizeImageUrl(
        media?.image?.src || (attachment?.url as string) || '',
      ) || null;
    const message = stripHtmlRich(
      (post?.message as string) ||
        (attachment?.description as string) ||
        '',
    );
    const titleBase =
      (attachment?.title as string) ||
      (post?.message as string) ||
      `Facebook ${sourceKind} post`;

    return {
      source_url: sourceUrl,
      external_id: String(
        post.id || `${sourceId}-${crypto.randomUUID()}`,
      ),
      source_type:
        sourceKind === 'group' ? 'facebook-group' : 'facebook-page',
      title: cleanTitle(titleBase),
      summary: message.slice(0, 500) || null,
      item_url: (post?.permalink_url as string) || sourceUrl,
      published_at: (post?.created_time as string) || null,
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

// ---------------------------------------------------------------------------
// Fetch source (RSS/Atom)
// ---------------------------------------------------------------------------

const fetchSource = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'JudoooCrawler/1.0 (+https://judooo.art)',
      Accept:
        'application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }

  return response.text();
};

// ---------------------------------------------------------------------------
// DB operations
// ---------------------------------------------------------------------------

const upsertSourceItems = async (
  supabase: SupabaseClient,
  records: SourceItem[],
  logger?: ReturnType<typeof createLogger>,
): Promise<SourceItem[]> => {
  if (!records.length) return [];

  // Filter to only art/event-related items
  const eventRecords = records.filter(isArtEventItem);
  const skipped = records.length - eventRecords.length;
  if (skipped > 0 && logger) {
    logger.log(`Filtered: kept ${eventRecords.length}/${records.length} items (skipped ${skipped} non-event articles)`);
  }
  if (!eventRecords.length) return [];

  const { data, error } = await supabase
    .from('source_items')
    .upsert(eventRecords, { onConflict: 'source_url,external_id' })
    .select('*');

  if (error) throw new Error(error.message || JSON.stringify(error));
  return (data as SourceItem[]) || [];
};

const buildEventRow = (item: SourceItem) => {
  const rawStart =
    (item?.raw_payload?.start_date as string) || item.published_at;
  const startDate = toDate(rawStart);
  const endDate = toDate(
    (item?.raw_payload?.end_date as string) || addDays(startDate, 30),
  );
  const city =
    (item?.raw_payload?.city as CityName) || detectCity(item);
  const center = CITY_CENTERS[city] || CITY_CENTERS['Ho Chi Minh City'];
  const imageUrl =
    (item?.raw_payload?.image_url as string) ||
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200';
  const sourceHost = (() => {
    try {
      return new URL(item.source_url).hostname.replace(/^www\./, '');
    } catch {
      return 'Internet Source';
    }
  })();
  const descriptionText =
    (item?.raw_payload?.full_text as string) ||
    item.summary ||
    (item.item_url
      ? `Details unavailable from feed. Open the original source: ${item.item_url}`
      : 'Details unavailable from feed.');
  const slugSeed =
    item.item_url || `${item.source_url}:${item.external_id}`;
  const galleryImages = (item?.raw_payload?.gallery_images as string[]) || [];

  return {
    title: item.title,
    slug: `${toSlug(item.title || 'event')}-${crypto.createHash('sha1').update(slugSeed).digest('hex').slice(0, 8)}`,
    organizer:
      (item?.raw_payload?.organizer as string) ||
      (item?.raw_payload?.source_name as string) ||
      sourceHost,
    startDate,
    endDate,
    location: (item?.raw_payload?.location_name as string) || city,
    lat: center.lat,
    lng: center.lng,
    imageUrl,
    description: descriptionText,
    category:
      (item?.raw_payload?.category as string) || DEFAULT_CATEGORY,
    media: galleryImages
      .filter((url: string) => url !== imageUrl)
      .slice(0, 20)
      .map((url: string) => ({ type: 'image', url })),
    source_url: item.source_url,
    source_item_url: item.item_url || null,
    external_id: item.external_id,
    source_item_id: item.id,
    imported_at: new Date().toISOString(),
  };
};

const upsertEvents = async (
  supabase: SupabaseClient,
  sourceItems: SourceItem[],
) => {
  if (!sourceItems.length) return 0;

  const rows = sourceItems.map(buildEventRow);
  const rowsWithModeration = rows.map((row) => ({
    ...row,
    moderation_status: 'pending',
  }));

  let { error } = await supabase
    .from('events')
    .upsert(rowsWithModeration, { onConflict: 'source_url,external_id' });

  if (error) {
    // Fallback: try without moderation_status in case column doesn't exist
    const fallback = await supabase
      .from('events')
      .upsert(rows, { onConflict: 'source_url,external_id' });
    error = fallback.error;
  }

  if (error) throw new Error(error.message || JSON.stringify(error));
  return rows.length;
};

// ---------------------------------------------------------------------------
// Main crawl orchestrator
// ---------------------------------------------------------------------------

export async function runCrawl(
  onLog?: (message: string) => void,
): Promise<CrawlResult> {
  const logger = createLogger(onLog);
  const supabase = buildSupabaseClient();

  const googleSources = GOOGLE_NEWS_QUERIES.map(googleNewsFeedUrl);
  const rssSources = [...SOURCE_URLS, ...googleSources];
  const seenItemUrls = new Set<string>();

  logger.log(
    `Crawler starting with rss_sources=${rssSources.length}, nguyen_events=${NGUYEN_EVENTS_ENABLED}, wp_sites=${WP_SITES.length}, html_scrape=${HTML_SCRAPE_URLS.length}.`,
  );

  let crawled = 0;
  let ingested = 0;

  // RSS/Atom feeds
  for (const sourceUrl of rssSources) {
    try {
      const text = await fetchSource(sourceUrl);
      const rssRecords = parseRssItems(text, sourceUrl);
      const atomRecords =
        rssRecords.length === 0 ? parseAtomItems(text, sourceUrl) : [];
      const records = (
        rssRecords.length > 0 ? rssRecords : atomRecords
      ).filter((record) => {
        if (!record.item_url) return true;
        if (seenItemUrls.has(record.item_url)) return false;
        seenItemUrls.add(record.item_url);
        return true;
      });
      crawled += records.length;

      if (!records.length) {
        logger.log(
          `No items parsed from ${sourceUrl}. Response head: ${text.slice(0, 180).replace(/\s+/g, ' ')}`,
        );
        continue;
      }

      const sourceItems = await upsertSourceItems(supabase, records, logger);
      const count = await upsertEvents(supabase, sourceItems);
      ingested += count;
      logger.log(
        `Source ${sourceUrl}: parsed=${records.length}, upserted_events=${count}`,
      );
    } catch (error) {
      logger.error(
        `Source failed ${sourceUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Nguyen Art Foundation
  if (NGUYEN_EVENTS_ENABLED) {
    try {
      const records = await buildNguyenSourceItems();
      crawled += records.length;
      const sourceItems = await upsertSourceItems(supabase, records, logger);
      const count = await upsertEvents(supabase, sourceItems);
      ingested += count;
      logger.log(
        `Nguyen Art Foundation: parsed=${records.length}, upserted_events=${count}`,
      );
    } catch (error) {
      logger.error(
        `Nguyen Art Foundation source failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Facebook
  const facebookToken =
    process.env.FACEBOOK_GRAPH_ACCESS_TOKEN || '';
  const facebookSources = [
    ...FACEBOOK_GROUP_IDS.map((id) => ({ id, kind: 'group' })),
    ...FACEBOOK_PAGE_IDS.map((id) => ({ id, kind: 'page' })),
  ];

  if (facebookSources.length > 0) {
    if (!facebookToken) {
      logger.error(
        'Facebook sources configured but FACEBOOK_GRAPH_ACCESS_TOKEN is missing.',
      );
    } else {
      for (const source of facebookSources) {
        try {
          const json = await fetchFacebookFeed(
            source.id,
            source.kind,
            facebookToken,
          );
          const records = parseFacebookItems(json, source.id, source.kind);
          crawled += records.length;
          if (!records.length) {
            logger.log(
              `No facebook posts parsed for ${source.kind} ${source.id}.`,
            );
            continue;
          }
          const sourceItems = await upsertSourceItems(supabase, records, logger);
          const count = await upsertEvents(supabase, sourceItems);
          ingested += count;
          logger.log(
            `Facebook ${source.kind} ${source.id}: parsed=${records.length}, upserted_events=${count}`,
          );
        } catch (error) {
          logger.error(
            `Facebook source failed ${source.kind} ${source.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }

  // Generic WordPress sites
  for (const siteUrl of WP_SITES) {
    try {
      const records = await buildWpSiteSourceItems(siteUrl);
      crawled += records.length;
      if (!records.length) {
        logger.log(`No WP posts found for ${siteUrl}`);
        continue;
      }
      const sourceItems = await upsertSourceItems(supabase, records, logger);
      const count = await upsertEvents(supabase, sourceItems);
      ingested += count;
      logger.log(
        `WordPress ${siteUrl}: parsed=${records.length}, upserted_events=${count}`,
      );
    } catch (error) {
      logger.error(
        `WordPress source failed ${siteUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // HTML scraper
  for (const siteUrl of HTML_SCRAPE_URLS) {
    try {
      const records = await buildHtmlScrapedItems(siteUrl, logger);
      crawled += records.length;
      if (!records.length) {
        logger.log(`No events scraped from ${siteUrl}`);
        continue;
      }
      const sourceItems = await upsertSourceItems(supabase, records, logger);
      const count = await upsertEvents(supabase, sourceItems);
      ingested += count;
      logger.log(
        `HTML scrape ${siteUrl}: parsed=${records.length}, upserted_events=${count}`,
      );
    } catch (error) {
      logger.error(
        `HTML scrape source failed ${siteUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  logger.log(`Done. Crawled items=${crawled}, event upserts=${ingested}`);

  return { crawled, ingested, logs: logger.logs };
}

// ---------------------------------------------------------------------------
// Source registry — each entry can be crawled independently
// ---------------------------------------------------------------------------

type CrawlSource = {
  name: string;
  type: 'rss' | 'wp' | 'html' | 'nguyen' | 'google-news';
  url: string;
};

const CRAWL_SOURCES: CrawlSource[] = [
  ...SOURCE_URLS.map((url) => ({
    name: new URL(url).hostname.replace(/^www\./, ''),
    type: 'rss' as const,
    url,
  })),
  ...(NGUYEN_EVENTS_ENABLED
    ? [{ name: 'nguyenartfoundation.com', type: 'nguyen' as const, url: 'nguyen' }]
    : []),
  ...WP_SITES.map((url) => ({
    name: new URL(url).hostname.replace(/^www\./, ''),
    type: 'wp' as const,
    url,
  })),
  ...HTML_SCRAPE_URLS.map((url) => ({
    name: new URL(url).hostname.replace(/^www\./, ''),
    type: 'html' as const,
    url,
  })),
  ...GOOGLE_NEWS_QUERIES.map((query) => ({
    name: `google-news: ${query.slice(0, 40)}`,
    type: 'google-news' as const,
    url: googleNewsFeedUrl(query),
  })),
];

export function getCrawlSources(): Array<{ name: string; type: string; url: string }> {
  return CRAWL_SOURCES;
}

export async function runCrawlSource(
  sourceIndex: number,
  onLog?: (message: string) => void,
): Promise<CrawlResult> {
  const source = CRAWL_SOURCES[sourceIndex];
  if (!source) {
    throw new Error(`Invalid source index: ${sourceIndex}. Max: ${CRAWL_SOURCES.length - 1}`);
  }

  const logger = createLogger(onLog);
  const supabase = buildSupabaseClient();

  let crawled = 0;
  let ingested = 0;

  logger.log(`Crawling source [${sourceIndex}/${CRAWL_SOURCES.length - 1}]: ${source.name} (${source.type})`);

  try {
    if (source.type === 'rss') {
      const text = await fetchSource(source.url);
      const rssRecords = parseRssItems(text, source.url);
      const atomRecords = rssRecords.length === 0 ? parseAtomItems(text, source.url) : [];
      const records = rssRecords.length > 0 ? rssRecords : atomRecords;
      crawled = records.length;

      if (!records.length) {
        logger.log(`No items parsed from ${source.url}`);
      } else {
        const sourceItems = await upsertSourceItems(supabase, records, logger);
        ingested = await upsertEvents(supabase, sourceItems);
        logger.log(`RSS ${source.name}: parsed=${records.length}, upserted=${ingested}`);
      }
    } else if (source.type === 'nguyen') {
      const records = await buildNguyenSourceItems();
      crawled = records.length;
      const sourceItems = await upsertSourceItems(supabase, records, logger);
      ingested = await upsertEvents(supabase, sourceItems);
      logger.log(`Nguyen Art Foundation: parsed=${records.length}, upserted=${ingested}`);
    } else if (source.type === 'wp') {
      const records = await buildWpSiteSourceItems(source.url);
      crawled = records.length;
      if (!records.length) {
        logger.log(`No WP posts found for ${source.url}`);
      } else {
        const sourceItems = await upsertSourceItems(supabase, records, logger);
        ingested = await upsertEvents(supabase, sourceItems);
        logger.log(`WordPress ${source.name}: parsed=${records.length}, upserted=${ingested}`);
      }
    } else if (source.type === 'html') {
      const records = await buildHtmlScrapedItems(source.url, logger);
      crawled = records.length;
      if (!records.length) {
        logger.log(`No events scraped from ${source.url}`);
      } else {
        const sourceItems = await upsertSourceItems(supabase, records, logger);
        ingested = await upsertEvents(supabase, sourceItems);
        logger.log(`HTML scrape ${source.name}: parsed=${records.length}, upserted=${ingested}`);
      }
    } else if (source.type === 'google-news') {
      const text = await fetchSource(source.url);
      const rssRecords = parseRssItems(text, source.url);
      const atomRecords = rssRecords.length === 0 ? parseAtomItems(text, source.url) : [];
      const records = rssRecords.length > 0 ? rssRecords : atomRecords;
      crawled = records.length;

      if (!records.length) {
        logger.log(`No Google News items for "${source.name}"`);
      } else {
        // Google News results are general — always apply keyword filter
        const filtered = records.filter(isArtEventItem);
        logger.log(`Google News ${source.name}: fetched=${records.length}, after keyword filter=${filtered.length}`);
        if (filtered.length > 0) {
          const sourceItems = await upsertSourceItems(supabase, filtered, logger);
          ingested = await upsertEvents(supabase, sourceItems);
          logger.log(`Google News ${source.name}: upserted=${ingested}`);
        }
      }
    }
  } catch (error) {
    logger.error(`Source failed ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
  }

  logger.log(`Done. Crawled=${crawled}, ingested=${ingested}`);
  return { crawled, ingested, logs: logger.logs };
}

// ---------------------------------------------------------------------------
// Dedupe
// ---------------------------------------------------------------------------

const normalizeDedupTitle = (title = '') =>
  title
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const rankDate = (row: {
  imported_at?: string;
  created_at?: string;
  startDate?: string;
}) =>
  new Date(
    row.imported_at || row.created_at || row.startDate || 0,
  ).getTime() || 0;

export async function runDedupe(
  onLog?: (message: string) => void,
): Promise<DedupeResult> {
  const logger = createLogger(onLog);
  const supabase = buildSupabaseClient();

  const { data, error } = await supabase
    .from('events')
    .select(
      'id,title,source_url,external_id,imported_at,created_at,startDate',
    )
    .not('source_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to read events: ${error.message || error}`);
  }

  const rows = data || [];
  const groups = new Map<
    string,
    Array<{
      id: string;
      title: string;
      source_url: string;
      imported_at?: string;
      created_at?: string;
      startDate?: string;
    }>
  >();

  for (const row of rows) {
    const source = (row.source_url || '').trim();
    const titleKey = normalizeDedupTitle(row.title || '');
    if (!source || !titleKey) continue;
    const key = `${source}::${titleKey}`;
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  }

  const toDelete: string[] = [];
  for (const [, list] of groups.entries()) {
    if (list.length <= 1) continue;
    list.sort((a, b) => rankDate(b) - rankDate(a));
    const duplicates = list.slice(1);
    duplicates.forEach((d) => toDelete.push(d.id));
  }

  if (toDelete.length === 0) {
    logger.log(
      `No duplicates found across ${rows.length} crawled event rows.`,
    );
    return { deleted: 0, total: rows.length, logs: logger.logs };
  }

  const chunkSize = 200;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += chunkSize) {
    const chunk = toDelete.slice(i, i + chunkSize);
    const { error: delError } = await supabase
      .from('events')
      .delete()
      .in('id', chunk);
    if (delError) {
      throw new Error(`Delete failed: ${delError.message || delError}`);
    }
    deleted += chunk.length;
  }

  logger.log(
    `Deleted ${deleted} duplicate crawled events. Kept latest per source+title.`,
  );

  return { deleted, total: rows.length, logs: logger.logs };
}
