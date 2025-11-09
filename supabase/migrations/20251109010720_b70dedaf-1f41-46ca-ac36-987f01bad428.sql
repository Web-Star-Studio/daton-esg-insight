-- Add foreign key constraint from compliance_tasks to profiles
ALTER TABLE compliance_tasks
ADD CONSTRAINT compliance_tasks_responsible_user_id_fkey
FOREIGN KEY (responsible_user_id)
REFERENCES profiles(id)
ON DELETE SET NULL
ON UPDATE CASCADE;