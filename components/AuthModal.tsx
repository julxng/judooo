
import React from 'react';

interface AuthModalProps {
  onLoginGoogle: () => void;
  onLoginTestAdmin: () => void;
  onLoginEmailPassword: (email: string, password: string) => Promise<void>;
  onSignUpEmailPassword: (name: string, email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'reset';

const AuthModal: React.FC<AuthModalProps> = ({
  onLoginGoogle,
  onLoginTestAdmin,
  onLoginEmailPassword,
  onSignUpEmailPassword,
  onResetPassword,
  onClose
}) => {
  const [mode, setMode] = React.useState<AuthMode>('signin');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (mode === 'reset') {
      try {
        setIsSubmitting(true);
        await onResetPassword(trimmedEmail);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password || password.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }

    if (mode === 'signup') {
      if (!trimmedName) {
        alert('Please enter your name.');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (mode === 'signin') {
        await onLoginEmailPassword(trimmedEmail, password);
      } else {
        await onSignUpEmailPassword(trimmedName, trimmedEmail, password);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white p-10 rounded-sm shadow-2xl animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-brand-black transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-black uppercase tracking-tight mb-2">Judooo Network</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Secure account access</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-2 bg-slate-50 border border-slate-100 p-1">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${mode === 'signin' ? 'bg-white text-brand-black border border-slate-200' : 'text-slate-400'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${mode === 'signup' ? 'bg-white text-brand-black border border-slate-200' : 'text-slate-400'}`}
            >
              Sign up
            </button>
            <button
              onClick={() => setMode('reset')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${mode === 'reset' ? 'bg-white text-brand-black border border-slate-200' : 'text-slate-400'}`}
            >
              Reset
            </button>
          </div>

          <div className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full border-2 border-slate-100 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-orange transition-colors"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border-2 border-slate-100 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-orange transition-colors"
            />
            {mode !== 'reset' && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 8 chars)"
                className="w-full border-2 border-slate-100 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-orange transition-colors"
              />
            )}
            {mode === 'signup' && (
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full border-2 border-slate-100 px-4 py-3 text-sm font-semibold outline-none focus:border-brand-orange transition-colors"
              />
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center bg-brand-black text-white py-4 font-black uppercase text-[10px] tracking-widest hover:bg-brand-orange transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Please wait...' : mode === 'signin' ? 'Sign in with Email' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </button>
          </div>

          <button
            onClick={onLoginTestAdmin}
            className="w-full flex items-center justify-center gap-3 bg-slate-700 text-white py-4 font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all"
          >
            Continue as Test Admin (Local only)
          </button>
          <p className="text-[10px] text-slate-400 text-center font-bold uppercase leading-relaxed px-4 -mt-3">
            Local preview mode cannot create records in Supabase.
          </p>
          <button 
            onClick={onLoginGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 py-4 font-black uppercase text-[10px] tracking-widest hover:border-brand-orange transition-all group"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <p className="text-[10px] text-slate-300 text-center font-bold uppercase leading-relaxed px-4">
            By joining, you agree to the Judooo terms and privacy standards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
