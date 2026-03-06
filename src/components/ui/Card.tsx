import type { HTMLAttributes } from 'react';
import { cx } from '@lib/cx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'muted' | 'accent';
}

export const Card = ({ className, tone = 'default', ...props }: CardProps) => (
  <div className={cx('ui-card', `ui-card--${tone}`, className)} {...props} />
);
