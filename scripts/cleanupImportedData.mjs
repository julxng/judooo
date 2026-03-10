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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const LEGACY_ARTWORK_SOURCES = new Set([
  'https://nguyenartfoundation.com/vn/collection/suu-tap/',
  'https://query.wikidata.org/',
  'https://commons.wikimedia.org/',
  'https://en.wikipedia.org/',
  'https://html.duckduckgo.com/html/',
]);

const LOW_CONFIDENCE_EVENT_HOSTS = [/junglebosstours\.com/i, /evivatour\.com/i];

const chunk = (values, size) => {
  const output = [];
  for (let i = 0; i < values.length; i += size) {
    output.push(values.slice(i, i + size));
  }
  return output;
};

const rankTimestamp = (row) =>
  new Date(row.imported_at || row.updated_at || row.created_at || 0).getTime() || 0;

const deleteByIds = async (table, ids) => {
  if (!ids.length) return 0;
  let deleted = 0;
  for (const group of chunk(ids, 200)) {
    const { error } = await supabase.from(table).delete().in('id', group);
    if (error) throw error;
    deleted += group.length;
  }
  return deleted;
};

const cleanupLegacyArtworks = async () => {
  const { data, error } = await supabase
    .from('artworks')
    .select('id,title,artist,source_url,source_item_url,image_url,slug,imported_at,updated_at,created_at');

  if (error) throw error;

  const legacyIds = [];
  const dedupeBuckets = new Map();

  for (const row of data || []) {
    const title = row.title || '';
    const imageUrl = row.image_url || '';
    const isLegacySource = LEGACY_ARTWORK_SOURCES.has(row.source_url || '');
    const isPlaceholderTitle = /(?:raquo|^» Collection|Untitled Vietnamese Artwork$|Study$)/i.test(title);
    const isBadImage = /NAF_Logo\.svg|wp-json\/wp\/v2\/collection/i.test(imageUrl);
    const isLowConfidence = row.artist === 'Unknown Artist' && Boolean(row.imported_at);

    if (isLegacySource || isPlaceholderTitle || isBadImage || isLowConfidence) {
      legacyIds.push(row.id);
      continue;
    }

    const dedupeKey = row.source_item_url || row.slug;
    if (!dedupeKey) continue;
    const list = dedupeBuckets.get(dedupeKey) || [];
    list.push(row);
    dedupeBuckets.set(dedupeKey, list);
  }

  const duplicateIds = [];
  for (const rows of dedupeBuckets.values()) {
    if (rows.length <= 1) continue;
    rows.sort((a, b) => rankTimestamp(b) - rankTimestamp(a));
    duplicateIds.push(...rows.slice(1).map((row) => row.id));
  }

  const deletedLegacy = await deleteByIds('artworks', legacyIds);
  const deletedDuplicates = await deleteByIds('artworks', duplicateIds);

  return {
    deletedLegacy,
    deletedDuplicates,
  };
};

const cleanupLowConfidenceEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('id,source_url,source_item_id,imported_at');

  if (error) throw error;

  const ids = (data || [])
    .filter(
      (row) =>
        !row.source_item_id &&
        row.imported_at &&
        LOW_CONFIDENCE_EVENT_HOSTS.some((pattern) => pattern.test(row.source_url || ''))
    )
    .map((row) => row.id);

  const deleted = await deleteByIds('events', ids);
  return { deleted };
};

const main = async () => {
  const artworkResult = await cleanupLegacyArtworks();
  const eventResult = await cleanupLowConfidenceEvents();

  console.log(
    JSON.stringify(
      {
        artworks: artworkResult,
        events: eventResult,
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error('cleanupImportedData failed:', error.message || error);
  process.exit(1);
});
