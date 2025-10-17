-- Add document ID columns to kyc_submissions table to reference user_documents
-- This allows us to centralize all document storage in user_documents table

-- Add new columns to reference documents in user_documents table
ALTER TABLE public.kyc_submissions 
ADD COLUMN government_id_document_id uuid REFERENCES public.user_documents(id) ON DELETE SET NULL,
ADD COLUMN proof_of_address_document_id uuid REFERENCES public.user_documents(id) ON DELETE SET NULL,
ADD COLUMN application_fee_payment_document_id uuid REFERENCES public.user_documents(id) ON DELETE SET NULL,
ADD COLUMN business_document_ids uuid[] DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kyc_government_id_document ON public.kyc_submissions(government_id_document_id);
CREATE INDEX IF NOT EXISTS idx_kyc_proof_of_address_document ON public.kyc_submissions(proof_of_address_document_id);
CREATE INDEX IF NOT EXISTS idx_kyc_application_fee_document ON public.kyc_submissions(application_fee_payment_document_id);

-- Add comments for documentation
COMMENT ON COLUMN public.kyc_submissions.government_id_document_id IS 'Reference to government ID document in user_documents table';
COMMENT ON COLUMN public.kyc_submissions.proof_of_address_document_id IS 'Reference to proof of address document in user_documents table';
COMMENT ON COLUMN public.kyc_submissions.application_fee_payment_document_id IS 'Reference to application fee payment proof in user_documents table';
COMMENT ON COLUMN public.kyc_submissions.business_document_ids IS 'Array of document IDs for business documents in user_documents table';

-- Note: We keep the old URL columns for backwards compatibility during transition
-- They can be removed in a future migration once all data is migrated