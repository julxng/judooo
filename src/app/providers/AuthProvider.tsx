'use client';

import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { AuthDialog } from '@/features/auth/components';
import { useAuthController } from '@/features/auth/hooks';

type AuthContextValue = ReturnType<typeof useAuthController>;

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const auth = useAuthController();
  const value = useMemo(() => auth, [auth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {auth.isAuthDialogOpen ? (
        <AuthDialog
          mode={auth.authDialogMode}
          onClose={auth.closeAuthDialog}
          onLoginGoogle={auth.loginWithGoogle}
          onLoginEmailPassword={auth.loginWithPassword}
          onSignUpEmailPassword={auth.signUpWithPassword}
          onResetPassword={auth.resetPassword}
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
