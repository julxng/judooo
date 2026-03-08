import { cn as cx } from '@/lib/utils';

interface AsyncStatusBannerProps {
  message: string;
  tone?: 'info' | 'warning' | 'danger';
}

export const AsyncStatusBanner = ({
  message,
  tone = 'info',
}: AsyncStatusBannerProps) => (
  <div className={cx('status-banner', `status-banner--${tone}`)}>{message}</div>
);
