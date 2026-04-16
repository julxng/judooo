import type { CSSProperties, HTMLAttributes } from 'react';

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: number;
  direction?: CSSProperties['flexDirection'];
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
}

export const Stack = ({
  children,
  gap = 16,
  direction = 'column',
  align,
  justify,
  style,
  ...props
}: StackProps) => (
  <div
    style={{ display: 'flex', flexDirection: direction, gap, alignItems: align, justifyContent: justify, ...style }}
    {...props}
  >
    {children}
  </div>
);
