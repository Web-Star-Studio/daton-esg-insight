-- Create article versions table for version history
CREATE TABLE public.article_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  changes_summary TEXT,
  edited_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL
);

-- Create article comments table for discussions
CREATE TABLE public.article_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL,
  parent_comment_id UUID,
  comment_text TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'comment', -- comment, suggestion, approval_request
  author_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL,
  is_resolved BOOLEAN DEFAULT false
);

-- Create article approval workflow table
CREATE TABLE public.article_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  approver_user_id UUID NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL
);

-- Add version tracking to knowledge_articles
ALTER TABLE public.knowledge_articles 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS last_edited_by_user_id UUID,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS on new tables
ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.article_approvals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for article_versions
CREATE POLICY "Users can view versions from their company articles"
ON public.article_versions FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Users can create versions for their company articles"
ON public.article_versions FOR INSERT
WITH CHECK (company_id = get_user_company_id());

-- Create RLS policies for article_comments
CREATE POLICY "Users can manage comments from their company articles"
ON public.article_comments FOR ALL
USING (company_id = get_user_company_id());

-- Create RLS policies for article_approvals
CREATE POLICY "Users can manage approvals from their company articles"
ON public.article_approvals FOR ALL
USING (company_id = get_user_company_id());

-- Create indexes for performance
CREATE INDEX idx_article_versions_article_id ON public.article_versions(article_id);
CREATE INDEX idx_article_versions_company_id ON public.article_versions(company_id);
CREATE INDEX idx_article_comments_article_id ON public.article_comments(article_id);
CREATE INDEX idx_article_comments_company_id ON public.article_comments(company_id);
CREATE INDEX idx_article_approvals_article_id ON public.article_approvals(article_id);
CREATE INDEX idx_article_approvals_company_id ON public.article_approvals(company_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_article_comments_updated_at
  BEFORE UPDATE ON public.article_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_article_approvals_updated_at
  BEFORE UPDATE ON public.article_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();