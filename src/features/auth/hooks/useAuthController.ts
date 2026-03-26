import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { SignUpRole, User } from '../types/auth.types';
import { canAccessAdmin, getRoleApplicationCopy } from '../utils/roles';
import { api } from '@/services/api';
import { supabase } from '@/services/supabase/client';
import { useNotice } from '@/app/providers/NoticeProvider';

const DEV_USER_STORAGE_KEY = 'judooo_dev_user';
const AUTH_QUERY_KEY = 'auth';
const REDIRECT_QUERY_KEY = 'redirectTo';
const buildAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
type AuthMode = 'signin' | 'signup' | 'reset' | 'update-password';

type SessionUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

const mapSessionUser = async (sessionUser: SessionUser): Promise<User> => {
  const profile = sessionUser?.id ? await api.getProfile(sessionUser.id) : null;
  const fallbackName = sessionUser.user_metadata?.full_name || sessionUser.email || 'User';

  return {
    id: sessionUser.id,
    name: profile?.name || fallbackName,
    email: profile?.email || sessionUser.email || '',
    role: profile?.role || 'art_lover',
    avatar:
      profile?.avatar ||
      sessionUser.user_metadata?.avatar_url ||
      buildAvatar(fallbackName),
  };
};

export const useAuthController = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { notify } = useNotice();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const searchParams = new URLSearchParams(search);
  const authMode = searchParams.get(AUTH_QUERY_KEY);
  const redirectTo = searchParams.get(REDIRECT_QUERY_KEY);
  const authDialogMode: AuthMode =
    recoveryMode
      ? 'update-password'
      : authMode === 'signin' || authMode === 'signup' || authMode === 'reset' || authMode === 'update-password'
        ? authMode
        : 'signin';
  const isValidAuthMode = recoveryMode || authDialogMode === authMode;
  const nextRedirectPath =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : null;

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const storedDevUser = localStorage.getItem(DEV_USER_STORAGE_KEY);
      if (storedDevUser) {
        try {
          const parsed = JSON.parse(storedDevUser) as User;
          if (parsed?.id && parsed?.role) {
            setCurrentUser(parsed);
          }
        } catch (error) {
          console.error('Failed to parse local test user', error);
        }
      }
    }

    if (!supabase) return;

    const init = async () => {
      // Handle ?code= param from old password reset emails that bypass /auth/callback
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        const { error } = await supabase!.auth.exchangeCodeForSession(code);
        if (!error) {
          // Clean up the code param from URL
          params.delete('code');
          const remaining = params.toString();
          const cleanUrl = remaining
            ? `${window.location.pathname}?${remaining}`
            : window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        }
      }

      const { data } = await supabase!.auth.getSession();
      if (data.session?.user) {
        const user = await mapSessionUser(data.session.user);
        setCurrentUser(user);
        await api.syncUser(user);
      }
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true);
        setIsAuthDialogOpen(true);
      }

      if (session?.user) {
        const user = await mapSessionUser(session.user);
        setCurrentUser(user);
        await api.syncUser(user);
        localStorage.removeItem(DEV_USER_STORAGE_KEY);
        if (event !== 'PASSWORD_RECOVERY') {
          setIsAuthDialogOpen(false);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isValidAuthMode || currentUser) {
      return;
    }

    setIsAuthDialogOpen(true);
  }, [currentUser, isValidAuthMode]);

  useEffect(() => {
    if (!currentUser || !isValidAuthMode) {
      return;
    }

    if (nextRedirectPath && nextRedirectPath !== pathname) {
      router.replace(nextRedirectPath);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete(AUTH_QUERY_KEY);
    params.delete(REDIRECT_QUERY_KEY);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [currentUser, isValidAuthMode, nextRedirectPath, pathname, router, search]);

  const clearAuthParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(AUTH_QUERY_KEY);
    params.delete(REDIRECT_QUERY_KEY);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const openAuthDialog = () => setIsAuthDialogOpen(true);
  const closeAuthDialog = () => {
    setIsAuthDialogOpen(false);
    setRecoveryMode(false);

    if (!isValidAuthMode) {
      return;
    }

    clearAuthParams();
  };

  const loginTestAdmin = () => {
    if (process.env.NODE_ENV === 'production') return;

    const testAdminUser: User = {
      id: 'test-admin',
      name: 'Admin Preview',
      email: 'test-admin@local.dev',
      role: 'admin',
      avatar: buildAvatar('Admin Preview'),
    };

    setCurrentUser(testAdminUser);
    setIsAuthDialogOpen(false);
    localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(testAdminUser));
    notify('Local test admin enabled.', 'success');
  };

  const loginWithGoogle = async () => {
    if (!supabase) {
      notify('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_* or VITE_SUPABASE_* env vars.', 'warning');
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const loginWithPassword = async (email: string, password: string) => {
    if (!supabase) {
      notify('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_* or VITE_SUPABASE_* env vars.', 'warning');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      notify(`Sign in failed: ${error.message}`, 'error');
      return;
    }

    setIsAuthDialogOpen(false);
  };

  const signUpWithPassword = async (
    name: string,
    email: string,
    password: string,
    role: SignUpRole,
  ) => {
    if (!supabase) {
      notify('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_* or VITE_SUPABASE_* env vars.', 'warning');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      notify(`Sign up failed: ${error.message}`, 'error');
      return;
    }

    if (data.user?.id) {
      await api.syncUser({
        id: data.user.id,
        name,
        email,
        role,
        avatar: buildAvatar(name || email),
      });
    }

    notify(
      role === 'art_lover'
        ? 'Account created. Check your email to confirm your account, then sign in.'
        : getRoleApplicationCopy(role) || 'Account created. Check your email to confirm your account, then sign in.',
      'success',
    );
    setIsAuthDialogOpen(false);
  };

  const requestCreatorRole = async (role: Extract<SignUpRole, 'artist_pending' | 'gallery_manager_pending'>) => {
    if (!currentUser) {
      setIsAuthDialogOpen(true);
      notify('Create an account first, then apply for creator access.', 'warning');
      return false;
    }

    const nextUser: User = { ...currentUser, role };
    setCurrentUser(nextUser);
    await api.syncUser(nextUser);
    notify(getRoleApplicationCopy(role) || 'Application sent.', 'success');
    return true;
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      notify('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_* or VITE_SUPABASE_* env vars.', 'warning');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      notify(`Password reset failed: ${error.message}`, 'error');
      return;
    }

    notify('If this email exists, a password reset link has been sent.', 'success');
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase) {
      notify('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_* or VITE_SUPABASE_* env vars.', 'warning');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      notify(`Password update failed: ${error.message}`, 'error');
      return;
    }

    notify('Password updated successfully.', 'success');
    setRecoveryMode(false);
    setIsAuthDialogOpen(false);
    clearAuthParams();
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem(DEV_USER_STORAGE_KEY);
    setCurrentUser(null);
    notify('Signed out.', 'info');
  };

  return {
    currentUser,
    isAuthDialogOpen,
    authDialogMode,
    canAccessAdmin: canAccessAdmin(currentUser?.role),
    openAuthDialog,
    closeAuthDialog,
    loginTestAdmin,
    loginWithGoogle,
    loginWithPassword,
    signUpWithPassword,
    requestCreatorRole,
    resetPassword,
    updatePassword,
    logout,
  };
};
