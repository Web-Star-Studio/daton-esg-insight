CREATE OR REPLACE FUNCTION set_training_program_defaults()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company_id IS NULL THEN
        NEW.company_id = get_user_company_id();
    END IF;
    IF NEW.created_by_user_id IS NULL THEN
        NEW.created_by_user_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;