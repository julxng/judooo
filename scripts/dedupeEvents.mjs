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

const normalizeTitle = (title = '') =>
  title
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const rankDate = (row) =>
  new Date(row.imported_at || row.created_at || row.startDate || 0).getTime() || 0;

const run = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('id,title,source_url,external_id,imported_at,created_at,startDate')
    .not('source_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to read events:', error.message || error);
    process.exit(1);
  }

  const rows = data || [];
  const groups = new Map();

  for (const row of rows) {
    const source = (row.source_url || '').trim();
    const titleKey = normalizeTitle(row.title || '');
    if (!source || !titleKey) continue;
    const key = `${source}::${titleKey}`;
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  }

  const toDelete = [];
  for (const [, list] of groups.entries()) {
    if (list.length <= 1) continue;
    list.sort((a, b) => rankDate(b) - rankDate(a));
    const duplicates = list.slice(1);
    duplicates.forEach((d) => toDelete.push(d.id));
  }

  if (toDelete.length === 0) {
    console.log(`No duplicates found across ${rows.length} crawled event rows.`);
    return;
  }

  const chunkSize = 200;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += chunkSize) {
    const chunk = toDelete.slice(i, i + chunkSize);
    const { error: delError } = await supabase.from('events').delete().in('id', chunk);
    if (delError) {
      console.error('Delete failed:', delError.message || delError);
      process.exit(1);
    }
    deleted += chunk.length;
  }

  console.log(`Deleted ${deleted} duplicate crawled events. Kept latest per source+title.`);
};

run().catch((error) => {
  console.error('Dedupe failed:', error.message || error);
  process.exit(1);
});
