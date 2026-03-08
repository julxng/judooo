import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cx } from '@lib/cx';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cx('ui-control ui-control--select', className)} {...props} />
  ),
);

Select.displayName = 'Select';
