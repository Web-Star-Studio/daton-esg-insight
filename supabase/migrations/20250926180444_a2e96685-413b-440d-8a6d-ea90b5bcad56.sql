-- Add foreign key constraints for employee_trainings table
ALTER TABLE public.employee_trainings 
ADD CONSTRAINT employee_trainings_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

ALTER TABLE public.employee_trainings 
ADD CONSTRAINT employee_trainings_training_program_id_fkey 
FOREIGN KEY (training_program_id) REFERENCES public.training_programs(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_trainings_employee_id ON public.employee_trainings(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_trainings_training_program_id ON public.employee_trainings(training_program_id);