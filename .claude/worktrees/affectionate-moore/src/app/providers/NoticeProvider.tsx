'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

type NoticeVariant = 'info' | 'success' | 'warning' | 'error';

type NoticeItem = {
  id: string;
  message: string;
  variant: NoticeVariant;
  exiting: boolean;
};

type NoticeContextValue = {
  notify: (message: string, variant?: NoticeVariant) => void;
};

const DURATION = 4200;
const EXIT_DURATION = 180;

const NoticeContext = createContext<NoticeContextValue | null>(null);

const NoticeIcon = ({ variant }: { variant: NoticeVariant }) => {
  const paths: Record<NoticeVariant, string> = {
    success: 'M20 6L9 17l-5-5',
    error: 'M18 6L6 18M6 6l12 12',
    warning: 'M12 9v4m0 4h.01M12 2L2 20h20L12 2z',
    info: 'M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
  };

  return (
    <svg
      className="notice__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[variant]} />
    </svg>
  );
};

export const NoticeProvider = ({ children }: PropsWithChildren) => {
  const [items, setItems] = useState<NoticeItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, exiting: true } : item)),
    );

    setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, EXIT_DURATION);

    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const notify = useCallback(
    (message: string, variant: NoticeVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((current) => [...current, { id, message, variant, exiting: false }]);
      timers.current[id] = window.setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div className="notice-stack" aria-live="polite" aria-atomic="true">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => dismiss(item.id)}
            className={`notice notice--${item.variant}${item.exiting ? ' notice--exiting' : ''}`}
          >
            <NoticeIcon variant={item.variant} />
            {item.message}
            <span className="notice__progress" />
          </button>
        ))}
      </div>
    </NoticeContext.Provider>
  );
};

export const useNotice = (): NoticeContextValue => {
  const context = useContext(NoticeContext);
  if (!context) {
    throw new Error('useNotice must be used within NoticeProvider');
  }
  return context;
};
