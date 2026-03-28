import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import path from 'node:path';

const CRAWL_STEPS = [
  { label: 'Crawling events', command: 'npm', args: ['run', 'crawl:events'] },
  { label: 'Deduplicating events', command: 'npm', args: ['run', 'dedupe:events'] },
];

export async function POST(request: Request) {
  const authHeader = request.headers.get('x-admin-token');
  const expectedToken = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!authHeader || !expectedToken || authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rootDir = path.resolve(process.cwd());
  const envCrawlPath = path.join(rootDir, '.env.crawl');

  const logs: string[] = [];
  let totalCrawled = 0;
  let totalIngested = 0;

  for (const step of CRAWL_STEPS) {
    logs.push(`\n=== ${step.label} ===`);

    const result = await new Promise<{ code: number; output: string }>((resolve) => {
      const child = spawn(step.command, step.args, {
        cwd: rootDir,
        env: {
          ...process.env,
          ...parseEnvFile(envCrawlPath),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });

      let output = '';
      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });
      child.stderr.on('data', (data: Buffer) => {
        output += data.toString();
      });

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({ code: 1, output: output + '\n[Timed out after 5 minutes]' });
      }, 5 * 60 * 1000);

      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ code: code ?? 1, output });
      });
    });

    logs.push(result.output);

    // Parse stats from crawl output
    const crawledMatch = result.output.match(/Crawled items=(\d+)/);
    const ingestedMatch = result.output.match(/event upserts=(\d+)/);
    if (crawledMatch) totalCrawled = Number(crawledMatch[1]);
    if (ingestedMatch) totalIngested = Number(ingestedMatch[1]);

    // Parse dedupe stats
    const dupeMatch = result.output.match(/Removed (\d+) duplicate/);
    if (dupeMatch) logs.push(`Removed ${dupeMatch[1]} duplicates`);

    if (result.code !== 0) {
      return NextResponse.json({
        success: false,
        step: step.label,
        crawled: totalCrawled,
        ingested: totalIngested,
        logs: logs.join('\n'),
      });
    }
  }

  return NextResponse.json({
    success: true,
    crawled: totalCrawled,
    ingested: totalIngested,
    logs: logs.join('\n'),
  });
}

function parseEnvFile(filePath: string): Record<string, string> {
  try {
    const fs = require('node:fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    const env: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
    return env;
  } catch {
    return {};
  }
}
