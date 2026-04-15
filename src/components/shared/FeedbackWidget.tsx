'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { MessageSquarePlus, X, ChevronDown, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

type FeedbackType = 'feature' | 'bug' | 'feedback';

const TYPES: { value: FeedbackType; label: string; emoji: string }[] = [
  { value: 'feature', label: 'Feature request', emoji: '💡' },
  { value: 'bug', label: 'Bug report', emoji: '🐛' },
  { value: 'feedback', label: 'General feedback', emoji: '💬' },
];

export const FeedbackWidget = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('feedback');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const captureScreenshot = async (): Promise<string | null> => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
      });
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch {
      return null;
    }
  };

  const reset = () => {
    setTitle('');
    setDetails('');
    setType('feedback');
    setStatus('idle');
    setScreenshotPreview(null);
  };

  const handleClose = () => {
    setOpen(false);
    if (status === 'success') reset();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || status === 'loading') return;
    setStatus('loading');
    try {
      let screenshot: string | null = null;
      if (includeScreenshot) {
        screenshot = screenshotPreview ?? await captureScreenshot();
      }
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          details: details.trim() || undefined,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          screenshot: screenshot ?? undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setTimeout(() => { setOpen(false); reset(); }, 2200);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          ref={panelRef}
          className="w-[320px] overflow-hidden rounded-xl border border-border bg-white shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Share your thoughts</span>
            <button
              type="button"
              onClick={handleClose}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X size={15} />
            </button>
          </div>

          {status === 'success' ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="text-2xl">🎉</span>
              <p className="text-sm font-medium text-foreground">Got it, thanks!</p>
              <p className="text-xs text-muted-foreground">We'll look into it.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4">
              {/* Type selector */}
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FeedbackType)}
                  className="w-full appearance-none rounded-md border border-border bg-white py-2 pl-3 pr-8 text-sm text-foreground outline-none focus:ring-1 focus:ring-foreground/20"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-muted-foreground" />
              </div>

              {/* Title */}
              <input
                type="text"
                required
                placeholder={
                  type === 'feature' ? 'What would you like to see?' :
                  type === 'bug' ? 'What went wrong?' :
                  "What's on your mind?"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-foreground/20"
              />

              {/* Details */}
              <textarea
                placeholder="More details (optional)"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-md border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-foreground/20"
              />

              {/* Screenshot toggle */}
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeScreenshot}
                  onChange={(e) => setIncludeScreenshot(e.target.checked)}
                  className="h-3.5 w-3.5 accent-foreground"
                />
                <Camera size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Include screenshot</span>
                {screenshotPreview && includeScreenshot && (
                  <img
                    src={screenshotPreview}
                    alt="screenshot preview"
                    className="ml-auto h-8 w-12 rounded border border-border object-cover"
                  />
                )}
              </label>

              {status === 'error' && (
                <p className="text-xs text-red-500">Something went wrong. Try again.</p>
              )}

              <button
                type="submit"
                disabled={!title.trim() || status === 'loading'}
                className={cn(
                  'rounded-md py-2 text-sm font-medium transition-colors',
                  'bg-foreground text-background hover:bg-foreground/90',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {status === 'loading' ? 'Sending…' : 'Send'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={async () => {
          if (!open) {
            // Capture screenshot before the panel opens
            const shot = await captureScreenshot();
            setScreenshotPreview(shot);
          }
          setOpen((v) => !v);
        }}
        className={cn(
          'flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-2.5 shadow-md transition-all hover:shadow-lg',
          open && 'ring-1 ring-foreground/10',
        )}
        aria-label="Give feedback"
      >
        <MessageSquarePlus size={15} className="text-foreground" />
        <span className="text-xs font-medium text-foreground">Feedback</span>
      </button>
    </div>
  );
};
