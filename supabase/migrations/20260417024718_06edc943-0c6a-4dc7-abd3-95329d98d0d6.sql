CREATE TABLE public.page_view_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  company_id UUID,
  pathname TEXT NOT NULL,
  search TEXT,
  referrer TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_view_logs_pathname ON public.page_view_logs(pathname);
CREATE INDEX idx_page_view_logs_viewed_at ON public.page_view_logs(viewed_at DESC);
CREATE INDEX idx_page_view_logs_company ON public.page_view_logs(company_id, viewed_at DESC);

ALTER TABLE public.page_view_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page views"
ON public.page_view_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Platform admins can read page views"
ON public.page_view_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.platform_admins pa
    WHERE pa.user_id = auth.uid()
      AND pa.is_active = true
  )
);

CREATE OR REPLACE VIEW public.page_view_stats_90d
WITH (security_invoker = true)
AS
SELECT
  pathname,
  COUNT(*)::int AS views,
  COUNT(DISTINCT user_id)::int AS unique_users,
  MAX(viewed_at) AS last_viewed_at
FROM public.page_view_logs
WHERE viewed_at >= now() - INTERVAL '90 days'
GROUP BY pathname
ORDER BY views DESC;