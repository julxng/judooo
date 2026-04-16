import { cn as cx } from '@/lib/utils';

interface AsyncStatusBannerProps {
  message: string;
  tone?: 'info' | 'warning' | 'danger';
}

export const AsyncStatusBanner = ({
  message,
  tone = 'info',
}: AsyncStatusBannerProps) => (
  <div
    className={cx(
      'border px-4 py-3 text-sm',
      tone === 'info' && 'border-border bg-card text-foreground',
      tone === 'warning' && 'border-warning/30 bg-card text-warning',
      tone === 'danger' && 'border-destructive/30 bg-card text-destructive',
    )}
  >
    {message}
  </div>
);
