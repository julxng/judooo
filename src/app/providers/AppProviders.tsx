'use client';

import type { PropsWithChildren } from 'react';
import { NoticeProvider } from './NoticeProvider';

export const AppProviders = ({ children }: PropsWithChildren) => (
  <NoticeProvider>{children}</NoticeProvider>
);
