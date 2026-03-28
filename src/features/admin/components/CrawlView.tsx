'use client';

import { useState } from 'react';
import { Globe, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabaseAnonKey } from '@/lib/supabase/env';

type CrawlResult = {
  success: boolean;
  crawled: number;
  ingested: number;
  logs: string;
  step?: string;
};

const SOURCES = [
  { type: 'RSS', name: 'Hanoi Grapevine', url: 'hanoigrapevine.com' },
  { type: 'RSS', name: 'Saigoneer (Arts)', url: 'saigoneer.com' },
  { type: 'RSS', name: 'Galerie Quynh', url: 'galeriequynh.com' },
  { type: 'RSS', name: 'The Factory', url: 'factoryartscentre.com' },
  { type: 'WP', name: 'Art Vietnam Gallery', url: 'artvietnamgallery.com' },
  { type: 'WP', name: 'Nguyen Art Gallery', url: 'nguyenartgallery.com' },
  { type: 'WP', name: 'San Art', url: 'san-art.co' },
  { type: 'WP', name: 'Nguyen Art Foundation', url: 'nguyenartfoundation.com' },
  { type: 'HTML', name: 'Manzi Art Space', url: 'manziart.space' },
  { type: 'HTML', name: 'Cuc Gallery', url: 'cucgallery.vn' },
  { type: 'HTML', name: 'VCCA', url: 'vccavietnam.com' },
  { type: 'HTML', name: 'Vietnam Fine Arts Museum', url: 'vnfam.vn' },
];

export const CrawlView = () => {
  const [crawling, setCrawling] = useState(false);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCrawl = async () => {
    setCrawling(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': supabaseAnonKey,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Crawl failed (${response.status}): ${text}`);
      }

      const data: CrawlResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Crawl failed');
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Crawl Events</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Crawl art events from external sources, deduplicate, and import to database.
        </p>
      </div>

      {/* Sources overview */}
      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Configured Sources</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SOURCES.map((source) => (
            <div
              key={source.url}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span
                className={
                  source.type === 'RSS'
                    ? 'rounded bg-blue-500/10 px-1.5 py-0.5 text-xs font-medium text-blue-600'
                    : source.type === 'WP'
                      ? 'rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-600'
                      : 'rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600'
                }
              >
                {source.type}
              </span>
              <span className="flex-1 truncate text-foreground">{source.name}</span>
              <span className="text-xs text-muted-foreground">{source.url}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Crawl trigger */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Run Crawl Pipeline</p>
              <p className="text-sm text-muted-foreground">
                Crawl all sources → deduplicate → import events
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleCrawl}
            disabled={crawling}
          >
            {crawling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Crawling...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start Crawl
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Result */}
      {result && (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium text-foreground">
              {result.success ? 'Crawl completed' : `Crawl failed at: ${result.step}`}
            </span>
          </div>

          <div className="mb-4 flex gap-6">
            <div>
              <p className="text-2xl font-bold text-foreground">{result.crawled}</p>
              <p className="text-xs text-muted-foreground">Items crawled</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{result.ingested}</p>
              <p className="text-xs text-muted-foreground">Events imported</p>
            </div>
          </div>

          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              Show logs
            </summary>
            <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-secondary p-3 text-xs text-foreground">
              {result.logs}
            </pre>
          </details>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        </Card>
      )}
    </div>
  );
};
