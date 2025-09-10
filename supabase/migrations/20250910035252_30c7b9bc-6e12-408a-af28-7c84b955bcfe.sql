-- Create enums for carbon projects module
CREATE TYPE public.carbon_project_status_enum AS ENUM (
  'Ativo',
  'Encerrado', 
  'Suspenso'
);

CREATE TYPE public.credit_status_enum AS ENUM (
  'Disponível',
  'Aposentado',
  'Reservado'
);

-- Create carbon_projects table
CREATE TABLE public.carbon_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  type_methodology VARCHAR NOT NULL,
  standard VARCHAR NOT NULL,
  location VARCHAR,
  description TEXT,
  status carbon_project_status_enum NOT NULL DEFAULT 'Ativo',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_purchases table  
CREATE TABLE public.credit_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_date DATE NOT NULL,
  quantity_tco2e NUMERIC NOT NULL,
  total_cost NUMERIC,
  registry_id VARCHAR,
  project_id UUID REFERENCES public.carbon_projects(id) ON DELETE SET NULL,
  project_name_text VARCHAR,
  standard VARCHAR,
  type_methodology VARCHAR,
  available_quantity NUMERIC NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_retirements table
CREATE TABLE public.credit_retirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retirement_date DATE NOT NULL,
  quantity_tco2e NUMERIC NOT NULL,
  reason TEXT,
  credit_purchase_id UUID NOT NULL REFERENCES public.credit_purchases(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.carbon_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_retirements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for carbon_projects table
CREATE POLICY "Users can view public projects and their company projects" 
ON public.carbon_projects 
FOR SELECT 
USING (is_public = true OR company_id = get_user_company_id());

CREATE POLICY "Users can manage their company projects" 
ON public.carbon_projects 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create RLS policies for credit_purchases table
CREATE POLICY "Users can manage their company credit purchases" 
ON public.credit_purchases 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create RLS policies for credit_retirements table
CREATE POLICY "Users can manage their company credit retirements" 
ON public.credit_retirements 
FOR ALL 
USING (company_id = get_user_company_id());

-- Create updated_at triggers
CREATE TRIGGER update_carbon_projects_updated_at
  BEFORE UPDATE ON public.carbon_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_purchases_updated_at
  BEFORE UPDATE ON public.credit_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_carbon_projects_company_id ON public.carbon_projects(company_id);
CREATE INDEX idx_carbon_projects_is_public ON public.carbon_projects(is_public);
CREATE INDEX idx_carbon_projects_status ON public.carbon_projects(status);

CREATE INDEX idx_credit_purchases_company_id ON public.credit_purchases(company_id);
CREATE INDEX idx_credit_purchases_project_id ON public.credit_purchases(project_id);
CREATE INDEX idx_credit_purchases_purchase_date ON public.credit_purchases(purchase_date);

CREATE INDEX idx_credit_retirements_company_id ON public.credit_retirements(company_id);
CREATE INDEX idx_credit_retirements_purchase_id ON public.credit_retirements(credit_purchase_id);
CREATE INDEX idx_credit_retirements_retirement_date ON public.credit_retirements(retirement_date);

-- Add business validation constraints
ALTER TABLE public.credit_purchases 
ADD CONSTRAINT chk_quantity_tco2e_positive 
CHECK (quantity_tco2e > 0);

ALTER TABLE public.credit_purchases 
ADD CONSTRAINT chk_available_quantity_not_negative 
CHECK (available_quantity >= 0);

ALTER TABLE public.credit_retirements 
ADD CONSTRAINT chk_retirement_quantity_positive 
CHECK (quantity_tco2e > 0);

-- Set available_quantity to equal quantity_tco2e by default
ALTER TABLE public.credit_purchases 
ALTER COLUMN available_quantity SET DEFAULT 0;

-- Create function to update available quantity when credits are retired
CREATE OR REPLACE FUNCTION public.update_available_quantity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update available quantity in credit_purchases
    IF TG_OP = 'INSERT' THEN
        UPDATE public.credit_purchases 
        SET available_quantity = available_quantity - NEW.quantity_tco2e
        WHERE id = NEW.credit_purchase_id;
        
        -- Check if we have enough available credits
        IF (SELECT available_quantity FROM public.credit_purchases WHERE id = NEW.credit_purchase_id) < 0 THEN
            RAISE EXCEPTION 'Insufficient available credits for retirement. Available: %, Requested: %', 
                (SELECT available_quantity + NEW.quantity_tco2e FROM public.credit_purchases WHERE id = NEW.credit_purchase_id),
                NEW.quantity_tco2e;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.credit_purchases 
        SET available_quantity = available_quantity + OLD.quantity_tco2e
        WHERE id = OLD.credit_purchase_id;
        
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle quantity change in retirement
        UPDATE public.credit_purchases 
        SET available_quantity = available_quantity + OLD.quantity_tco2e - NEW.quantity_tco2e
        WHERE id = NEW.credit_purchase_id;
        
        -- Check if we have enough available credits
        IF (SELECT available_quantity FROM public.credit_purchases WHERE id = NEW.credit_purchase_id) < 0 THEN
            RAISE EXCEPTION 'Insufficient available credits for retirement update. Available: %, Requested change: %', 
                (SELECT available_quantity + OLD.quantity_tco2e - NEW.quantity_tco2e FROM public.credit_purchases WHERE id = NEW.credit_purchase_id),
                NEW.quantity_tco2e - OLD.quantity_tco2e;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$;

-- Create trigger to automatically update available quantity
CREATE TRIGGER trigger_update_available_quantity
    AFTER INSERT OR UPDATE OR DELETE ON public.credit_retirements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_available_quantity();

-- Create trigger to set initial available_quantity on insert
CREATE OR REPLACE FUNCTION public.set_initial_available_quantity()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Set available_quantity to quantity_tco2e on insert if not explicitly set
    IF NEW.available_quantity IS NULL THEN
        NEW.available_quantity := NEW.quantity_tco2e;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_initial_available_quantity
    BEFORE INSERT ON public.credit_purchases
    FOR EACH ROW
    EXECUTE FUNCTION public.set_initial_available_quantity();