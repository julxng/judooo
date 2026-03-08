import { useEffect, useState } from 'react';
import type { User } from '../types/auth.types';
import { canAccessAdmin } from '../utils/roles';
import { api } from '@services/api';
import { supabase } from '@services/supabase/client';
import { useNotice } from '@app/providers/NoticeProvider';

const DEV_USER_STORAGE_KEY = 'judooo_dev_user';

const mapSessionUser = async (sessionUser: any): Promise<User> => {
  const profile = sessionUser?.id ? await api.getProfile(sessionUser.id) : null;
  return {
    id: sessionUser.id,
    name: profile?.name || sessionUser.user_metadata?.full_name || sessionUser.email || 'User',
    email: sessionUser.email,
    role: profile?.role || 'art_lover',
    avatar:
      profile?.avatar ||
      sessionUser.user_metadata?.avatar_url ||
      'https://api.dicebear.com/7.x/initials/svg?seed=JD',
  };
};

export const useAuthController = () => {
  const { notify } = useNotice();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  useEffect(() => {
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

    if (!supabase) return;

    const init = async () => {
      const { data } = await supabase!.auth.getSession();
      if (data.session?.user) {
        const user = await mapSessionUser(data.session.user);
        setCurrentUser(user);
        await api.syncUser(user);
      }
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await mapSessionUser(session.user);
        setCurrentUser(user);
        await api.syncUser(user);
        localStorage.removeItem(DEV_USER_STORAGE_KEY);
        setIsAuthDialogOpen(false);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const openAuthDialog = () => setIsAuthDialogOpen(true);
  const closeAuthDialog = () => setIsAuthDialogOpen(false);

  const loginTestAdmin = () => {
    const testAdminUser: User = {
      id: 'test-admin',
      name: 'Test Admin',
      email: 'test-admin@local.dev',
      role: 'gallery',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=TA',
    };

    setCurrentUser(testAdminUser);
    setIsAuthDialogOpen(false);
    localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(testAdminUser));
    notify('Local test admin enabled.', 'success');
  };

  const loginWithGoogle = async () => {
    if (!supabase) {
      notify('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 'warning');
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const loginWithPassword = async (email: string, password: string) => {
    if (!supabase) {
      notify('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 'warning');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      notify(`Sign in failed: ${error.message}`, 'error');
      return;
    }

    setIsAuthDialogOpen(false);
  };

  const signUpWithPassword = async (name: string, email: string, password: string) => {
    if (!supabase) {
      notify('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 'warning');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      notify(`Sign up failed: ${error.message}`, 'error');
      return;
    }

    notify('Account created. Check your email to confirm your account, then sign in.', 'success');
    setIsAuthDialogOpen(false);
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      notify('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 'warning');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      notify(`Password reset failed: ${error.message}`, 'error');
      return;
    }

    notify('If this email exists, a password reset link has been sent.', 'success');
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
    canAccessAdmin: canAccessAdmin(currentUser?.role),
    openAuthDialog,
    closeAuthDialog,
    loginTestAdmin,
    loginWithGoogle,
    loginWithPassword,
    signUpWithPassword,
    resetPassword,
    logout,
  };
};
