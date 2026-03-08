import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn as cx } from '@/lib/utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cx('ui-control ui-control--select', className)} {...props} />
  ),
);

Select.displayName = 'Select';
