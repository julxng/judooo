import type { PropsWithChildren } from 'react';

interface TooltipProps extends PropsWithChildren {
  content: string;
}

export const Tooltip = ({ children, content }: TooltipProps) => (
  <span className="ui-tooltip">
    {children}
    <span className="ui-tooltip__content">{content}</span>
  </span>
);
