export type PaymentMethod = 'momo' | 'vnpay' | 'bank_transfer' | 'apple_pay' | 'google_pay';

export type PaymentStep =
  | 'select'       // choose method
  | 'bank_details' // show bank account + reference
  | 'redirecting'  // navigating to MoMo / VNPay
  | 'pending'      // bank transfer sent, awaiting confirmation
  | 'success'      // payment confirmed
  | 'failed';      // payment failed

export interface PaymentContext {
  artworkId: string;
  artworkTitle: string;
  artist: string;
  amount: number;         // VND
  imageUrl?: string;
  intentId?: string;      // purchase_intents.id once created
  transactionRef?: string; // our reference code
}

export interface CreatePaymentResponse {
  success: boolean;
  intentId?: string;
  transactionRef?: string;
  redirectUrl?: string;     // VNPay / MoMo redirect URL
  bankDetails?: BankDetails; // bank transfer details
  error?: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string;
  amount: number;
  reference: string;
}

export interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  sublabel: string;
  available: boolean;
  color: string;
  bgColor: string;
}
