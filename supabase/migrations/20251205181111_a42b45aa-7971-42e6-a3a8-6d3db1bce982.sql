-- Add attendance tracking columns to employee_trainings
ALTER TABLE public.employee_trainings 
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS attendance_marked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS attendance_marked_by UUID REFERENCES auth.users(id);

-- Add index for attendance queries
CREATE INDEX IF NOT EXISTS idx_employee_trainings_attended ON public.employee_trainings(attended);

-- Comment on columns
COMMENT ON COLUMN public.employee_trainings.attended IS 'true = present, false = absent, null = not marked';
COMMENT ON COLUMN public.employee_trainings.attendance_marked_at IS 'When the attendance was marked';
COMMENT ON COLUMN public.employee_trainings.attendance_marked_by IS 'User who marked the attendance';