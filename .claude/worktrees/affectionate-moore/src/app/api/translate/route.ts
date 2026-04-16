import { NextResponse } from 'next/server';

type Locale = 'vi' | 'en';
type SourceLocale = Locale | 'unknown';

type TranslationRequest = {
  key: string;
  source?: SourceLocale;
  target: Locale;
  text: string;
};

const normalizeText = (value?: string | null): string => String(value || '').replace(/\s+/g, ' ').trim();

const translateText = async (
  text: string,
  source: SourceLocale,
  target: Locale,
): Promise<string> => {
  const normalized = normalizeText(text);
  if (!normalized) return '';
  if (source === target) return normalized;

  const endpoint = new URL('https://translate.googleapis.com/translate_a/single');
  endpoint.searchParams.set('client', 'gtx');
  endpoint.searchParams.set('sl', source === 'unknown' ? 'auto' : source);
  endpoint.searchParams.set('tl', target);
  endpoint.searchParams.set('dt', 't');
  endpoint.searchParams.set('q', normalized);

  const response = await fetch(endpoint.toString(), {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Translation failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    throw new Error('Unexpected translation response.');
  }

  return payload[0]
    .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === 'string' ? chunk[0] : ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { requests?: TranslationRequest[] };
    const requests = Array.isArray(body?.requests) ? body.requests : [];

    const translations = await Promise.all(
      requests.map(async (entry) => ({
        key: entry.key,
        text: await translateText(entry.text, entry.source || 'unknown', entry.target),
      })),
    );

    return NextResponse.json({ translations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Translation request failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
