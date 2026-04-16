'use client';

import { useCallback, useEffect, useState } from 'react';

type LightboxProps = {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  alt?: string;
};

export const Lightbox = ({ images, initialIndex = 0, onClose, alt = 'Image' }: LightboxProps) => {
  const [index, setIndex] = useState(initialIndex);
  const total = images.length;
  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  const goNext = useCallback(() => {
    if (hasNext) setIndex((i) => i + 1);
  }, [hasNext]);

  const goPrev = useCallback(() => {
    if (hasPrev) setIndex((i) => i - 1);
  }, [hasPrev]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    };

    document.addEventListener('keydown', handleKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = original;
    };
  }, [onClose, goNext, goPrev]);

  return (
    <div className="lightbox" onClick={onClose}>
      <button type="button" className="lightbox__close" aria-label="Close">
        ✕
      </button>

      {hasPrev ? (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Previous image"
        >
          ‹
        </button>
      ) : null}

      <img
        key={images[index]}
        src={images[index]}
        alt={`${alt} ${index + 1}`}
        className="lightbox__image"
        onClick={(e) => e.stopPropagation()}
      />

      {hasNext ? (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Next image"
        >
          ›
        </button>
      ) : null}

      {total > 1 ? (
        <span className="lightbox__counter">{index + 1} / {total}</span>
      ) : null}
    </div>
  );
};
