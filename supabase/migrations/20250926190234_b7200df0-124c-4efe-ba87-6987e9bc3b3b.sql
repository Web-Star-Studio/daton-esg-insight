-- Add foreign key constraints for profiles relationships
ALTER TABLE audit_findings 
ADD CONSTRAINT audit_findings_responsible_user_id_fkey 
FOREIGN KEY (responsible_user_id) REFERENCES profiles(id);

ALTER TABLE activity_logs 
ADD CONSTRAINT activity_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id);