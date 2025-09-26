-- Fix profile company_id relationship
UPDATE profiles 
SET company_id = 'b579f7d3-690e-4308-90af-c6c41206f905' 
WHERE id = '5782442a-d6a5-49f3-8d14-8d21cda4dae2';

-- Create a function to set company_id and created_by_user_id automatically
CREATE OR REPLACE FUNCTION set_training_program_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Set company_id from user's profile
    NEW.company_id = get_user_company_id();
    -- Set created_by_user_id to current user
    NEW.created_by_user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for training_programs
DROP TRIGGER IF EXISTS set_training_program_defaults_trigger ON training_programs;
CREATE TRIGGER set_training_program_defaults_trigger
    BEFORE INSERT ON training_programs
    FOR EACH ROW
    EXECUTE FUNCTION set_training_program_defaults();

-- Create similar function for employee_trainings
CREATE OR REPLACE FUNCTION set_employee_training_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Set company_id from user's profile
    NEW.company_id = get_user_company_id();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for employee_trainings
DROP TRIGGER IF EXISTS set_employee_training_defaults_trigger ON employee_trainings;
CREATE TRIGGER set_employee_training_defaults_trigger
    BEFORE INSERT ON employee_trainings
    FOR EACH ROW
    EXECUTE FUNCTION set_employee_training_defaults();