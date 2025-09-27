import { supabase } from "@/integrations/supabase/client";

// Camada 1: Frameworks de Relato e Divulgação
export interface ReportingFramework {
  id: string;
  name: string;
  category: 'global' | 'regional' | 'initiative';
  status: 'implemented' | 'in_progress' | 'planned' | 'not_started';
  compliance_level: number; // 0-100%
  requirements: FrameworkRequirement[];
  last_updated: string;
}

export interface FrameworkRequirement {
  id: string;
  framework_id: string;
  code: string;
  title: string;
  description: string;
  is_mandatory: boolean;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence_required: boolean;
  due_date?: string;
}

// IFRS S1 & S2 (Prioridade Máxima)
export interface IFRSDisclosure {
  standard: 'S1' | 'S2';
  disclosure_topic: string;
  requirement_code: string;
  status: 'complete' | 'incomplete' | 'not_applicable';
  content: string;
  supporting_evidence: string[];
  last_review_date: string;
}

// GRI Standards
export interface GRIIndicator {
  standard_code: string; // Ex: GRI 2-1, GRI 305-1
  topic: string;
  disclosure_title: string;
  sector_specific: boolean;
  materiality_assessment: 'material' | 'not_material';
  data_value: string | number;
  reporting_period: string;
  verification_status: 'verified' | 'not_verified';
}

// SASB Standards (77 indústrias)
export interface SASBMetric {
  industry_code: string; // Ex: IF-EU (Electric Utilities)
  topic: string;
  metric_code: string;
  accounting_metric: string;
  unit_of_measure: string;
  current_value: number;
  target_value?: number;
  data_source: string;
}

// TCFD Framework
export interface TCFDDisclosure {
  pillar: 'governance' | 'strategy' | 'risk_management' | 'metrics_targets';
  recommendation: string;
  disclosure_status: 'fully_disclosed' | 'partially_disclosed' | 'not_disclosed';
  content: string;
  climate_scenarios: string[];
  financial_impact_quantified: boolean;
}

// CSRD/ESRS (União Europeia)
export interface ESRSDisclosure {
  esrs_standard: string; // Ex: ESRS E1 (Climate change)
  disclosure_requirement: string;
  data_point: string;
  narrative: string;
  quantitative_data?: number;
  unit?: string;
  assurance_level: 'limited' | 'reasonable' | 'none';
}

class ComplianceFrameworksService {
  // IFRS S1 & S2 Services
  async getIFRSDisclosures(): Promise<IFRSDisclosure[]> {
    const { data, error } = await supabase
      .from('ifrs_disclosures')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching IFRS disclosures:', error);
      return [];
    }

    return data?.map(item => ({
      standard: item.category === 'climate' ? 'S2' : 'S1',
      disclosure_topic: item.disclosure_name,
      requirement_code: item.disclosure_id,
      status: item.status === 'approved' ? 'complete' : item.status === 'draft' ? 'incomplete' : 'not_applicable',
      content: item.disclosure_content || '',
      supporting_evidence: item.data_sources || [],
      last_review_date: item.last_reviewed_at || item.updated_at.split('T')[0]
    })) || [];
  }

  async updateIFRSDisclosure(disclosure: Partial<IFRSDisclosure>): Promise<void> {
    const { error } = await supabase
      .from('ifrs_disclosures')
      .update({
        disclosure_content: disclosure.content,
        status: disclosure.status === 'complete' ? 'approved' : disclosure.status === 'incomplete' ? 'draft' : 'draft',
        data_sources: disclosure.supporting_evidence,
        last_reviewed_at: new Date().toISOString()
      })
      .eq('disclosure_id', disclosure.requirement_code);

    if (error) {
      console.error('Error updating IFRS disclosure:', error);
      throw error;
    }
  }

  // GRI Services
  async getGRIIndicators(): Promise<GRIIndicator[]> {
    const { data, error } = await supabase
      .from('gri_indicators_library')
      .select(`
        *,
        gri_indicator_data (
          numeric_value,
          text_value,
          verification_level,
          created_at
        )
      `)
      .order('code');

    if (error) {
      console.error('Error fetching GRI indicators:', error);
      return [];
    }

    return data?.map(item => ({
      standard_code: item.code,
      topic: item.gri_standard,
      disclosure_title: item.title,
      sector_specific: item.sector_specific,
      materiality_assessment: 'material' as const, // Default - could be enhanced with materiality data
      data_value: item.gri_indicator_data?.[0]?.numeric_value?.toString() || 
                  item.gri_indicator_data?.[0]?.text_value || 'Not reported',
      reporting_period: new Date().getFullYear().toString(),
      verification_status: item.gri_indicator_data?.[0]?.verification_level === 'verified' ? 'verified' : 'not_verified'
    })) || [];
  }

  async generateGRIReport(period: string): Promise<any> {
    const indicators = await this.getGRIIndicators();
    
    return {
      reporting_period: period,
      organizational_profile: this.buildOrganizationalProfile(indicators),
      material_topics: this.identifyMaterialTopics(indicators),
      disclosures: this.buildGRIDisclosures(indicators),
      gri_index: this.buildGRIIndex(indicators)
    };
  }

  // SASB Services
  async getSASBMetricsByIndustry(industryCode: string): Promise<SASBMetric[]> {
    const { data, error } = await supabase
      .from('sasb_metrics')
      .select('*')
      .eq('industry_code', industryCode)
      .order('metric_code');

    if (error) {
      console.error('Error fetching SASB metrics:', error);
      return [];
    }

    return data?.map(item => ({
      industry_code: item.industry_code,
      topic: item.disclosure_topic,
      metric_code: item.metric_code,
      accounting_metric: item.accounting_metric,
      unit_of_measure: item.unit_of_measure || '',
      current_value: item.quantitative_value || 0,
      target_value: 0, // Could be enhanced with target tracking
      data_source: item.data_source || 'Internal monitoring'
    })) || [];
  }

  async updateSASBMetric(metric: Partial<SASBMetric>): Promise<void> {
    const { error } = await supabase
      .from('sasb_metrics')
      .update({
        quantitative_value: metric.current_value,
        qualitative_description: metric.data_source,
        updated_at: new Date().toISOString()
      })
      .eq('metric_code', metric.metric_code)
      .eq('industry_code', metric.industry_code);

    if (error) {
      console.error('Error updating SASB metric:', error);
      throw error;
    }
  }

  // TCFD Services
  async getTCFDDisclosures(): Promise<TCFDDisclosure[]> {
    const { data, error } = await supabase
      .from('tcfd_disclosures')
      .select('*')
      .order('pillar', { ascending: true });

    if (error) {
      console.error('Error fetching TCFD disclosures:', error);
      return [];
    }

    return data?.map(item => ({
      pillar: item.pillar as 'governance' | 'strategy' | 'risk_management' | 'metrics_targets',
      recommendation: item.recommendation_title,
      disclosure_status: item.implementation_status === 'completed' ? 'fully_disclosed' : 
                        item.implementation_status === 'in_progress' ? 'partially_disclosed' : 'not_disclosed',
      content: item.disclosure_content || '',
      climate_scenarios: item.scenario_analysis ? Object.keys(item.scenario_analysis) : [],
      financial_impact_quantified: !!item.quantitative_metrics && Object.keys(item.quantitative_metrics).length > 0
    })) || [];
  }

  async runClimateScenarioAnalysis(scenarios: string[]): Promise<any> {
    return {
      scenarios: scenarios,
      physical_risks: this.assessPhysicalRisks(scenarios),
      transition_risks: this.assessTransitionRisks(scenarios),
      opportunities: this.identifyClimateOpportunities(scenarios),
      financial_impacts: this.quantifyFinancialImpacts(scenarios)
    };
  }

  // CSRD/ESRS Services
  async getESRSDisclosures(): Promise<ESRSDisclosure[]> {
    const { data, error } = await supabase
      .from('esrs_disclosures')
      .select('*')
      .order('esrs_standard', { ascending: true });

    if (error) {
      console.error('Error fetching ESRS disclosures:', error);
      return [];
    }

    return data?.map(item => ({
      esrs_standard: item.esrs_standard,
      disclosure_requirement: item.disclosure_requirement,
      data_point: item.disclosure_title,
      narrative: item.disclosure_content || '',
      quantitative_data: item.quantitative_data ? Object.values(item.quantitative_data)[0] as number : undefined,
      unit: item.quantitative_data ? Object.keys(item.quantitative_data)[0] : undefined,
      assurance_level: item.assurance_level as 'limited' | 'reasonable' | 'none'
    })) || [];
  }

  async generateCSRDReport(): Promise<any> {
    const disclosures = await this.getESRSDisclosures();
    
    return {
      general_disclosures: this.buildGeneralDisclosures(disclosures),
      environmental_disclosures: this.buildEnvironmentalDisclosures(disclosures),
      social_disclosures: this.buildSocialDisclosures(disclosures),
      governance_disclosures: this.buildGovernanceDisclosures(disclosures),
      assurance_statement: this.buildAssuranceStatement(disclosures)
    };
  }

  // CDP Integration
  async generateCDPResponses(): Promise<any> {
    return {
      climate_questionnaire: await this.buildClimateQuestionnaire(),
      water_questionnaire: await this.buildWaterQuestionnaire(),
      forests_questionnaire: await this.buildForestsQuestionnaire()
    };
  }

  // UN Global Compact
  async assessGlobalCompactCompliance(): Promise<any> {
    const principles = [
      'human_rights', 'labour', 'environment', 'anti_corruption'
    ];
    
    const assessment = {};
    for (const principle of principles) {
      assessment[principle] = await this.assessPrincipleCompliance(principle);
    }
    
    return assessment;
  }

  // Framework Status
  async getFrameworksStatus(): Promise<ReportingFramework[]> {
    const frameworks = [
      { id: 'ifrs_s1_s2', name: 'IFRS S1 & S2', category: 'global' as const, status: 'in_progress' as const, compliance_level: 25 },
      { id: 'gri', name: 'GRI Standards', category: 'global' as const, status: 'implemented' as const, compliance_level: 75 },
      { id: 'sasb', name: 'SASB Standards', category: 'global' as const, status: 'in_progress' as const, compliance_level: 45 },
      { id: 'tcfd', name: 'TCFD', category: 'global' as const, status: 'in_progress' as const, compliance_level: 35 },
      { id: 'csrd', name: 'CSRD/ESRS', category: 'regional' as const, status: 'planned' as const, compliance_level: 10 },
      { id: 'cdp', name: 'CDP', category: 'initiative' as const, status: 'planned' as const, compliance_level: 15 }
    ];

    return frameworks.map(framework => ({
      ...framework,
      requirements: [],
      last_updated: new Date().toISOString().split('T')[0]
    }));
  }

  // Helper methods
  private buildOrganizationalProfile(indicators: GRIIndicator[]): any {
    return {
      organization_name: 'Company Name',
      activities_brands: 'Business activities and brands',
      location_headquarters: 'Headquarters location',
      countries_operations: ['Brazil']
    };
  }

  private identifyMaterialTopics(indicators: GRIIndicator[]): any[] {
    return indicators
      .filter(i => i.materiality_assessment === 'material')
      .map(i => ({ topic: i.topic, rationale: 'Material to stakeholders' }));
  }

  private buildGRIDisclosures(indicators: GRIIndicator[]): any {
    return indicators.reduce((acc, indicator) => {
      acc[indicator.standard_code] = {
        title: indicator.disclosure_title,
        value: indicator.data_value,
        verification: indicator.verification_status
      };
      return acc;
    }, {});
  }

  private buildGRIIndex(indicators: GRIIndicator[]): any[] {
    return indicators.map(i => ({
      disclosure: i.standard_code,
      page_reference: 'TBD',
      omission: i.materiality_assessment === 'not_material' ? 'Not material' : null
    }));
  }

  private assessPhysicalRisks(scenarios: string[]): any {
    return { acute: ['Extreme weather events'], chronic: ['Rising temperatures'] };
  }

  private assessTransitionRisks(scenarios: string[]): any {
    return { 
      policy: ['Carbon pricing'], 
      technology: ['Clean technology transitions'], 
      market: ['Changing consumer preferences'], 
      reputation: ['Stakeholder concerns'] 
    };
  }

  private identifyClimateOpportunities(scenarios: string[]): any {
    return { 
      resource_efficiency: ['Energy efficiency'], 
      energy_source: ['Renewable energy'], 
      products_services: ['Low-carbon products'], 
      markets: ['New markets'], 
      resilience: ['Enhanced resilience'] 
    };
  }

  private quantifyFinancialImpacts(scenarios: string[]): any {
    return { risks: 1000000, opportunities: 2000000, net_impact: 1000000 };
  }

  private buildGeneralDisclosures(disclosures: ESRSDisclosure[]): any {
    return disclosures.filter(d => d.esrs_standard === 'ESRS 2');
  }

  private buildEnvironmentalDisclosures(disclosures: ESRSDisclosure[]): any {
    return disclosures.filter(d => d.esrs_standard.startsWith('ESRS E'));
  }

  private buildSocialDisclosures(disclosures: ESRSDisclosure[]): any {
    return disclosures.filter(d => d.esrs_standard.startsWith('ESRS S'));
  }

  private buildGovernanceDisclosures(disclosures: ESRSDisclosure[]): any {
    return disclosures.filter(d => d.esrs_standard.startsWith('ESRS G'));
  }

  private buildAssuranceStatement(disclosures: ESRSDisclosure[]): any {
    return {
      provider: 'TBD',
      scope: 'Limited assurance',
      opinion: 'TBD'
    };
  }

  private async buildClimateQuestionnaire(): Promise<any> {
    return { status: 'in_development' };
  }

  private async buildWaterQuestionnaire(): Promise<any> {
    return { status: 'in_development' };
  }

  private async buildForestsQuestionnaire(): Promise<any> {
    return { status: 'in_development' };
  }

  private async assessPrincipleCompliance(principle: string): Promise<any> {
    return { principle, status: 'compliant', evidence: [] };
  }
}

export const complianceFrameworksService = new ComplianceFrameworksService();