'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface MasonryProps {
  children: ReactNode[];
  gap?: number;
  className?: string;
}

function getColumnCount(width: number): number {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  return 3;
}

export function Masonry({ children, gap = 24, className = '' }: MasonryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [positions, setPositions] = useState<{ x: number; y: number; width: number }[]>([]);

  const layout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const cols = getColumnCount(containerWidth);
    const colWidth = (containerWidth - gap * (cols - 1)) / cols;
    const colHeights = new Array(cols).fill(0);
    const items = Array.from(container.children) as HTMLElement[];
    const newPositions: { x: number; y: number; width: number }[] = [];

    for (const item of items) {
      // Temporarily make visible to measure
      item.style.position = 'absolute';
      item.style.width = `${colWidth}px`;
      item.style.visibility = 'hidden';
      item.style.left = '0';
      item.style.top = '0';
    }

    // Force reflow to get accurate heights
    void container.offsetHeight;

    for (let i = 0; i < items.length; i++) {
      const shortestCol = colHeights.indexOf(Math.min(...colHeights));
      const x = shortestCol * (colWidth + gap);
      const y = colHeights[shortestCol];

      newPositions.push({ x, y, width: colWidth });

      colHeights[shortestCol] += items[i].offsetHeight + gap;
    }

    // Apply positions
    for (let i = 0; i < items.length; i++) {
      const pos = newPositions[i];
      items[i].style.visibility = '';
      items[i].style.left = `${pos.x}px`;
      items[i].style.top = `${pos.y}px`;
      items[i].style.width = `${pos.width}px`;
    }

    setContainerHeight(Math.max(...colHeights) - gap);
    setPositions(newPositions);
  }, [gap]);

  useEffect(() => {
    layout();

    const observer = new ResizeObserver(() => layout());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [layout, children]);

  // Re-layout when images load
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const images = container.querySelectorAll('img');
    let loaded = 0;
    const total = images.length;

    if (total === 0) return;

    const onLoad = () => {
      loaded++;
      if (loaded >= total) layout();
    };

    images.forEach((img) => {
      if (img.complete) {
        loaded++;
      } else {
        img.addEventListener('load', onLoad);
        img.addEventListener('error', onLoad);
      }
    });

    if (loaded >= total) layout();

    return () => {
      images.forEach((img) => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onLoad);
      });
    };
  }, [layout, children]);

  return (
    <div
      ref={containerRef}
      className={`events-masonry ${className}`}
      style={{ height: containerHeight || 'auto' }}
    >
      {children}
    </div>
  );
}
