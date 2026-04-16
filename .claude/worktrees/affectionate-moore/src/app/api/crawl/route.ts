import { NextRequest } from 'next/server';

import {
  getCrawlSources,
  runCrawlSource,
  runDedupe,
} from '@/services/crawl/crawler';

export const maxDuration = 60;

/**
 * POST /api/crawl — streams SSE logs while crawling.
 *
 * Query params:
 *   ?source=<index>  — crawl a single source by index
 *   (no param)       — crawl ALL sources sequentially
 *
 * The UI calls this per-source to stay under the 60s Vercel timeout.
 */
export async function POST(request: NextRequest) {
  const sourceParam = request.nextUrl.searchParams.get('source');
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      };

      const sources = getCrawlSources();
      let totalCrawled = 0;
      let totalIngested = 0;

      // Determine which sources to crawl
      const indices =
        sourceParam !== null
          ? [parseInt(sourceParam, 10)]
          : sources.map((_, i) => i);

      for (const idx of indices) {
        const source = sources[idx];
        if (!source) continue;

        send({
          type: 'status',
          message: `Crawling ${source.name} (${source.type})...`,
          sourceIndex: idx,
          sourceName: source.name,
        });

        try {
          const result = await runCrawlSource(idx, (log: string) => {
            send({ type: 'log', message: log, sourceIndex: idx });
          });
          totalCrawled += result.crawled;
          totalIngested += result.ingested;

          send({
            type: 'source_done',
            message: `${source.name}: ${result.crawled} items, ${result.ingested} events`,
            sourceIndex: idx,
            crawled: result.crawled,
            ingested: result.ingested,
          });
        } catch (error) {
          send({
            type: 'error',
            message: `${source.name} failed: ${error instanceof Error ? error.message : String(error)}`,
            sourceIndex: idx,
          });
        }
      }

      // Deduplicate after crawling
      try {
        send({ type: 'status', message: 'Deduplicating events...' });
        const dedupeResult = await runDedupe((log: string) => {
          send({ type: 'log', message: log });
        });
        if (dedupeResult.deleted > 0) {
          send({
            type: 'log',
            message: `Removed ${dedupeResult.deleted} duplicates`,
          });
        }
      } catch (error) {
        send({
          type: 'error',
          message: `Dedupe failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      send({
        type: 'done',
        success: true,
        crawled: totalCrawled,
        ingested: totalIngested,
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * GET /api/crawl/sources — returns the list of configured sources.
 */
export async function GET() {
  const sources = getCrawlSources();
  return Response.json({ sources, total: sources.length });
}
