import type { PropsWithChildren } from 'react';
import { cn as cx } from '@/lib/utils';

interface PageProps extends PropsWithChildren {
  className?: string;
}

export const Page = ({ children, className }: PageProps) => (
  <div className={cx('page-content', className)}>{children}</div>
);
