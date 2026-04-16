import { useEffect, useState } from 'react';
import { useNotice } from '@/app/providers/NoticeProvider';
import { Button, Input, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { SignUpRole } from '../types/auth.types';
import { getRoleLabel } from '../utils/roles';

export type AuthMode = 'signin' | 'signup' | 'reset' | 'update-password';

type AuthDialogProps = {
  mode?: AuthMode;
  onClose: () => void;
  onLoginGoogle: () => Promise<void> | void;
  onLoginTestAdmin?: () => void;
  onLoginEmailPassword: (email: string, password: string) => Promise<void>;
  onSignUpEmailPassword: (
    name: string,
    email: string,
    password: string,
    role: SignUpRole,
  ) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onUpdatePassword?: (newPassword: string) => Promise<void>;
};

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const modeLabels: Record<AuthMode, string> = {
  signin: 'Sign in',
  signup: 'Sign up',
  reset: 'Reset',
  'update-password': 'New password',
};

const roleOptions = [
  {
    id: 'art_lover' as const,
    title: 'Collector account',
    body: 'Browse artworks, save events, and plan routes.',
  },
  {
    id: 'artist_pending' as const,
    title: getRoleLabel('artist_pending'),
    body: 'Apply to submit artworks and events. Your posts stay in review until verified.',
  },
  {
    id: 'gallery_manager_pending' as const,
    title: getRoleLabel('gallery_manager_pending'),
    body: 'Apply to submit gallery programming and artworks. Verified managers publish directly.',
  },
];

export const AuthDialog = ({
  mode: initialMode = 'signin',
  onClose,
  onLoginGoogle,
  onLoginTestAdmin,
  onLoginEmailPassword,
  onSignUpEmailPassword,
  onResetPassword,
  onUpdatePassword,
}: AuthDialogProps) => {
  const { notify } = useNotice();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<SignUpRole>('art_lover');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (mode === 'update-password') {
      if (!password || password.length < 8) {
        notify('Password must be at least 8 characters.', 'warning');
        return;
      }
      if (password !== confirmPassword) {
        notify('Passwords do not match.', 'warning');
        return;
      }
      setIsSubmitting(true);
      try {
        await onUpdatePassword?.(password);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      notify('Please enter a valid email address.', 'warning');
      return;
    }

    if (mode === 'reset') {
      setIsSubmitting(true);
      try {
        await onResetPassword(trimmedEmail);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password || password.length < 8) {
      notify('Password must be at least 8 characters.', 'warning');
      return;
    }

    if (mode === 'signup') {
      if (!trimmedName) {
        notify('Please enter your name.', 'warning');
        return;
      }
      if (password !== confirmPassword) {
        notify('Passwords do not match.', 'warning');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await onLoginEmailPassword(trimmedEmail, password);
      } else {
        await onSignUpEmailPassword(trimmedName, trimmedEmail, password, signUpRole);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const headings: Record<AuthMode, { title: string; subtitle: string }> = {
    signin: { title: 'Welcome back', subtitle: 'Sign in to your Judooo account' },
    signup: { title: 'Create account', subtitle: 'Join the Judooo art network' },
    reset: { title: 'Reset password', subtitle: 'We\'ll send you a reset link' },
    'update-password': { title: 'Set new password', subtitle: 'Choose a new password for your account' },
  };

  return (
    <Modal onClose={onClose} size="sm">
      <div className="auth-dialog">
        <div className="auth-dialog__hero">
          <h2 className="auth-dialog__title">{headings[mode].title}</h2>
          <p className="auth-dialog__subtitle">{headings[mode].subtitle}</p>
        </div>

        {mode !== 'update-password' ? (
          <div className="auth-dialog__modes">
            {(['signin', 'signup', 'reset'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={cn(
                  'auth-dialog__mode',
                  mode === value && 'auth-dialog__mode--active',
                )}
                onClick={() => setMode(value)}
              >
                {modeLabels[value]}
              </button>
            ))}
          </div>
        ) : null}

        <div className="auth-dialog__fields">
          {mode === 'signup' ? (
            <>
              <label className="auth-dialog__field">
                <span className="auth-dialog__label">Name</span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                />
              </label>

              <div className="auth-dialog__field">
                <span className="auth-dialog__label">Account type</span>
                <div className="auth-dialog__roles">
                  {roleOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        'auth-dialog__role-card',
                        signUpRole === option.id && 'auth-dialog__role-card--active',
                      )}
                      onClick={() => setSignUpRole(option.id)}
                    >
                      <span className="auth-dialog__role-dot" />
                      <div>
                        <span className="auth-dialog__role-title">{option.title}</span>
                        <span className="auth-dialog__role-desc">{option.body}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {mode !== 'update-password' ? (
            <label className="auth-dialog__field">
              <span className="auth-dialog__label">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </label>
          ) : null}

          {mode !== 'reset' ? (
            <label className="auth-dialog__field">
              <span className="auth-dialog__label">{mode === 'update-password' ? 'New password' : 'Password'}</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8+ characters"
              />
            </label>
          ) : null}

          {mode === 'signup' || mode === 'update-password' ? (
            <label className="auth-dialog__field">
              <span className="auth-dialog__label">Confirm password</span>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat password"
              />
            </label>
          ) : null}
        </div>

        <div className="auth-dialog__actions">
          <Button variant="default" className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? 'Working...'
              : mode === 'signin'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : mode === 'update-password'
                    ? 'Update password'
                    : 'Send reset link'}
          </Button>

          {mode !== 'update-password' ? (
            <>
              <div className="auth-dialog__divider">or</div>

              <Button
                variant="outline"
                className="w-full gap-2"
                disabled={isGoogleLoading || isSubmitting}
                onClick={async () => {
                  setIsGoogleLoading(true);
                  try {
                    await onLoginGoogle();
                  } catch {
                    setIsGoogleLoading(false);
                  }
                }}
              >
                <GoogleIcon />
                {isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
              </Button>
              {process.env.NODE_ENV !== 'production' && onLoginTestAdmin ? (
                <button
                  type="button"
                  className="auth-dialog__test-admin"
                  onClick={onLoginTestAdmin}
                >
                  Continue as Test Admin
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};
