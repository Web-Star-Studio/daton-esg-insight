-- Create ENUMs for license management
CREATE TYPE license_type_enum AS ENUM ('LP', 'LI', 'LO', 'LAS', 'LOC', 'Outra');
CREATE TYPE license_status_enum AS ENUM ('Ativa', 'Em Renovação', 'Vencida', 'Suspensa');

-- Create licenses table
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  type license_type_enum NOT NULL,
  issuing_body VARCHAR NOT NULL,
  process_number VARCHAR,
  issue_date DATE,
  expiration_date DATE NOT NULL,
  status license_status_enum NOT NULL DEFAULT 'Ativa',
  conditions TEXT,
  responsible_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table (polymorphic attachments)
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,
  file_size BIGINT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  related_model VARCHAR NOT NULL,
  related_id UUID NOT NULL,
  uploader_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Enable Row Level Security
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for licenses table
CREATE POLICY "Users can manage their company licenses"
ON public.licenses
FOR ALL
USING (company_id = get_user_company_id());

-- RLS Policies for documents table
CREATE POLICY "Users can view their company documents"
ON public.documents
FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert their company documents"
ON public.documents
FOR INSERT
WITH CHECK (company_id = get_user_company_id() AND uploader_user_id = auth.uid());

CREATE POLICY "Users can update their company documents"
ON public.documents
FOR UPDATE
USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete their company documents"
ON public.documents
FOR DELETE
USING (company_id = get_user_company_id());

-- Storage policies for documents bucket
CREATE POLICY "Users can view their company documents in storage"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their company documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their company documents in storage"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their company documents in storage"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add validation constraint for dates
ALTER TABLE public.licenses 
ADD CONSTRAINT check_expiration_after_issue 
CHECK (issue_date IS NULL OR expiration_date >= issue_date);

-- Create trigger for updated_at on licenses
CREATE TRIGGER update_licenses_updated_at
BEFORE UPDATE ON public.licenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_licenses_company_id ON public.licenses(company_id);
CREATE INDEX idx_licenses_status ON public.licenses(status);
CREATE INDEX idx_licenses_expiration_date ON public.licenses(expiration_date);
CREATE INDEX idx_documents_company_id ON public.documents(company_id);
CREATE INDEX idx_documents_related ON public.documents(related_model, related_id);
CREATE UNIQUE INDEX idx_documents_unique_file ON public.documents(related_model, related_id, file_name);

-- Function to calculate license status based on dates
CREATE OR REPLACE FUNCTION public.calculate_license_status(
  issue_date_param DATE,
  expiration_date_param DATE,
  current_status license_status_enum
) 
RETURNS license_status_enum
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- If manually set to specific statuses, respect them
  IF current_status IN ('Em Renovação', 'Suspensa') THEN
    RETURN current_status;
  END IF;
  
  -- Check if expired
  IF expiration_date_param < CURRENT_DATE THEN
    RETURN 'Vencida';
  END IF;
  
  -- Default to active if not expired
  RETURN 'Ativa';
END;
$$;