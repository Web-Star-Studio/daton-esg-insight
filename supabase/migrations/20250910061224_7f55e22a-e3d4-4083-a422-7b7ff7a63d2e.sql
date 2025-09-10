-- Create document folders table for hierarchical organization
CREATE TABLE public.document_folders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    name TEXT NOT NULL,
    parent_folder_id UUID REFERENCES public.document_folders(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id and tags to existing documents table
ALTER TABLE public.documents 
ADD COLUMN folder_id UUID REFERENCES public.document_folders(id),
ADD COLUMN tags TEXT[];

-- Enable RLS on document_folders
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_folders
CREATE POLICY "Users can view their company folders" 
ON public.document_folders 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create folders for their company" 
ON public.document_folders 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update their company folders" 
ON public.document_folders 
FOR UPDATE 
USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete their company folders" 
ON public.document_folders 
FOR DELETE 
USING (company_id = get_user_company_id());

-- Trigger for updated_at on document_folders
CREATE TRIGGER update_document_folders_updated_at
BEFORE UPDATE ON public.document_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on folder hierarchy queries
CREATE INDEX idx_document_folders_parent ON public.document_folders(parent_folder_id);
CREATE INDEX idx_document_folders_company ON public.document_folders(company_id);
CREATE INDEX idx_documents_folder ON public.documents(folder_id);
CREATE INDEX idx_documents_tags ON public.documents USING GIN(tags);