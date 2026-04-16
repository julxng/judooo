-- Add payment tracking columns to purchase_intents
ALTER TABLE public.purchase_intents
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS transaction_ref text,
  ADD COLUMN IF NOT EXISTS gateway_response jsonb;

-- Index for looking up by transaction ref (VNPay/MoMo callback lookup)
CREATE INDEX IF NOT EXISTS idx_purchase_intents_txn_ref
  ON public.purchase_intents (transaction_ref)
  WHERE transaction_ref IS NOT NULL;
