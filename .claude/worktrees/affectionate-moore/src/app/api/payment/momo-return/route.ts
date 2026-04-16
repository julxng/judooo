import { NextResponse } from 'next/server';
import { paymentEnv } from '@/lib/payment/env';

// MoMo redirects the user back here after payment
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const resultCode = url.searchParams.get('resultCode');
  const txnRef = url.searchParams.get('ref') ?? url.searchParams.get('orderId') ?? '';
  const isSuccess = resultCode === '0';

  const redirectPath = isSuccess
    ? `/marketplace?payment=success&ref=${txnRef}`
    : `/marketplace?payment=failed&ref=${txnRef}`;

  return NextResponse.redirect(new URL(redirectPath, paymentEnv.appUrl));
}
