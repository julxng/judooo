import type { InputHTMLAttributes } from 'react';
import { cx } from '@lib/cx';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Radio = ({ className, label, ...props }: RadioProps) => (
  <label className={cx('choice', className)}>
    <input type="radio" className="choice__control" {...props} />
    <span>{label}</span>
  </label>
);
