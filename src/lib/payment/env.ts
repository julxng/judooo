// Payment gateway environment variables
// Add these to your .env.local

export const paymentEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // VNPay — get from https://sandbox.vnpayment.vn/devreg/
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE || '',
    hashSecret: process.env.VNPAY_HASH_SECRET || '',
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  },

  // MoMo — get from https://developers.momo.vn/
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE || '',
    accessKey: process.env.MOMO_ACCESS_KEY || '',
    secretKey: process.env.MOMO_SECRET_KEY || '',
    endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  },

  // Bank Transfer — your business bank account
  bank: {
    name: process.env.BANK_NAME || 'MB Bank',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
    accountName: process.env.BANK_ACCOUNT_NAME || 'CONG TY JUDOOO',
    branch: process.env.BANK_BRANCH || 'Chi nhánh Hà Nội',
  },
};

export const hasVnpay = Boolean(paymentEnv.vnpay.tmnCode && paymentEnv.vnpay.hashSecret);
export const hasMomo = Boolean(
  paymentEnv.momo.partnerCode && paymentEnv.momo.accessKey && paymentEnv.momo.secretKey,
);
export const hasBankDetails = Boolean(paymentEnv.bank.accountNumber);
