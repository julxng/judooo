import { useEffect } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { JudoooButton } from './Button';

interface JudoooModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

export const JudoooModal = ({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
}: PropsWithChildren<JudoooModalProps>) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="jd:fixed jd:inset-0 jd:z-50 jd:flex jd:items-center jd:justify-center jd:p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="jd:absolute jd:inset-0 jd:border-0 jd:bg-judooo-ink/60 jd:backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="jd:relative jd:z-10 jd:w-full jd:max-w-2xl jd:rounded-[32px] jd:border jd:border-judooo-ink/10 jd:bg-judooo-paper jd:p-8 jd:shadow-judooo-float">
        <div className="jd:mb-8 jd:flex jd:items-start jd:justify-between jd:gap-4">
          <div className="jd:flex jd:flex-col jd:gap-3">
            <p className="jd:m-0 jd:font-mono jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-[0.24em] jd:text-judooo-ember">
              Modal
            </p>
            <div>
              <h3 className="jd:m-0 jd:font-serif jd:text-4xl jd:leading-none jd:text-judooo-ink">{title}</h3>
              {subtitle ? <p className="jd:mt-3 jd:mb-0 jd:max-w-xl jd:text-sm jd:leading-6 jd:text-judooo-smoke">{subtitle}</p> : null}
            </div>
          </div>
          <JudoooButton variant="ghost" size="sm" onClick={onClose}>
            Close
          </JudoooButton>
        </div>
        <div className="jd:flex jd:flex-col jd:gap-6">{children}</div>
        {footer ? <div className="jd:mt-8 jd:flex jd:flex-wrap jd:items-center jd:justify-end jd:gap-3">{footer}</div> : null}
      </div>
    </div>
  );
};
