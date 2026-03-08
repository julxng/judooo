import type { InputHTMLAttributes } from 'react';
import { cx } from '@lib/cx';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox = ({ className, label, ...props }: CheckboxProps) => (
  <label className={cx('choice', className)}>
    <input type="checkbox" className="choice__control" {...props} />
    <span>{label}</span>
  </label>
);
