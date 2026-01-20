-- Add parent_branch_id to create hierarchy between headquarters and branches
ALTER TABLE branches 
ADD COLUMN parent_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- Index for efficient hierarchy queries
CREATE INDEX idx_branches_parent ON branches(parent_branch_id);

-- Comment for documentation
COMMENT ON COLUMN branches.parent_branch_id IS 'ID da matriz à qual esta filial pertence';