import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { SignUpRole, User, UserRole } from '../types/auth.types';
import { canAccessAdmin, getRoleApplicationCopy } from '../utils/roles';
import { api } from '@/services/api';
import { supabase } from '@/services/supabase/client';
import { useNotice } from '@/app/providers/NoticeProvider';
import { LOCAL_DB_KEY } from '@/services/api/shared';
import { siteUrl } from '@/lib/supabase/env';

const DEV_USER_STORAGE_KEY = 'judooo_dev_user';
const AUTH_QUERY_KEY = 'auth';
const AUTH_ERROR_KEY = 'auth_error';
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
    role?: string;
  };
};

const mapSessionUser = async (sessionUser: SessionUser): Promise<User> => {
  const profile = sessionUser?.id ? await api.getProfile(sessionUser.id) : null;
  const fallbackName = sessionUser.user_metadata?.full_name || sessionUser.email || 'User';
  const metadataRole = sessionUser.user_metadata?.role as UserRole | undefined;

  return {
    id: sessionUser.id,
    name: profile?.name || fallbackName,
    email: profile?.email || sessionUser.email || '',
    role: profile?.role || metadataRole || 'art_lover',
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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const recoveryRef = useRef(false);
  const initRef = useRef(false);
  const sessionFoundRef = useRef(false);
  const search = typeof window === 'undefined' ? '' : window.location.search;
  const searchParams = new URLSearchParams(search);
  const authMode = searchParams.get(AUTH_QUERY_KEY);
  const authError = searchParams.get(AUTH_ERROR_KEY);
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

  // Show auth errors returned from the callback route
  useEffect(() => {
    if (!authError) return;

    notify(decodeURIComponent(authError), 'error');

    // Clean the error param from the URL
    const params = new URLSearchParams(window.location.search);
    params.delete(AUTH_ERROR_KEY);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [authError, notify, pathname, router]);

  // Session initialization + auth state listener
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Dev-only: restore local test user
    if (process.env.NODE_ENV !== 'production') {
      const storedDevUser = localStorage.getItem(DEV_USER_STORAGE_KEY);
      if (storedDevUser) {
        try {
          const parsed = JSON.parse(storedDevUser) as User;
          if (parsed?.id && parsed?.role) {
            setCurrentUser(parsed);
            setIsAuthLoading(false);
          }
        } catch (error) {
          console.error('Failed to parse local test user', error);
        }
      }
    }

    if (!supabase) {
      setIsAuthLoading(false);
      return;
    }

    // If a stray ?code= landed on the client (shouldn't happen with proper
    // redirectTo, but handle it as a safety net), forward to the server callback.
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      window.location.href = `/auth/callback?code=${encodeURIComponent(code)}`;
      return;
    }

    const setSessionUser = async (sessionUser: SessionUser) => {
      sessionFoundRef.current = true;
      localStorage.removeItem(DEV_USER_STORAGE_KEY);

      const basicUser: User = {
        id: sessionUser.id,
        name: sessionUser.user_metadata?.full_name || sessionUser.email || 'User',
        email: sessionUser.email || '',
        role: (sessionUser.user_metadata?.role as UserRole) || 'art_lover',
        avatar:
          sessionUser.user_metadata?.avatar_url ||
          buildAvatar(sessionUser.user_metadata?.full_name || sessionUser.email || 'User'),
      };

      // Fetch full profile before updating UI to avoid stale-data flicker
      try {
        const fullUser = await mapSessionUser(sessionUser);
        setCurrentUser(fullUser);
        api.syncUser(fullUser);
      } catch (err) {
        console.error('[auth] Profile sync failed, using basic user:', err);
        setCurrentUser(basicUser);
      }

      setIsAuthLoading(false);
      if (!recoveryRef.current) {
        setIsAuthDialogOpen(false);
      }
      router.refresh();
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryRef.current = true;
        setRecoveryMode(true);
        setIsAuthDialogOpen(true);
      }

      if (session?.user) {
        setSessionUser(session.user);
      } else {
        setCurrentUser(null);
        setIsAuthLoading(false);
      }
    });

    // Fallback: if onAuthStateChange hasn't fired after 2s, check the server directly
    const fallbackTimer = setTimeout(() => {
      if (sessionFoundRef.current || !supabase) return;
      supabase.auth.getUser().then(({ data }) => {
        if (sessionFoundRef.current) return;
        if (data.user) {
          setSessionUser(data.user);
        } else {
          setIsAuthLoading(false);
        }
      });
    }, 2000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (!isValidAuthMode || currentUser) {
      return;
    }

    setIsAuthDialogOpen(true);
  }, [currentUser, isValidAuthMode]);

  useEffect(() => {
    if (!currentUser || !isValidAuthMode || recoveryMode) {
      return;
    }

    if (nextRedirectPath && nextRedirectPath !== pathname) {
      router.replace(nextRedirectPath);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete(AUTH_QUERY_KEY);
    params.delete(REDIRECT_QUERY_KEY);
    params.delete(AUTH_ERROR_KEY);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [currentUser, isValidAuthMode, recoveryMode, nextRedirectPath, pathname, router, search]);

  const clearAuthParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(AUTH_QUERY_KEY);
    params.delete(REDIRECT_QUERY_KEY);
    params.delete(AUTH_ERROR_KEY);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const openAuthDialog = () => setIsAuthDialogOpen(true);
  const closeAuthDialog = () => {
    setIsAuthDialogOpen(false);
    setRecoveryMode(false);
    recoveryRef.current = false;

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

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl || window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[auth] Google sign-in failed:', error);
      notify(`Google sign-in failed: ${error.message}`, 'error');
    }
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
    // Dialog close + user state update handled by onAuthStateChange → setSessionUser
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
        emailRedirectTo: `${siteUrl || window.location.origin}/auth/callback`,
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
      redirectTo: `${siteUrl || window.location.origin}/auth/callback?type=recovery`,
    });

    if (error) {
      notify(`Password reset failed: ${error.message}`, 'error');
      return;
    }

    notify('If this email exists, a password reset link has been sent.', 'success');
  };

  const updateName = async (newName: string) => {
    if (!currentUser) return;

    const trimmed = newName.trim();
    if (!trimmed) {
      notify('Name cannot be empty.', 'error');
      return;
    }

    const updated: User = { ...currentUser, name: trimmed, avatar: buildAvatar(trimmed) };
    setCurrentUser(updated);
    await api.syncUser(updated);

    if (supabase) {
      await supabase.auth.updateUser({ data: { full_name: trimmed } });
    }

    notify('Name updated.', 'success');
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
    recoveryRef.current = false;
    setRecoveryMode(false);
    setIsAuthDialogOpen(false);
    clearAuthParams();
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem(DEV_USER_STORAGE_KEY);
    localStorage.removeItem(LOCAL_DB_KEY);
    setCurrentUser(null);
    notify('Signed out.', 'info');
    router.refresh();
  };

  return {
    currentUser,
    isAuthLoading,
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
    updateName,
    updatePassword,
    logout,
  };
};
