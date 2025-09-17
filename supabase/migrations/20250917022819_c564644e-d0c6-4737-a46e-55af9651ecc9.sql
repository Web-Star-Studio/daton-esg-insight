-- Fix RLS policies for GRI-related tables to allow proper INSERT and UPDATE operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their company GRI indicator data" ON public.gri_indicator_data;
DROP POLICY IF EXISTS "Users can manage their company GRI report sections" ON public.gri_report_sections;
DROP POLICY IF EXISTS "Users can manage their company materiality topics" ON public.materiality_topics;
DROP POLICY IF EXISTS "Users can manage their company SDG alignments" ON public.sdg_alignment;

-- Create proper RLS policies for gri_indicator_data
CREATE POLICY "Users can view their company GRI indicator data" 
ON public.gri_indicator_data 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = gri_indicator_data.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can insert GRI indicator data for their company reports" 
ON public.gri_indicator_data 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = gri_indicator_data.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can update their company GRI indicator data" 
ON public.gri_indicator_data 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = gri_indicator_data.report_id 
  AND gri_reports.company_id = get_user_company_id()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = gri_indicator_data.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can delete their company GRI indicator data" 
ON public.gri_indicator_data 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = gri_indicator_data.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

-- Create proper RLS policies for gri_report_sections
CREATE POLICY "Users can view their company GRI report sections" 
ON public.gri_report_sections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = gri_report_sections.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can insert GRI report sections for their company reports" 
ON public.gri_report_sections 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = gri_report_sections.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can update their company GRI report sections" 
ON public.gri_report_sections 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = gri_report_sections.report_id 
  AND gri_reports.company_id = get_user_company_id()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = gri_report_sections.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can delete their company GRI report sections" 
ON public.gri_report_sections 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = gri_report_sections.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

-- Create proper RLS policies for materiality_topics
CREATE POLICY "Users can view their company materiality topics" 
ON public.materiality_topics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = materiality_topics.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can insert materiality topics for their company reports" 
ON public.materiality_topics 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = materiality_topics.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can update their company materiality topics" 
ON public.materiality_topics 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = materiality_topics.report_id 
  AND gri_reports.company_id = get_user_company_id()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = materiality_topics.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can delete their company materiality topics" 
ON public.materiality_topics 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = materiality_topics.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

-- Create proper RLS policies for sdg_alignment
CREATE POLICY "Users can view their company SDG alignments" 
ON public.sdg_alignment 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = sdg_alignment.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can insert SDG alignments for their company reports" 
ON public.sdg_alignment 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = sdg_alignment.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can update their company SDG alignments" 
ON public.sdg_alignment 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = sdg_alignment.report_id 
  AND gri_reports.company_id = get_user_company_id()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = sdg_alignment.report_id 
  AND gri_reports.company_id = get_user_company_id()
));

CREATE POLICY "Users can delete their company SDG alignments" 
ON public.sdg_alignment 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.gri_reports 
  WHERE gri_reports.id = sdg_alignment.report_id 
  AND gri_reports.company_id = get_user_company_id()
));