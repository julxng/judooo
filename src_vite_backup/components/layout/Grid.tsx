import type { CSSProperties, HTMLAttributes } from 'react';

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  min?: number;
  columns?: number;
  gap?: number;
}

export const Grid = ({ children, min = 280, columns, gap = 24, style, ...props }: GridProps) => {
  const gridTemplateColumns = columns
    ? `repeat(${columns}, minmax(0, 1fr))`
    : `repeat(auto-fit, minmax(${min}px, 1fr))`;

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns, gap, ...style } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
};
