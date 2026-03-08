import type { ReactNode } from 'react';
import { cx } from '@lib/cx';

interface SidebarLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarPosition?: 'left' | 'right';
}

export const SidebarLayout = ({
  sidebar,
  children,
  sidebarPosition = 'right',
}: SidebarLayoutProps) => (
  <div className={cx('sidebar-layout', sidebarPosition === 'left' && 'sidebar-layout--left')}>
    <div>{children}</div>
    <aside>{sidebar}</aside>
  </div>
);
