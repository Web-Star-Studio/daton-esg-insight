-- Create updated_at triggers (if they don't exist yet)
DO $$ 
BEGIN
    -- Check if trigger exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_carbon_projects_updated_at'
    ) THEN
        CREATE TRIGGER update_carbon_projects_updated_at
          BEFORE UPDATE ON public.carbon_projects
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_credit_purchases_updated_at'
    ) THEN
        CREATE TRIGGER update_credit_purchases_updated_at
          BEFORE UPDATE ON public.credit_purchases
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

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

-- Create trigger to automatically update available quantity (if doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_available_quantity'
    ) THEN
        CREATE TRIGGER trigger_update_available_quantity
            AFTER INSERT OR UPDATE OR DELETE ON public.credit_retirements
            FOR EACH ROW
            EXECUTE FUNCTION public.update_available_quantity();
    END IF;
END $$;

-- Create trigger to set initial available_quantity on insert
CREATE OR REPLACE FUNCTION public.set_initial_available_quantity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Set available_quantity to quantity_tco2e on insert if not explicitly set
    IF NEW.available_quantity IS NULL OR NEW.available_quantity = 0 THEN
        NEW.available_quantity := NEW.quantity_tco2e;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for initial available quantity (if doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_set_initial_available_quantity'
    ) THEN
        CREATE TRIGGER trigger_set_initial_available_quantity
            BEFORE INSERT ON public.credit_purchases
            FOR EACH ROW
            EXECUTE FUNCTION public.set_initial_available_quantity();
    END IF;
END $$;