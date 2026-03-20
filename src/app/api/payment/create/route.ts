import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { paymentEnv, hasVnpay, hasMomo, hasBankDetails } from '@/lib/payment/env';
import type { CreatePaymentResponse } from '@/features/payment/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateRef(): string {
  return `JDO-${Date.now().toString(36).toUpperCase()}`;
}

function vnpayDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function buildVnpayUrl(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});

  const queryString = Object.entries(sorted)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const hmac = createHmac('sha512', paymentEnv.vnpay.hashSecret);
  const signed = hmac
    .update(
      Object.entries(sorted)
        .map(([k, v]) => `${k}=${v}`)
        .join('&'),
    )
    .digest('hex');

  return `${paymentEnv.vnpay.url}?${queryString}&vnp_SecureHash=${signed}`;
}

async function buildMomoUrl(
  txnRef: string,
  amount: number,
  orderInfo: string,
  returnUrl: string,
  ipnUrl: string,
): Promise<string> {
  const { partnerCode, accessKey, secretKey, endpoint } = paymentEnv.momo;
  const requestId = `${txnRef}-${Date.now()}`;

  const rawSignature =
    `accessKey=${accessKey}` +
    `&amount=${amount}` +
    `&extraData=` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${txnRef}` +
    `&orderInfo=${orderInfo}` +
    `&partnerCode=${partnerCode}` +
    `&redirectUrl=${returnUrl}` +
    `&requestId=${requestId}` +
    `&requestType=payWithMethod`;

  const signature = createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const body = JSON.stringify({
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId: txnRef,
    orderInfo,
    redirectUrl: returnUrl,
    ipnUrl,
    requestType: 'payWithMethod',
    extraData: '',
    lang: 'vi',
    signature,
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json();
  if (data.resultCode !== 0) throw new Error(data.message || 'MoMo error');
  return data.payUrl as string;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse<CreatePaymentResponse>> {
  try {
    const body = await request.json();
    const { artworkId, amount, paymentMethod, artworkTitle } = body as {
      artworkId: string;
      amount: number;
      paymentMethod: string;
      artworkTitle: string;
    };

    if (!artworkId || !amount || !paymentMethod) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin thanh toán.' });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập để thanh toán.' });
    }

    const txnRef = generateRef();
    const appUrl = paymentEnv.appUrl;

    // Create purchase_intent record
    const { data: intent, error: intentError } = await supabase
      .from('purchase_intents')
      .insert({
        artwork_id: artworkId,
        buyer_id: user.id,
        status: 'pending_payment',
        offered_price: amount,
        message: `Thanh toán qua ${paymentMethod}`,
        payment_method: paymentMethod,
        transaction_ref: txnRef,
      })
      .select('id')
      .single();

    if (intentError || !intent) {
      console.error('purchase_intent insert error', intentError);
      return NextResponse.json({ success: false, error: 'Không thể tạo đơn hàng.' });
    }

    // ── Bank transfer ────────────────────────────────────────────────
    if (paymentMethod === 'bank_transfer') {
      return NextResponse.json({
        success: true,
        intentId: intent.id,
        transactionRef: txnRef,
        bankDetails: {
          bankName: paymentEnv.bank.name,
          accountNumber: hasBankDetails
            ? paymentEnv.bank.accountNumber
            : '0000 0000 0000 (chưa cấu hình)',
          accountName: paymentEnv.bank.accountName,
          branch: paymentEnv.bank.branch,
          amount,
          reference: txnRef,
        },
      });
    }

    // ── VNPay ────────────────────────────────────────────────────────
    if (paymentMethod === 'vnpay') {
      if (!hasVnpay) {
        return NextResponse.json({
          success: false,
          error: 'VNPay chưa được cấu hình. Vui lòng chọn phương thức khác.',
        });
      }

      const now = new Date();
      const expire = new Date(now.getTime() + 30 * 60 * 1000);
      const forwardedFor = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
      const ipAddr = forwardedFor.split(',')[0].trim();

      const params: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: paymentEnv.vnpay.tmnCode,
        vnp_Amount: String(amount * 100),
        vnp_CreateDate: vnpayDate(now),
        vnp_CurrCode: 'VND',
        vnp_ExpireDate: vnpayDate(expire),
        vnp_IpAddr: ipAddr,
        vnp_Locale: 'vn',
        vnp_OrderInfo: `Thanh toan ${txnRef} - ${artworkTitle.slice(0, 50)}`,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: `${appUrl}/api/payment/vnpay-return`,
        vnp_TxnRef: txnRef,
      };

      return NextResponse.json({
        success: true,
        intentId: intent.id,
        transactionRef: txnRef,
        redirectUrl: buildVnpayUrl(params),
      });
    }

    // ── MoMo ─────────────────────────────────────────────────────────
    if (paymentMethod === 'momo') {
      if (!hasMomo) {
        return NextResponse.json({
          success: false,
          error: 'MoMo chưa được cấu hình. Vui lòng chọn phương thức khác.',
        });
      }

      const orderInfo = `Thanh toan tac pham - ${txnRef}`;
      const returnUrl = `${appUrl}/api/payment/momo-return?ref=${txnRef}`;
      const ipnUrl = `${appUrl}/api/payment/momo-ipn`;

      const payUrl = await buildMomoUrl(txnRef, amount, orderInfo, returnUrl, ipnUrl);
      return NextResponse.json({
        success: true,
        intentId: intent.id,
        transactionRef: txnRef,
        redirectUrl: payUrl,
      });
    }

    return NextResponse.json({ success: false, error: 'Phương thức thanh toán không hợp lệ.' });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ. Vui lòng thử lại.' });
  }
}
