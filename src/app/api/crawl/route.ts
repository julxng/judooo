import { NextResponse } from 'next/server';

import { runCrawl, runDedupe } from '@/services/crawl/crawler';

export async function POST() {
  const logs: string[] = [];
  let totalCrawled = 0;
  let totalIngested = 0;

  // Step 1: Crawl
  try {
    logs.push('\n=== Crawling events ===');
    const crawlResult = await runCrawl();
    totalCrawled = crawlResult.crawled;
    totalIngested = crawlResult.ingested;
    logs.push(...crawlResult.logs);
  } catch (error) {
    logs.push(
      `[ERROR] Crawl failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json({
      success: false,
      step: 'Crawling events',
      crawled: totalCrawled,
      ingested: totalIngested,
      logs: logs.join('\n'),
    });
  }

  // Step 2: Dedupe
  try {
    logs.push('\n=== Deduplicating events ===');
    const dedupeResult = await runDedupe();
    logs.push(...dedupeResult.logs);
    if (dedupeResult.deleted > 0) {
      logs.push(`Removed ${dedupeResult.deleted} duplicates`);
    }
  } catch (error) {
    logs.push(
      `[ERROR] Dedupe failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json({
      success: false,
      step: 'Deduplicating events',
      crawled: totalCrawled,
      ingested: totalIngested,
      logs: logs.join('\n'),
    });
  }

  return NextResponse.json({
    success: true,
    crawled: totalCrawled,
    ingested: totalIngested,
    logs: logs.join('\n'),
  });
}
