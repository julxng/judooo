'use client';

import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { AuthDialog } from '@/features/auth/components';
import { useAuthController } from '@/features/auth/hooks';

type AuthContextValue = ReturnType<typeof useAuthController>;

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const auth = useAuthController();
  // Memoize on primitive deps so context only updates when auth state actually changes,
  // not on every parent re-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => auth, [auth.currentUser, auth.isAuthLoading, auth.isAuthDialogOpen, auth.authDialogMode, auth.canAccessAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {auth.isAuthDialogOpen ? (
        <AuthDialog
          mode={auth.authDialogMode}
          onClose={auth.closeAuthDialog}
          onLoginGoogle={auth.loginWithGoogle}
          onLoginTestAdmin={auth.loginTestAdmin}
          onLoginEmailPassword={auth.loginWithPassword}
          onSignUpEmailPassword={auth.signUpWithPassword}
          onResetPassword={auth.resetPassword}
          onUpdatePassword={auth.updatePassword}
        />
      ) : null}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
