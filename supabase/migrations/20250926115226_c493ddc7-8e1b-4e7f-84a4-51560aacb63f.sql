-- Fix foreign key relationships for career development tables

-- Add proper foreign key constraints
ALTER TABLE career_development_plans 
ADD CONSTRAINT career_development_plans_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE career_development_plans 
ADD CONSTRAINT career_development_plans_mentor_id_fkey 
FOREIGN KEY (mentor_id) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE succession_plans 
ADD CONSTRAINT succession_plans_current_holder_id_fkey 
FOREIGN KEY (current_holder_id) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE succession_candidates 
ADD CONSTRAINT succession_candidates_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE mentoring_relationships 
ADD CONSTRAINT mentoring_relationships_mentor_id_fkey 
FOREIGN KEY (mentor_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE mentoring_relationships 
ADD CONSTRAINT mentoring_relationships_mentee_id_fkey 
FOREIGN KEY (mentee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE employee_competency_assessments 
ADD CONSTRAINT employee_competency_assessments_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

ALTER TABLE job_applications 
ADD CONSTRAINT job_applications_employee_id_fkey 
FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;