'use client';

import type { PropsWithChildren } from 'react';
import { AuthProvider } from './AuthProvider';
import { LanguageProvider } from './LanguageProvider';
import { NoticeProvider } from './NoticeProvider';

export const AppProviders = ({ children }: PropsWithChildren) => (
  <LanguageProvider>
    <NoticeProvider>
      <AuthProvider>{children}</AuthProvider>
    </NoticeProvider>
  </LanguageProvider>
);
