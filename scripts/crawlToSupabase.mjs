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
const FACEBOOK_GRAPH_TOKEN = process.env.FACEBOOK_GRAPH_ACCESS_TOKEN || '';
const FACEBOOK_LIMIT = Number(process.env.CRAWL_FACEBOOK_LIMIT || 25);

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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const decodeXml = (input = '') =>
  input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
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

const detectCity = (item) => {
  const text = `${item?.title || ''}\n${item?.summary || ''}\n${item?.raw_payload?.full_text || ''}\n${item?.item_url || ''}`
    .toLowerCase();
  const rules = [
    { city: 'Ho Chi Minh City', patterns: [/ho chi minh/, /\bhcmc\b/, /\bsaigon\b/] },
    { city: 'Hanoi', patterns: [/\bhanoi\b/, /\bha noi\b/] },
    { city: 'Da Nang', patterns: [/\bda nang\b/, /\bdanang\b/] },
    { city: 'Hai Phong', patterns: [/\bhai phong\b/, /\bhaiphong\b/] },
    { city: 'Hue', patterns: [/\bhue\b/, /\bhuế\b/] },
    { city: 'Can Tho', patterns: [/\bcan tho\b/, /\bcần thơ\b/] },
  ];
  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(text))) {
      return rule.city;
    }
  }
  return DEFAULT_LOCATION === 'Vietnam' ? 'Ho Chi Minh City' : DEFAULT_LOCATION;
};

const firstAttr = (block, regex) => {
  const m = block.match(regex);
  return m ? decodeXml(m[1]) : '';
};

const normalizeImageUrl = (raw = '') => {
  if (!raw) return '';
  let url = raw.trim();
  if (!url) return '';
  // Prefer original image over WordPress resized derivatives like image-300x200.jpg
  url = url.replace(/-\d{2,4}x\d{2,4}(?=\.(jpg|jpeg|png|webp))/i, '');
  try {
    const u = new URL(url);
    ['w', 'width', 'h', 'height', 'fit', 'resize', 'crop'].forEach((k) => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return url;
  }
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
      .map((s) => s.trim())
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

const fetchFacebookGroupFeed = async (groupId) => {
  const endpoint = new URL(`https://graph.facebook.com/v21.0/${groupId}/feed`);
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
    throw new Error(`Facebook fetch failed (${response.status}) for group ${groupId}`);
  }
  return response.json();
};

const parseFacebookItems = (json, groupId) => {
  const posts = Array.isArray(json?.data) ? json.data : [];
  const sourceUrl = `https://www.facebook.com/groups/${groupId}`;
  return posts.slice(0, FACEBOOK_LIMIT).map((post) => {
    const attachment = Array.isArray(post?.attachments?.data) ? post.attachments.data[0] : null;
    const imageUrl =
      normalizeImageUrl(attachment?.media?.image?.src || attachment?.url || '') || null;
    const message = stripHtmlRich(post?.message || attachment?.description || '');
    const titleBase = attachment?.title || post?.message || 'Facebook Group Post';
    return {
      source_url: sourceUrl,
      external_id: String(post.id || `${groupId}-${crypto.randomUUID()}`),
      source_type: 'facebook',
      title: cleanTitle(titleBase),
      summary: message.slice(0, 500) || null,
      item_url: post?.permalink_url || sourceUrl,
      published_at: post?.created_time || null,
      raw_payload: {
        title: cleanTitle(titleBase),
        summary: message.slice(0, 500) || null,
        full_text: message || null,
        image_url: imageUrl,
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

  const { data, error } = await supabase
    .from('source_items')
    .upsert(records, { onConflict: 'source_url,external_id' })
    .select('*');

  if (error) throw error;
  return data || [];
};

const toDate = (isoDateTime) => {
  if (!isoDateTime) return new Date().toISOString().split('T')[0];
  const d = new Date(isoDateTime);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  return d.toISOString().split('T')[0];
};

const buildEventRow = (item) => {
  const startDate = toDate(item.published_at);
  const endDate = toDate(new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());
  const city = detectCity(item);
  const center = CITY_CENTERS[city] || CITY_CENTERS['Ho Chi Minh City'];
  const imageUrl =
    item?.raw_payload?.image_url ||
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200';
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

  return {
    title: item.title,
    organizer: sourceHost,
    startDate,
    endDate,
    location: city,
    lat: center.lat,
    lng: center.lng,
    imageUrl,
    description: descriptionText,
    category: DEFAULT_CATEGORY,
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
  const { error } = await supabase
    .from('events')
    .upsert(rows, { onConflict: 'source_url,external_id' });

  if (error) throw error;
  return rows.length;
};

const run = async () => {
  const googleSources = GOOGLE_NEWS_QUERIES.map(googleNewsFeedUrl);
  const rssSources = [...SOURCE_URLS, ...googleSources];
  console.log(
    `Crawler starting with rss_sources=${rssSources.length}, facebook_groups=${FACEBOOK_GROUP_IDS.length}.`
  );
  let crawled = 0;
  let ingested = 0;

  for (const sourceUrl of rssSources) {
    try {
      const text = await fetchSource(sourceUrl);
      const rssRecords = parseRssItems(text, sourceUrl);
      const atomRecords = rssRecords.length === 0 ? parseAtomItems(text, sourceUrl) : [];
      const records = rssRecords.length > 0 ? rssRecords : atomRecords;
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

  if (FACEBOOK_GROUP_IDS.length > 0) {
    if (!FACEBOOK_GRAPH_TOKEN) {
      console.error('Facebook groups configured but FACEBOOK_GRAPH_ACCESS_TOKEN is missing.');
    } else {
      for (const groupId of FACEBOOK_GROUP_IDS) {
        try {
          const json = await fetchFacebookGroupFeed(groupId);
          const records = parseFacebookItems(json, groupId);
          crawled += records.length;
          if (!records.length) {
            console.log(`No facebook posts parsed for group ${groupId}.`);
            continue;
          }
          const sourceItems = await upsertSourceItems(records);
          const count = await upsertEvents(sourceItems);
          ingested += count;
          console.log(`Facebook group ${groupId}: parsed=${records.length}, upserted_events=${count}`);
        } catch (error) {
          console.error(`Facebook source failed ${groupId}:`, error.message || error);
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
