-- Create waste class enum
CREATE TYPE public.waste_class_enum AS ENUM (
  'Classe I - Perigoso',
  'Classe II A - Não Inerte',
  'Classe II B - Inerte'
);

-- Create waste status enum
CREATE TYPE public.waste_status_enum AS ENUM (
  'Coletado',
  'Em Trânsito',
  'Destinação Finalizada'
);

-- Create waste_logs table
CREATE TABLE public.waste_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mtr_number VARCHAR NOT NULL,
  waste_description VARCHAR NOT NULL,
  waste_class waste_class_enum NOT NULL,
  collection_date DATE NOT NULL,
  quantity NUMERIC NOT NULL,
  unit VARCHAR NOT NULL,
  transporter_name VARCHAR,
  transporter_cnpj VARCHAR,
  destination_name VARCHAR,
  destination_cnpj VARCHAR,
  final_treatment_type VARCHAR,
  cost NUMERIC,
  status waste_status_enum NOT NULL DEFAULT 'Coletado',
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waste_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for waste_logs table
CREATE POLICY "Users can manage their company waste logs"
ON public.waste_logs
FOR ALL
USING (company_id = get_user_company_id());

-- Create trigger for updated_at on waste_logs
CREATE TRIGGER update_waste_logs_updated_at
BEFORE UPDATE ON public.waste_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_waste_logs_company_id ON public.waste_logs(company_id);
CREATE INDEX idx_waste_logs_status ON public.waste_logs(status);
CREATE INDEX idx_waste_logs_collection_date ON public.waste_logs(collection_date);
CREATE INDEX idx_waste_logs_mtr_number ON public.waste_logs(mtr_number);
CREATE INDEX idx_waste_logs_waste_class ON public.waste_logs(waste_class);

-- Add validation constraints
ALTER TABLE public.waste_logs 
ADD CONSTRAINT check_quantity_positive 
CHECK (quantity > 0);

ALTER TABLE public.waste_logs 
ADD CONSTRAINT check_cost_non_negative 
CHECK (cost IS NULL OR cost >= 0);

ALTER TABLE public.waste_logs 
ADD CONSTRAINT check_collection_date_not_future 
CHECK (collection_date <= CURRENT_DATE);

-- Add constraint for CNPJ format when provided
ALTER TABLE public.waste_logs 
ADD CONSTRAINT check_transporter_cnpj_format 
CHECK (transporter_cnpj IS NULL OR LENGTH(transporter_cnpj) >= 14);

ALTER TABLE public.waste_logs 
ADD CONSTRAINT check_destination_cnpj_format 
CHECK (destination_cnpj IS NULL OR LENGTH(destination_cnpj) >= 14);