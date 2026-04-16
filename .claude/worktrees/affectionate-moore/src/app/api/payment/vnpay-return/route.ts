import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { paymentEnv } from '@/lib/payment/env';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());

    // Verify VNPay signature
    const secureHash = params['vnp_SecureHash'];
    const { vnp_SecureHash: _, vnp_SecureHashType: __, ...signParams } = params;

    const sortedQuery = Object.keys(signParams)
      .sort()
      .map((k) => `${k}=${signParams[k]}`)
      .join('&');

    const expectedHash = createHmac('sha512', paymentEnv.vnpay.hashSecret)
      .update(sortedQuery)
      .digest('hex');

    const txnRef = params['vnp_TxnRef'];
    const responseCode = params['vnp_ResponseCode'];
    const isValid = secureHash === expectedHash;
    const isSuccess = isValid && responseCode === '00';

    if (txnRef) {
      const supabase = await createClient();
      await supabase
        .from('purchase_intents')
        .update({
          status: isSuccess ? 'paid' : 'cancelled',
          gateway_response: params,
        })
        .eq('transaction_ref', txnRef);
    }

    const redirectPath = isSuccess
      ? `/marketplace?payment=success&ref=${txnRef}`
      : `/marketplace?payment=failed&ref=${txnRef}`;

    return NextResponse.redirect(new URL(redirectPath, paymentEnv.appUrl));
  } catch (error) {
    console.error('VNPay return error:', error);
    return NextResponse.redirect(new URL('/marketplace?payment=error', paymentEnv.appUrl));
  }
}
