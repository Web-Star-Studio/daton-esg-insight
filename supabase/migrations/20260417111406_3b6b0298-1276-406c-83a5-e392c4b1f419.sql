-- Recreate view to include company_id for filtering
DROP VIEW IF EXISTS public.page_view_stats_90d;

CREATE OR REPLACE VIEW public.page_view_stats_90d
WITH (security_invoker = true)
AS
SELECT
  pathname,
  company_id,
  COUNT(*)::int AS views,
  COUNT(DISTINCT user_id)::int AS unique_users,
  MAX(viewed_at) AS last_viewed_at
FROM public.page_view_logs
WHERE viewed_at >= now() - INTERVAL '90 days'
GROUP BY pathname, company_id;