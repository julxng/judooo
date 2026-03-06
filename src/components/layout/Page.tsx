import type { PropsWithChildren } from 'react';
import { cx } from '@lib/cx';

interface PageProps extends PropsWithChildren {
  className?: string;
}

export const Page = ({ children, className }: PageProps) => (
  <div className={cx('page-content', className)}>{children}</div>
);
