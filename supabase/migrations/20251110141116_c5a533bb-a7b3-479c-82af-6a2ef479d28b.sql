-- Create table for GRI document uploads
CREATE TABLE IF NOT EXISTS gri_document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES gri_reports(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_kb NUMERIC,
  category TEXT CHECK (category IN ('Environmental', 'Social', 'Economic', 'Governance', 'General')),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_text TEXT,
  extracted_metrics JSONB,
  suggested_indicators JSONB,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ai_analysis JSONB,
  uploaded_by_user_id UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for report visualizations
CREATE TABLE IF NOT EXISTS report_visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES gri_reports(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  visualization_type TEXT NOT NULL CHECK (visualization_type IN ('bar', 'line', 'pie', 'area', 'scatter', 'heatmap', 'gauge', 'table')),
  title TEXT NOT NULL,
  data_source_query TEXT,
  chart_config JSONB NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for report comments (collaborative review)
CREATE TABLE IF NOT EXISTS report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES gri_reports(id) ON DELETE CASCADE,
  section_key TEXT,
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'suggestion' CHECK (comment_type IN ('suggestion', 'approval', 'rejection', 'question')),
  created_by_user_id UUID REFERENCES auth.users(id),
  resolved BOOLEAN DEFAULT false,
  resolved_by_user_id UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for report approvals
CREATE TABLE IF NOT EXISTS report_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES gri_reports(id) ON DELETE CASCADE,
  approver_user_id UUID REFERENCES auth.users(id) NOT NULL,
  approval_level TEXT NOT NULL CHECK (approval_level IN ('responsible', 'manager', 'director', 'board')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE gri_document_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gri_document_uploads
CREATE POLICY "Users can view their company's document uploads"
  ON gri_document_uploads FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert document uploads for their company"
  ON gri_document_uploads FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update their company's document uploads"
  ON gri_document_uploads FOR UPDATE
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete their company's document uploads"
  ON gri_document_uploads FOR DELETE
  USING (company_id = get_user_company_id());

-- RLS Policies for report_visualizations
CREATE POLICY "Users can view visualizations for their company's reports"
  ON report_visualizations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM gri_reports
    WHERE gri_reports.id = report_visualizations.report_id
    AND gri_reports.company_id = get_user_company_id()
  ));

CREATE POLICY "Users can insert visualizations for their company's reports"
  ON report_visualizations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM gri_reports
    WHERE gri_reports.id = report_visualizations.report_id
    AND gri_reports.company_id = get_user_company_id()
  ));

CREATE POLICY "Users can update visualizations for their company's reports"
  ON report_visualizations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM gri_reports
    WHERE gri_reports.id = report_visualizations.report_id
    AND gri_reports.company_id = get_user_company_id()
  ));

CREATE POLICY "Users can delete visualizations for their company's reports"
  ON report_visualizations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM gri_reports
    WHERE gri_reports.id = report_visualizations.report_id
    AND gri_reports.company_id = get_user_company_id()
  ));

-- RLS Policies for report_comments
CREATE POLICY "Users can view comments on their company's reports"
  ON report_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM gri_reports
    WHERE gri_reports.id = report_comments.report_id
    AND gri_reports.company_id = get_user_company_id()
  ));

CREATE POLICY "Users can insert comments on their company's reports"
  ON report_comments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM gri_reports
    WHERE gri_reports.id = report_comments.report_id
    AND gri_reports.company_id = get_user_company_id()
  ));

CREATE POLICY "Users can update their own comments"
  ON report_comments FOR UPDATE
  USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can resolve comments on their company's reports"
  ON report_comments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM gri_reports
    WHERE gri_reports.id = report_comments.report_id
    AND gri_reports.company_id = get_user_company_id()
  ));

-- RLS Policies for report_approvals
CREATE POLICY "Users can view approvals for their company's reports"
  ON report_approvals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM gri_reports
    WHERE gri_reports.id = report_approvals.report_id
    AND gri_reports.company_id = get_user_company_id()
  ));

CREATE POLICY "Users can insert approvals for their company's reports"
  ON report_approvals FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM gri_reports
    WHERE gri_reports.id = report_approvals.report_id
    AND gri_reports.company_id = get_user_company_id()
  ));

CREATE POLICY "Approvers can update their own approvals"
  ON report_approvals FOR UPDATE
  USING (approver_user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_gri_document_uploads_report_id ON gri_document_uploads(report_id);
CREATE INDEX idx_gri_document_uploads_company_id ON gri_document_uploads(company_id);
CREATE INDEX idx_report_visualizations_report_id ON report_visualizations(report_id);
CREATE INDEX idx_report_comments_report_id ON report_comments(report_id);
CREATE INDEX idx_report_approvals_report_id ON report_approvals(report_id);

-- Create storage bucket for GRI documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('gri-documents', 'gri-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gri-documents bucket
CREATE POLICY "Users can upload documents to their company folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gri-documents' AND
    (storage.foldername(name))[1] = get_user_company_id()::text
  );

CREATE POLICY "Users can view their company's documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'gri-documents' AND
    (storage.foldername(name))[1] = get_user_company_id()::text
  );

CREATE POLICY "Users can delete their company's documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gri-documents' AND
    (storage.foldername(name))[1] = get_user_company_id()::text
  );

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_gri_wizard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gri_document_uploads_updated_at
  BEFORE UPDATE ON gri_document_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_gri_wizard_updated_at();

CREATE TRIGGER update_report_visualizations_updated_at
  BEFORE UPDATE ON report_visualizations
  FOR EACH ROW
  EXECUTE FUNCTION update_gri_wizard_updated_at();