import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { paymentEnv } from '@/lib/payment/env';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { orderId, resultCode, signature, amount } = body as {
      orderId: string;
      resultCode: number;
      signature: string;
      amount: number;
      message: string;
    };

    // Verify MoMo signature
    const { partnerCode, accessKey, secretKey } = paymentEnv.momo;
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${body.extraData ?? ''}` +
      `&message=${body.message ?? ''}` +
      `&orderId=${orderId}` +
      `&orderInfo=${body.orderInfo ?? ''}` +
      `&orderType=${body.orderType ?? ''}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${body.payType ?? ''}` +
      `&requestId=${body.requestId ?? ''}` +
      `&responseTime=${body.responseTime ?? ''}` +
      `&resultCode=${resultCode}` +
      `&transId=${body.transId ?? ''}`;

    const expected = createHmac('sha256', secretKey).update(rawSignature).digest('hex');
    const isValid = signature === expected;
    const isSuccess = isValid && resultCode === 0;

    if (orderId) {
      const supabase = await createClient();
      await supabase
        .from('purchase_intents')
        .update({
          status: isSuccess ? 'paid' : 'cancelled',
          gateway_response: body,
        })
        .eq('transaction_ref', orderId);
    }

    // MoMo expects 204 or 200 with no content on success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('MoMo IPN error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
