import type { PropsWithChildren, ReactNode } from 'react';

interface FieldProps extends PropsWithChildren {
  label: string;
  hint?: string;
  action?: ReactNode;
}

export const Field = ({ label, hint, action, children }: FieldProps) => (
  <label className="field">
    <span className="field__header">
      <span className="field__label">{label}</span>
      {action}
    </span>
    {children}
    {hint ? <span className="field__hint">{hint}</span> : null}
  </label>
);
