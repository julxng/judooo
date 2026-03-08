import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNotice } from '@app/providers/NoticeProvider';
import { Button, Input, Modal } from '@ui/index';
import { Field } from '@components/shared/Field';

type AuthMode = 'signin' | 'signup' | 'reset';

const MODE_LABELS: Record<AuthMode, string> = {
  signin: 'Sign in',
  signup: 'Sign up',
  reset: 'Reset',
};

interface AuthDialogProps {
  onClose: () => void;
  onLoginGoogle: () => void;
  onLoginTestAdmin: () => void;
  onLoginEmailPassword: (email: string, password: string) => Promise<void>;
  onSignUpEmailPassword: (name: string, email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
}

export const AuthDialog = ({
  onClose,
  onLoginGoogle,
  onLoginTestAdmin,
  onLoginEmailPassword,
  onSignUpEmailPassword,
  onResetPassword,
}: AuthDialogProps) => {
  const { notify } = useNotice();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      notify('Please enter a valid email address.', 'warning');
      return;
    }

    if (mode === 'reset') {
      setIsSubmitting(true);
      await onResetPassword(trimmedEmail);
      setIsSubmitting(false);
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
    if (mode === 'signin') {
      await onLoginEmailPassword(trimmedEmail, password);
    } else {
      await onSignUpEmailPassword(trimmedName, trimmedEmail, password);
    }
    setIsSubmitting(false);
  };

  return (
    <Modal title="Judooo Network" onClose={onClose} size="sm">
      <div className="auth-dialog">
        <div className="auth-dialog__modes">
          {(['signin', 'signup', 'reset'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`auth-dialog__mode ${mode === value ? 'auth-dialog__mode--active' : ''}`}
              onClick={() => setMode(value)}
            >
              {MODE_LABELS[value]}
            </button>
          ))}
        </div>

        <form className="auth-dialog__fields" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <Field label="Full Name">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
            </Field>
          ) : null}

          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
            />
          </Field>

          {mode !== 'reset' ? (
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Min. 8 characters"
              />
            </Field>
          ) : null}

          {mode === 'signup' ? (
            <Field label="Confirm Password">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat password"
              />
            </Field>
          ) : null}

          <Button type="submit" variant="default" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? 'Working...'
              : mode === 'signin'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset link'}
          </Button>
        </form>

        <div className="auth-dialog__divider">
          <span>or</span>
        </div>

        <div className="auth-dialog__actions">
          <Button type="button" variant="outline" className="w-full" onClick={onLoginGoogle}>
            Continue with Google
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onLoginTestAdmin}>
            Test Admin
          </Button>
        </div>
      </div>
    </Modal>
  );
};
