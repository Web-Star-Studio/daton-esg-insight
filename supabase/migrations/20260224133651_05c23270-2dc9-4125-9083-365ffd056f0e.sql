
-- Add branch_id to laia_sectors to scope sectors per branch
ALTER TABLE laia_sectors ADD COLUMN branch_id UUID REFERENCES branches(id);

-- Unique constraint: sector code must be unique within each branch of a company
CREATE UNIQUE INDEX laia_sectors_company_branch_code ON laia_sectors(company_id, branch_id, code);
