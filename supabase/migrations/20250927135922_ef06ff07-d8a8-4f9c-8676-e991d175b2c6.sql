-- Create triggers to automatically set company_id for framework tables
CREATE OR REPLACE FUNCTION public.set_framework_company_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.company_id = get_user_company_id();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for all framework tables
CREATE TRIGGER set_sbt_progress_company_id BEFORE INSERT ON public.sbt_progress FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_financed_emissions_company_id BEFORE INSERT ON public.financed_emissions FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_ifrs_disclosures_company_id BEFORE INSERT ON public.ifrs_disclosures FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_sasb_metrics_company_id BEFORE INSERT ON public.sasb_metrics FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_tcfd_disclosures_company_id BEFORE INSERT ON public.tcfd_disclosures FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_esrs_disclosures_company_id BEFORE INSERT ON public.esrs_disclosures FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_science_based_targets_company_id BEFORE INSERT ON public.science_based_targets FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_tnfd_disclosures_company_id BEFORE INSERT ON public.tnfd_disclosures FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_pcaf_assessments_company_id BEFORE INSERT ON public.pcaf_assessments FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_circular_economy_assessments_company_id BEFORE INSERT ON public.circular_economy_assessments FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_material_flows_company_id BEFORE INSERT ON public.material_flows FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_management_standards_company_id BEFORE INSERT ON public.management_standards FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_security_frameworks_company_id BEFORE INSERT ON public.security_frameworks FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();
CREATE TRIGGER set_framework_controls_company_id BEFORE INSERT ON public.framework_controls FOR EACH ROW EXECUTE FUNCTION set_framework_company_id();