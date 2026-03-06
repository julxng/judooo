import type { ElementType, HTMLAttributes } from 'react';
import { cx } from '@lib/cx';

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

export const Container = ({ as: Component = 'div', className, ...props }: ContainerProps) => (
  <Component className={cx('container', className)} {...props} />
);
