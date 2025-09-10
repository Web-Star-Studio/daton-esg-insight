-- Fix security warning by setting search_path for all functions
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

CREATE OR REPLACE FUNCTION public.set_initial_available_quantity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Set available_quantity to quantity_tco2e on insert if not explicitly set
    IF NEW.available_quantity IS NULL THEN
        NEW.available_quantity := NEW.quantity_tco2e;
    END IF;
    
    RETURN NEW;
END;
$$;