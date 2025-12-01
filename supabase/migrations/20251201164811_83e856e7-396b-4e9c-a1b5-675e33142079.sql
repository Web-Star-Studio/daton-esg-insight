-- Add branch_id and responsible_id columns to training_programs table
ALTER TABLE training_programs ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE training_programs ADD COLUMN responsible_id UUID REFERENCES employees(id);