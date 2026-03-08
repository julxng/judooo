import type { PropsWithChildren } from 'react';
import { Button } from './Button';
import { Card } from './Card';

interface ModalProps extends PropsWithChildren {
  title?: string;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ children, title, onClose, size = 'lg' }: ModalProps) => (
  <div className="ui-modal">
    <button type="button" className="ui-modal__backdrop" onClick={onClose} aria-label="Close dialog" />
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
