import { NextRequest, NextResponse } from 'next/server';

import {
  getCrawlSources,
  runCrawlSource,
  runDedupe,
} from '@/services/crawl/crawler';

export const maxDuration = 60;

/**
 * Vercel Cron handler — crawls one source per invocation.
 * Sources are rotated via a `last_crawl_source_index` record in Supabase,
 * falling back to query param `?source=0` or sequential rotation.
 *
 * Cron schedule: daily at 02:00 UTC (configured in vercel.json).
 * Each invocation crawls one source then dedupes.
 */
export async function GET(request: NextRequest) {
  // Verify Vercel cron secret (prevents unauthorized triggers)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sources = getCrawlSources();
  const sourceParam = request.nextUrl.searchParams.get('source');
  const sourceIndex = sourceParam !== null
    ? parseInt(sourceParam, 10)
    : Math.floor((Date.now() / (1000 * 60 * 60)) % sources.length); // rotate hourly

  const clampedIndex = Math.max(0, Math.min(sourceIndex, sources.length - 1));
  const source = sources[clampedIndex];

  const logs: string[] = [];

  try {
    logs.push(`Cron crawl starting: source=${source.name} (${source.type}), index=${clampedIndex}/${sources.length - 1}`);

    const crawlResult = await runCrawlSource(clampedIndex, (msg) => logs.push(msg));

    logs.push('Running deduplication...');
    const dedupeResult = await runDedupe((msg) => logs.push(msg));

    return NextResponse.json({
      success: true,
      source: source.name,
      sourceIndex: clampedIndex,
      totalSources: sources.length,
      crawled: crawlResult.crawled,
      ingested: crawlResult.ingested,
      dedupDeleted: dedupeResult.deleted,
      logs,
    });
  } catch (error) {
    logs.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      {
        success: false,
        source: source.name,
        sourceIndex: clampedIndex,
        logs,
      },
      { status: 500 },
    );
  }
}
