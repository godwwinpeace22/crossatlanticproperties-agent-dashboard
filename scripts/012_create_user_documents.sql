-- Create user_documents table for storing user-uploaded documents
CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_name text NOT NULL,
  document_type text NOT NULL, -- 'account', 'purchase', 'kyc', 'legal', 'other'
  description text,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Could be user themselves or admin
  is_admin_uploaded boolean DEFAULT false,
  tags text[], -- For categorization and search
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.user_documents ENABLE row level security;

-- RLS Policies for user documents
CREATE POLICY "Users can view their own documents"
  ON public.user_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents"
  ON public.user_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.user_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.user_documents FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user documents"
  ON public.user_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all user documents"
  ON public.user_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON public.user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_uploaded_by ON public.user_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_user_documents_created_at ON public.user_documents(created_at);

-- Create trigger for updated_at
CREATE TRIGGER handle_user_documents_updated_at
  BEFORE UPDATE ON public.user_documents
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create storage bucket for user documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for storage bucket
CREATE POLICY "Users can view their own documents in storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-documents' 
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Users can upload their own documents to storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-documents' 
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Users can update their own documents in storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-documents' 
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Users can delete their own documents in storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-documents' 
    AND (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Admins can manage all documents in storage"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'user-documents' 
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );