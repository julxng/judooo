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

interface NoticeItem {
  id: string;
  message: string;
  variant: NoticeVariant;
}

interface NoticeContextValue {
  notify: (message: string, variant?: NoticeVariant) => void;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

export const NoticeProvider = ({ children }: PropsWithChildren) => {
  const [items, setItems] = useState<NoticeItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const notify = useCallback(
    (message: string, variant: NoticeVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((current) => [...current, { id, message, variant }]);
      timers.current[id] = window.setTimeout(() => dismiss(id), 4200);
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
            className={`notice notice--${item.variant}`}
          >
            {item.message}
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
