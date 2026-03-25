'use client';

import { useState, type FormEvent } from 'react';
import { useLanguage } from '@/app/providers';
import { Button, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Locale } from '@/lib/i18n/translations';

const copy: Record<Locale, { heading: string; body: string; placeholder: string; cta: string; success: string; error: string }> = {
  en: {
    heading: 'Stay in the loop',
    body: 'Get a weekly digest of art events across Vietnam — bilingual, curated, free.',
    placeholder: 'your@email.com',
    cta: 'Subscribe',
    success: 'You\'re in! We\'ll be in touch.',
    error: 'Something went wrong. Please try again.',
  },
  vi: {
    heading: 'Cập nhật mỗi tuần',
    body: 'Nhận bản tin sự kiện nghệ thuật Việt Nam hàng tuần — song ngữ, chọn lọc, miễn phí.',
    placeholder: 'email@cuaban.com',
    cta: 'Đăng ký',
    success: 'Đã đăng ký! Chúng mình sẽ liên hệ sớm.',
    error: 'Có lỗi xảy ra. Vui lòng thử lại.',
  },
};

interface NewsletterSignupProps {
  source?: string;
  className?: string;
}

export const NewsletterSignup = ({ source = 'homepage', className }: NewsletterSignupProps) => {
  const { language } = useLanguage();
  const t = copy[language];
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('newsletter_signups')
        .upsert({ email: email.trim().toLowerCase(), source }, { onConflict: 'email' });

      if (error) {
        setStatus('error');
        return;
      }

      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-foreground">{t.heading}</h3>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{t.body}</p>
      {status === 'success' ? (
        <p className="mt-4 text-sm font-medium text-success">{t.success}</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={status === 'loading'}>
            {t.cta}
          </Button>
        </form>
      )}
      {status === 'error' ? (
        <p className="mt-2 text-sm text-destructive">{t.error}</p>
      ) : null}
    </div>
  );
};
