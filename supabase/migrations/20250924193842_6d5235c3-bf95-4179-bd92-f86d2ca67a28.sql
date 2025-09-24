-- Create article_bookmarks table
CREATE TABLE public.article_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.article_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own bookmarks"
ON public.article_bookmarks
FOR ALL
USING (user_id = auth.uid() AND company_id = get_user_company_id());

-- Create unique constraint to prevent duplicate bookmarks
ALTER TABLE public.article_bookmarks
ADD CONSTRAINT unique_user_article_bookmark 
UNIQUE (article_id, user_id);

-- Create indexes for performance
CREATE INDEX idx_article_bookmarks_user_id ON public.article_bookmarks(user_id);
CREATE INDEX idx_article_bookmarks_article_id ON public.article_bookmarks(article_id);
CREATE INDEX idx_article_bookmarks_company_id ON public.article_bookmarks(company_id);

-- Add trigger for updated_at
CREATE TRIGGER update_article_bookmarks_updated_at
  BEFORE UPDATE ON public.article_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();