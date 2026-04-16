'use client';

import { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { useNotice } from '@/app/providers/NoticeProvider';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type {
  BankDetails,
  CreatePaymentResponse,
  PaymentContext,
  PaymentMethod,
  PaymentMethodConfig,
  PaymentStep,
} from '../types';

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'momo',
    label: 'MoMo',
    sublabel: 'Ví điện tử MoMo',
    available: true,
    color: '#fff',
    bgColor: '#AE2070',
  },
  {
    id: 'vnpay',
    label: 'VNPay',
    sublabel: 'Thẻ ATM / QR Code',
    available: true,
    color: '#fff',
    bgColor: '#0066AE',
  },
  {
    id: 'bank_transfer',
    label: 'Chuyển khoản',
    sublabel: 'Internet Banking',
    available: true,
    color: '#1a1a1a',
    bgColor: '#f5f5f0',
  },
  {
    id: 'apple_pay',
    label: 'Apple / Google Pay',
    sublabel: 'Sắp có · Coming soon',
    available: false,
    color: '#666',
    bgColor: '#f0f0f0',
  },
];

interface PaymentModalProps {
  context: PaymentContext;
  onClose: () => void;
  onSuccess?: (intentId: string) => void;
}

export const PaymentModal = ({ context, onClose, onSuccess }: PaymentModalProps) => {
  const { notify } = useNotice();
  const [step, setStep] = useState<PaymentStep>('select');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleProceed = async () => {
    if (!selectedMethod) return;
    setLoading(true);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artworkId: context.artworkId,
          amount: context.amount,
          paymentMethod: selectedMethod,
          artworkTitle: context.artworkTitle,
        }),
      });

      const data: CreatePaymentResponse = await response.json();

      if (!data.success) {
        setErrorMessage(data.error ?? 'Không thể tạo thanh toán. Vui lòng thử lại.');
        setStep('failed');
        return;
      }

      if (data.intentId) setIntentId(data.intentId);

      if (selectedMethod === 'bank_transfer' && data.bankDetails) {
        setBankDetails(data.bankDetails);
        setStep('bank_details');
        return;
      }

      if (data.redirectUrl) {
        setStep('redirecting');
        // Small delay so user sees the redirecting state before navigation
        setTimeout(() => {
          window.location.href = data.redirectUrl!;
        }, 800);
        return;
      }

      setErrorMessage('Phương thức thanh toán chưa được cấu hình.');
      setStep('failed');
    } catch {
      setErrorMessage('Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.');
      setStep('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransferConfirmed = () => {
    setStep('pending');
    if (intentId && onSuccess) onSuccess(intentId);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`Đã sao chép ${label}`, 'success');
    } catch {
      notify('Không thể sao chép', 'warning');
    }
  };

  // ─── Select method step ───────────────────────────────────────────
  if (step === 'select') {
    return (
      <Modal title="Thanh toán · Checkout" onClose={onClose} size="md">
        <div className="flex flex-col gap-6">
          {/* Artwork summary */}
          <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
            {context.imageUrl ? (
              <img
                src={context.imageUrl}
                alt={context.artworkTitle}
                className="h-16 w-12 shrink-0 rounded object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {context.artist}
              </p>
              <p className="mt-0.5 truncate font-display text-lg font-semibold leading-tight tracking-tight text-foreground">
                {context.artworkTitle}
              </p>
              <p className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground">
                {formatCurrency(context.amount)}
              </p>
            </div>
          </div>

          {/* Method grid */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Chọn phương thức thanh toán
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    disabled={!method.available}
                    onClick={() => method.available && setSelectedMethod(method.id)}
                    className={cn(
                      'relative flex flex-col items-start gap-1 rounded-lg border-2 p-4 text-left transition-all duration-150',
                      !method.available && 'cursor-not-allowed opacity-50',
                      method.available && !isSelected && 'border-border hover:border-foreground/40 bg-card',
                      isSelected && 'border-foreground bg-card shadow-sm',
                    )}
                  >
                    {/* Logo block */}
                    <span
                      className="flex h-9 w-14 items-center justify-center rounded-md text-xs font-bold tracking-wide"
                      style={{ backgroundColor: method.bgColor, color: method.color }}
                    >
                      {method.id === 'momo' && 'MoMo'}
                      {method.id === 'vnpay' && 'VNPay'}
                      {method.id === 'bank_transfer' && '🏦'}
                      {method.id === 'apple_pay' && '🍎 G'}
                    </span>
                    <span className="mt-1 text-sm font-semibold text-foreground">{method.label}</span>
                    <span className="text-xs text-muted-foreground">{method.sublabel}</span>
                    {isSelected && (
                      <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!selectedMethod || loading}
            onClick={handleProceed}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
            ) : (
              `Thanh toán ${formatCurrency(context.amount)}`
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Bằng cách tiến hành, bạn đồng ý với điều khoản mua bán của Judooo.
          </p>
        </div>
      </Modal>
    );
  }

  // ─── Redirecting step ─────────────────────────────────────────────
  if (step === 'redirecting') {
    return (
      <Modal title="Đang chuyển hướng" onClose={onClose} size="sm">
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 size={36} className="animate-spin text-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            Đang chuyển đến cổng thanh toán{' '}
            <strong>{selectedMethod === 'momo' ? 'MoMo' : 'VNPay'}</strong>…
          </p>
        </div>
      </Modal>
    );
  }

  // ─── Bank transfer step ───────────────────────────────────────────
  if (step === 'bank_details' && bankDetails) {
    const rows: Array<{ label: string; value: string; copy?: boolean }> = [
      { label: 'Ngân hàng', value: bankDetails.bankName },
      { label: 'Số tài khoản', value: bankDetails.accountNumber, copy: true },
      { label: 'Chủ tài khoản', value: bankDetails.accountName },
      { label: 'Chi nhánh', value: bankDetails.branch },
      { label: 'Số tiền', value: formatCurrency(bankDetails.amount), copy: true },
      { label: 'Nội dung chuyển', value: bankDetails.reference, copy: true },
    ];

    return (
      <Modal title="Chuyển khoản ngân hàng" onClose={onClose} size="md">
        <div className="flex flex-col gap-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <strong>Lưu ý:</strong> Vui lòng điền chính xác nội dung chuyển khoản để hệ thống xác
            nhận tự động.
          </div>

          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {rows.map(({ label, value, copy: canCopy }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 font-medium text-foreground">{value}</p>
                </div>
                {canCopy && (
                  <button
                    type="button"
                    onClick={() => copy(value, label)}
                    className="shrink-0 rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    aria-label={`Sao chép ${label}`}
                  >
                    <Copy size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={handleBankTransferConfirmed}>
            Tôi đã chuyển khoản
          </Button>

          <button
            type="button"
            className="text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setStep('select')}
          >
            Chọn phương thức khác
          </button>
        </div>
      </Modal>
    );
  }

  // ─── Pending (bank transfer submitted) ───────────────────────────
  if (step === 'pending') {
    return (
      <Modal title="Đang xác nhận thanh toán" onClose={onClose} size="sm">
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <ExternalLink size={28} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-foreground">Chờ xác nhận</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Thanh toán của bạn đang chờ xác nhận. Chúng tôi sẽ thông báo trong vòng 24 giờ sau
              khi nhận được chuyển khoản.
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </Modal>
    );
  }

  // ─── Success ──────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <Modal title="Thanh toán thành công" onClose={onClose} size="sm">
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-foreground">Thành công!</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Thanh toán đã được xác nhận. Gallery sẽ liên hệ với bạn để hoàn tất giao dịch.
            </p>
          </div>
          <Button variant="primary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </Modal>
    );
  }

  // ─── Failed ───────────────────────────────────────────────────────
  return (
    <Modal title="Thanh toán thất bại" onClose={onClose} size="sm">
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <XCircle size={28} />
        </div>
        <div>
          <p className="font-display text-xl font-semibold text-foreground">Thanh toán thất bại</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {errorMessage ?? 'Đã xảy ra lỗi. Vui lòng thử lại.'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('select')}>
            Thử lại
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
