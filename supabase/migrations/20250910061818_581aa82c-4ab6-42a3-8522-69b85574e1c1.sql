-- Create audit-related tables for comprehensive auditing system

-- Create activity_logs table for system audit trail
CREATE TABLE public.activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    details_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audits table for formal audit management
CREATE TABLE public.audits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    title TEXT NOT NULL,
    audit_type TEXT NOT NULL,
    auditor TEXT,
    start_date DATE,
    end_date DATE,
    scope TEXT,
    status TEXT NOT NULL DEFAULT 'Planejada',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_findings table for audit findings/non-conformities
CREATE TABLE public.audit_findings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aberta',
    responsible_user_id UUID,
    due_date DATE,
    action_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all audit tables
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their company activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (company_id = get_user_company_id());

CREATE POLICY "System can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (company_id = get_user_company_id());

-- RLS Policies for audits
CREATE POLICY "Users can manage their company audits" 
ON public.audits 
FOR ALL 
USING (company_id = get_user_company_id());

-- RLS Policies for audit_findings
CREATE POLICY "Users can manage findings from their company audits" 
ON public.audit_findings 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.audits 
    WHERE audits.id = audit_findings.audit_id 
    AND audits.company_id = get_user_company_id()
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_audits_updated_at
BEFORE UPDATE ON public.audits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_findings_updated_at
BEFORE UPDATE ON public.audit_findings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_activity_logs_company ON public.activity_logs(company_id);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);

CREATE INDEX idx_audits_company ON public.audits(company_id);
CREATE INDEX idx_audits_status ON public.audits(status);

CREATE INDEX idx_audit_findings_audit ON public.audit_findings(audit_id);
CREATE INDEX idx_audit_findings_status ON public.audit_findings(status);
CREATE INDEX idx_audit_findings_severity ON public.audit_findings(severity);

-- Function to log activities automatically
CREATE OR REPLACE FUNCTION public.log_activity(
    p_company_id UUID,
    p_user_id UUID,
    p_action_type TEXT,
    p_description TEXT,
    p_details_json JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.activity_logs (
        company_id,
        user_id,
        action_type,
        description,
        details_json
    ) VALUES (
        p_company_id,
        p_user_id,
        p_action_type,
        p_description,
        p_details_json
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;