import type { InputHTMLAttributes } from 'react';
import { cn as cx } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox = ({ className, label, ...props }: CheckboxProps) => (
  <label className={cx('choice text-sm text-foreground', className)}>
    <input type="checkbox" className="choice__control h-4 w-4 rounded-[2px] border-border" {...props} />
    <span>{label}</span>
  </label>
);
