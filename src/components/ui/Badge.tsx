import type { HTMLAttributes } from 'react';
import { cn as cx } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'accent' | 'success' | 'warning';
}

export const Badge = ({ className, tone = 'default', ...props }: BadgeProps) => (
  <span className={cx('ui-badge', `ui-badge--${tone}`, className)} {...props} />
);
