'use client';

import { useEffect, type PropsWithChildren } from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface ModalProps extends PropsWithChildren {
  title?: string;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ children, title, onClose, size = 'lg' }: ModalProps) => {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = original;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="ui-modal" role="dialog" aria-modal="true">
      <div className="ui-modal__backdrop" onClick={onClose} aria-label="Close dialog" />
      <Card className={`ui-modal__panel ui-modal__panel--${size}`}>
        <div className="ui-modal__header">
          {title ? <h2 className="section-title">{title}</h2> : <span />}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </Card>
    </div>
  );
};
