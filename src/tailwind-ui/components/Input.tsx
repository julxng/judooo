import type { InputHTMLAttributes } from 'react';
import { cn } from '../cn';

interface JudoooInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const JudoooInput = ({
  className,
  label,
  hint,
  error,
  id,
  ...props
}: JudoooInputProps) => (
  <label className="jd:flex jd:flex-col jd:gap-2">
    {label ? (
      <span className="jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.24em] jd:text-judooo-smoke">
        {label}
      </span>
    ) : null}
    <input
      id={id}
      className={cn(
        'jd:h-12 jd:w-full jd:rounded-2xl jd:border jd:border-judooo-ink/10 jd:bg-judooo-paper jd:px-4 jd:text-sm jd:text-judooo-ink jd:shadow-[0_1px_0_rgba(23,19,17,0.04)] jd:outline-none placeholder:jd:text-judooo-smoke/60 focus:jd:border-judooo-ember focus:jd:ring-4 focus:jd:ring-judooo-ember/10',
        className,
      )}
      {...props}
    />
    {error ? (
      <span className="jd:text-xs jd:text-judooo-ember-deep">{error}</span>
    ) : hint ? (
      <span className="jd:text-xs jd:text-judooo-smoke">{hint}</span>
    ) : null}
  </label>
);
