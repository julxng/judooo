import type { ElementType, HTMLAttributes } from 'react';
import { cn as cx } from '@/lib/utils';

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

export const Container = ({ as: Component = 'div', className, ...props }: ContainerProps) => (
  <Component className={cx('container', className)} {...props} />
);
