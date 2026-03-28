import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: Request) {
  try {
    const { email, source = 'homepage' } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { error: dbError } = await getSupabase()
      .from('newsletter_signups')
      .upsert({ email: normalizedEmail, source }, { onConflict: 'email' });

    if (dbError) {
      console.error('Newsletter DB error:', dbError);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    const { error: emailError } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Judooo <noreply@judooo.art>',
      to: normalizedEmail,
      subject: 'Chào mừng bạn đến với Judooo! Welcome to Judooo!',
      html: `
        <div style="font-family: 'Instrument Sans', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px;">
          <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 16px;">
            Cảm ơn bạn đã đăng ký! 🎨
          </h1>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">
            Bạn sẽ nhận được bản tin sự kiện nghệ thuật Việt Nam hàng tuần — song ngữ, chọn lọc, miễn phí.
          </p>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">
            You'll receive a weekly digest of art events across Vietnam — bilingual, curated, free.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
          <p style="font-size: 13px; color: #999;">
            Judooo — Khám phá nghệ thuật Việt Nam / Discover Vietnamese art
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Resend email error:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
