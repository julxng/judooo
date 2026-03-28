'use client';

import { useCallback, useRef, useState } from 'react';
import { Globe, Loader2, CheckCircle2, XCircle, RefreshCw, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type SourceStatus = 'idle' | 'crawling' | 'done' | 'error';

type SourceState = {
  name: string;
  type: string;
  status: SourceStatus;
  crawled: number;
  ingested: number;
};

type CrawlLog = {
  time: string;
  message: string;
};

const SOURCES = [
  { type: 'rss', name: 'Hanoi Grapevine', url: 'hanoigrapevine.com' },
  { type: 'rss', name: 'Saigoneer (Arts)', url: 'saigoneer.com' },
  { type: 'rss', name: 'Galerie Quynh', url: 'galeriequynh.com' },
  { type: 'rss', name: 'The Factory', url: 'factoryartscentre.com' },
  { type: 'nguyen', name: 'Nguyen Art Foundation', url: 'nguyenartfoundation.com' },
  { type: 'wp', name: 'The Factory (WP)', url: 'factoryartscentre.com' },
  { type: 'wp', name: 'Art Vietnam Gallery', url: 'artvietnamgallery.com' },
  { type: 'wp', name: 'Nguyen Art Gallery', url: 'nguyenartgallery.com' },
  { type: 'wp', name: 'San Art', url: 'san-art.co' },
  { type: 'html', name: 'Manzi Art Space', url: 'manziart.space' },
  { type: 'html', name: 'Cuc Gallery', url: 'cucgallery.vn' },
  { type: 'html', name: 'VCCA', url: 'vccavietnam.com' },
  { type: 'html', name: 'Vietnam Fine Arts Museum', url: 'vnfam.vn' },
];

const typeBadgeClass = (type: string) => {
  switch (type) {
    case 'rss':
      return 'rounded bg-blue-500/10 px-1.5 py-0.5 text-xs font-medium text-blue-600';
    case 'wp':
    case 'nguyen':
      return 'rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-600';
    case 'html':
      return 'rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600';
    default:
      return 'rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground';
  }
};

const statusIndicator = (status: SourceStatus) => {
  switch (status) {
    case 'crawling':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
    case 'done':
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    case 'error':
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    default:
      return <div className="h-3.5 w-3.5 rounded-full border border-border" />;
  }
};

export const CrawlView = () => {
  const [crawling, setCrawling] = useState(false);
  const [currentSource, setCurrentSource] = useState<string | null>(null);
  const [sourceStates, setSourceStates] = useState<SourceState[]>([]);
  const [logs, setLogs] = useState<CrawlLog[]>([]);
  const [totalCrawled, setTotalCrawled] = useState(0);
  const [totalIngested, setTotalIngested] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time, message }]);
    // Auto-scroll handled by useEffect-free approach: scrollIntoView on render
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const crawlSource = async (sourceIndex: number) => {
    const response = await fetch(`/api/crawl?source=${sourceIndex}`, {
      method: 'POST',
    });

    if (!response.ok || !response.body) {
      throw new Error(`Request failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done: readerDone, value } = await reader.read();
      if (readerDone) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'log' || data.type === 'status') {
            addLog(data.message);
          } else if (data.type === 'source_done') {
            setSourceStates((prev) =>
              prev.map((s, i) =>
                i === sourceIndex
                  ? { ...s, status: 'done', crawled: data.crawled, ingested: data.ingested }
                  : s,
              ),
            );
          } else if (data.type === 'error') {
            addLog(data.message);
            setSourceStates((prev) =>
              prev.map((s, i) =>
                i === sourceIndex ? { ...s, status: 'error' } : s,
              ),
            );
          } else if (data.type === 'done') {
            setTotalCrawled((prev) => prev + (data.crawled || 0));
            setTotalIngested((prev) => prev + (data.ingested || 0));
          }
        } catch {
          // ignore malformed SSE
        }
      }
    }
  };

  const handleCrawlAll = async () => {
    setCrawling(true);
    setDone(false);
    setError(null);
    setLogs([]);
    setTotalCrawled(0);
    setTotalIngested(0);
    setSourceStates(
      SOURCES.map((s) => ({ name: s.name, type: s.type, status: 'idle', crawled: 0, ingested: 0 })),
    );

    addLog('Starting crawl pipeline — one source at a time to avoid timeout...');

    for (let i = 0; i < SOURCES.length; i++) {
      const source = SOURCES[i];
      setCurrentSource(source.name);
      setSourceStates((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'crawling' } : s)),
      );
      addLog(`--- Crawling: ${source.name} (${source.type}) ---`);

      try {
        await crawlSource(i);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`Failed: ${source.name} — ${msg}`);
        setSourceStates((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'error' } : s)),
        );
      }
    }

    setCurrentSource(null);
    setDone(true);
    setCrawling(false);
    addLog('Crawl pipeline complete.');
  };

  const handleCrawlSingle = async (sourceIndex: number) => {
    setCrawling(true);
    setDone(false);
    setError(null);
    setLogs([]);
    setTotalCrawled(0);
    setTotalIngested(0);

    const source = SOURCES[sourceIndex];
    setSourceStates(
      SOURCES.map((s, i) => ({
        name: s.name,
        type: s.type,
        status: i === sourceIndex ? 'crawling' : 'idle',
        crawled: 0,
        ingested: 0,
      })),
    );
    setCurrentSource(source.name);
    addLog(`--- Crawling: ${source.name} (${source.type}) ---`);

    try {
      await crawlSource(sourceIndex);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`Failed: ${source.name} — ${msg}`);
      setSourceStates((prev) =>
        prev.map((s, i) => (i === sourceIndex ? { ...s, status: 'error' } : s)),
      );
      setError(msg);
    }

    setCurrentSource(null);
    setDone(true);
    setCrawling(false);
    addLog('Done.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Crawl Events</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Crawl art events from external sources, deduplicate, and import as pending events.
          <br />
          Auto-crawl runs daily at 02:00 UTC (one source per run).
        </p>
      </div>

      {/* Sources overview */}
      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Configured Sources</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SOURCES.map((source, idx) => {
            const state = sourceStates[idx];
            return (
              <div
                key={`${source.type}-${source.url}`}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                {state ? statusIndicator(state.status) : <div className="h-3.5 w-3.5" />}
                <span className={typeBadgeClass(source.type)}>
                  {source.type.toUpperCase()}
                </span>
                <span className="flex-1 truncate text-foreground">{source.name}</span>
                {state?.status === 'done' && state.ingested > 0 && (
                  <span className="text-xs text-green-600">+{state.ingested}</span>
                )}
                {!crawling && (
                  <button
                    onClick={() => handleCrawlSingle(idx)}
                    className="ml-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
                    title={`Crawl ${source.name} only`}
                  >
                    <Play className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
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
                {crawling && currentSource
                  ? `Crawling ${currentSource}...`
                  : 'Crawl all sources → deduplicate → import as pending'}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleCrawlAll}
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
                Crawl All
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Live logs */}
      {logs.length > 0 && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {done ? (
                error ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              )}
              <span className="font-medium text-foreground">
                {done ? 'Crawl completed' : 'Crawl in progress...'}
              </span>
            </div>
            {done && (
              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{totalCrawled}</p>
                  <p className="text-xs text-muted-foreground">Items crawled</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{totalIngested}</p>
                  <p className="text-xs text-muted-foreground">Events imported</p>
                </div>
              </div>
            )}
          </div>

          <div className="max-h-80 overflow-auto rounded-md bg-secondary p-3">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2 text-xs leading-relaxed">
                <span className="shrink-0 text-muted-foreground">{log.time}</span>
                <span
                  className={
                    log.message.includes('[ERROR]') || log.message.includes('Failed')
                      ? 'text-red-500'
                      : log.message.startsWith('---')
                        ? 'font-medium text-foreground'
                        : 'text-foreground'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </Card>
      )}

      {/* Error */}
      {error && !crawling && (
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
