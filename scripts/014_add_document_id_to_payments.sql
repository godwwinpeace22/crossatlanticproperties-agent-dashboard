-- Add document ID column to installment_payments table to reference user_documents

-- Add new column to reference payment proof document in user_documents table
ALTER TABLE public.installment_payments 
ADD COLUMN payment_proof_document_id uuid REFERENCES public.user_documents(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_installment_payments_document ON public.installment_payments(payment_proof_document_id);

-- Add comment for documentation
COMMENT ON COLUMN public.installment_payments.payment_proof_document_id IS 'Reference to payment proof document in user_documents table';

-- Note: We keep the old payment_proof_url column for backwards compatibility during transition
-- It can be removed in a future migration once all data is migrated