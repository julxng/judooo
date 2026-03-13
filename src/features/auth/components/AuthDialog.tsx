import { useEffect, useState } from 'react';
import { useNotice } from '@/app/providers/NoticeProvider';
import { Button, Input, Modal } from '@/components/ui';
import { Field } from '@/components/shared/Field';
import { cn } from '@/lib/utils';
import type { SignUpRole } from '../types/auth.types';
import { getRoleLabel } from '../utils/roles';

export type AuthMode = 'signin' | 'signup' | 'reset';

type AuthDialogProps = {
  mode?: AuthMode;
  onClose: () => void;
  onLoginGoogle: () => void;
  onLoginTestAdmin: () => void;
  onLoginEmailPassword: (email: string, password: string) => Promise<void>;
  onSignUpEmailPassword: (
    name: string,
    email: string,
    password: string,
    role: SignUpRole,
  ) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
};

export const AuthDialog = ({
  mode: initialMode = 'signin',
  onClose,
  onLoginGoogle,
  onLoginTestAdmin,
  onLoginEmailPassword,
  onSignUpEmailPassword,
  onResetPassword,
}: AuthDialogProps) => {
  const { notify } = useNotice();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<SignUpRole>('art_lover');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

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

  return (
    <Modal title="Judooo Network" onClose={onClose} size="sm">
      <div className="auth-dialog">
        <div className="auth-dialog__modes" role="tablist" aria-label="Authentication mode">
          {(['signin', 'signup', 'reset'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`auth-dialog__mode ${mode === value ? 'auth-dialog__mode--active' : ''}`}
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
            >
              {value === 'signin' ? 'Sign in' : value === 'signup' ? 'Sign up' : 'Reset'}
            </button>
          ))}
        </div>

        <form
          className="auth-dialog__fields"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          {mode === 'signup' ? (
            <>
              <Field label="Full Name">
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
              </Field>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Account type</p>
                <div className="grid gap-2">
                  {([
                    {
                      id: 'art_lover',
                      title: 'Collector account',
                      body: 'Browse artworks, save events, and plan routes.',
                    },
                    {
                      id: 'artist_pending',
                      title: getRoleLabel('artist_pending'),
                      body: 'Apply to submit artworks and events. Your posts stay in review until verified.',
                    },
                    {
                      id: 'gallery_manager_pending',
                      title: getRoleLabel('gallery_manager_pending'),
                      body: 'Apply to submit gallery programming and artworks. Verified managers publish directly.',
                    },
                  ] as const).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        'border px-4 py-3 text-left transition-colors',
                        signUpRole === option.id
                          ? 'border-foreground bg-secondary'
                          : 'border-border bg-background hover:border-foreground/60 hover:bg-secondary',
                      )}
                      onClick={() => setSignUpRole(option.id)}
                    >
                      <span className="block text-sm font-semibold text-foreground">{option.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-muted-foreground">{option.body}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
            />
          </Field>

          {mode !== 'reset' ? (
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
              />
            </Field>
          ) : null}

          {mode === 'signup' ? (
            <Field label="Confirm Password">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
              />
            </Field>
          ) : null}
          <div className="auth-dialog__actions">
            <Button variant="default" className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Working...'
                : mode === 'signin'
                  ? 'Sign in with Email'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Send reset link'}
            </Button>
            <Button variant="outline" className="w-full" type="button" onClick={onLoginGoogle} disabled={isSubmitting}>
              Continue with Google
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              type="button"
              onClick={onLoginTestAdmin}
              disabled={isSubmitting}
            >
              Continue as Test Admin
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
