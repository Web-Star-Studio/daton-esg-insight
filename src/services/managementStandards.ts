import { supabase } from "@/integrations/supabase/client";

// Camada 2: Normas de Gestão Interna
export interface ManagementSystem {
  id: string;
  standard_code: string; // ISO 14001, ISO 45001, etc.
  standard_name: string;
  category: 'environmental' | 'social' | 'governance';
  implementation_status: 'not_started' | 'planning' | 'implementing' | 'operational' | 'improving';
  certification_status: 'not_certified' | 'in_process' | 'certified' | 'expired';
  certificate_number?: string;
  certificate_expiry?: string;
  certification_body?: string;
  last_audit_date?: string;
  next_audit_date?: string;
  compliance_score: number; // 0-100
  non_conformities: number;
  opportunities_improvement: number;
}

// ISO 14001 - Sistema de Gestão Ambiental
export interface EnvironmentalManagementSystem {
  policy_statement: string;
  environmental_aspects: EnvironmentalAspect[];
  legal_requirements: LegalRequirement[];
  objectives_targets: ObjectiveTarget[];
  programs: EnvironmentalProgram[];
  monitoring_data: MonitoringData[];
  internal_audits: InternalAudit[];
  management_review: ManagementReview[];
}

export interface EnvironmentalAspect {
  id: string;
  aspect: string;
  impact: string;
  significance: 'low' | 'medium' | 'high';
  control_measures: string[];
  monitoring_frequency: string;
}

// ISO 45001 - Saúde e Segurança Ocupacional
export interface OHSManagementSystem {
  policy_statement: string;
  hazard_identification: HazardIdentification[];
  risk_assessments: RiskAssessment[];
  legal_requirements: LegalRequirement[];
  objectives_targets: ObjectiveTarget[];
  incident_investigations: IncidentInvestigation[];
  emergency_procedures: EmergencyProcedure[];
  training_records: TrainingRecord[];
}

export interface HazardIdentification {
  id: string;
  hazard_type: string;
  location: string;
  potential_consequences: string;
  current_controls: string[];
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
}

// ISO 50001 - Sistema de Gestão de Energia
export interface EnergyManagementSystem {
  energy_policy: string;
  energy_review: EnergyReview;
  energy_baseline: EnergyBaseline;
  energy_performance_indicators: EnergyPerformanceIndicator[];
  energy_objectives_targets: ObjectiveTarget[];
  action_plans: ActionPlan[];
  monitoring_data: EnergyMonitoringData[];
}

export interface EnergyReview {
  energy_uses: EnergyUse[];
  significant_energy_uses: string[];
  energy_performance: number;
  opportunities_identified: string[];
}

// SA 8000 - Responsabilidade Social
export interface SocialAccountabilitySystem {
  child_labour_policy: string;
  forced_labour_policy: string;
  health_safety_policy: string;
  freedom_association_policy: string;
  discrimination_policy: string;
  disciplinary_practices_policy: string;
  working_hours_policy: string;
  compensation_policy: string;
  management_system_policy: string;
  supplier_assessments: SupplierAssessment[];
  worker_interviews: WorkerInterview[];
  corrective_actions: CorrectiveAction[];
}

export interface SupplierAssessment {
  supplier_id: string;
  assessment_date: string;
  sa8000_compliance: boolean;
  non_conformities: string[];
  improvement_plan: string;
  next_assessment_date: string;
}

// ISO 31000 - Gestão de Riscos (já implementado parcialmente)
export interface RiskManagementFramework {
  risk_management_policy: string;
  risk_criteria: RiskCriteria;
  risk_register: RiskRegister[];
  risk_treatments: RiskTreatment[];
  monitoring_review: MonitoringReview[];
  communication_consultation: CommunicationConsultation[];
}

// ISO 37001 - Sistema de Gestão Antissuborno
export interface AntiBriberyManagementSystem {
  anti_bribery_policy: string;
  due_diligence_procedures: DueDiligenceProcedure[];
  financial_controls: FinancialControl[];
  training_awareness: TrainingAwareness[];
  reporting_investigation: ReportingInvestigation[];
  monitoring_review: MonitoringReview[];
  third_party_assessments: ThirdPartyAssessment[];
}

// COSO Framework - Controles Internos
export interface COSOFramework {
  control_environment: ControlEnvironment;
  risk_assessment: COSORiskAssessment;
  control_activities: ControlActivity[];
  information_communication: InformationCommunication;
  monitoring_activities: MonitoringActivity[];
}

// Interfaces auxiliares
export interface LegalRequirement {
  id: string;
  requirement: string;
  source: string;
  compliance_status: 'compliant' | 'non_compliant' | 'partially_compliant';
  evidence: string[];
}

export interface ObjectiveTarget {
  id: string;
  objective: string;
  target: string;
  deadline: string;
  responsible: string;
  progress: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
}

export interface EnvironmentalProgram {
  id: string;
  name: string;
  objectives: string[];
  activities: string[];
  resources: string;
  timeline: string;
  responsible: string;
  progress: number;
}

export interface MonitoringData {
  id: string;
  parameter: string;
  value: number;
  unit: string;
  measurement_date: string;
  target: number;
  compliance_status: 'compliant' | 'non_compliant';
}

export interface InternalAudit {
  id: string;
  audit_date: string;
  scope: string;
  auditor: string;
  findings: AuditFinding[];
  recommendations: string[];
  follow_up_date: string;
}

export interface AuditFinding {
  id: string;
  type: 'non_conformity' | 'observation' | 'opportunity';
  description: string;
  evidence: string;
  root_cause: string;
  corrective_action: string;
  responsible: string;
  deadline: string;
  status: 'open' | 'in_progress' | 'closed';
}

export interface ManagementReview {
  id: string;
  review_date: string;
  participants: string[];
  inputs: string[];
  decisions: string[];
  action_items: string[];
  next_review_date: string;
}

export interface RiskAssessment {
  id: string;
  hazard_id: string;
  likelihood: number;
  severity: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
  control_measures: string[];
  residual_risk: number;
}

export interface IncidentInvestigation {
  id: string;
  incident_date: string;
  location: string;
  description: string;
  immediate_causes: string[];
  root_causes: string[];
  corrective_actions: string[];
  preventive_actions: string[];
  responsible: string;
  status: 'open' | 'in_progress' | 'closed';
}

export interface EmergencyProcedure {
  id: string;
  emergency_type: string;
  procedure: string;
  responsible_roles: string[];
  contact_information: string[];
  last_drill_date: string;
  next_drill_date: string;
}

export interface TrainingRecord {
  id: string;
  employee_id: string;
  training_topic: string;
  training_date: string;
  trainer: string;
  duration_hours: number;
  competency_achieved: boolean;
  next_training_date?: string;
}

class ManagementStandardsService {
  // ISO 14001 Services
  async getEnvironmentalManagementSystem(): Promise<EnvironmentalManagementSystem> {
    const { data, error } = await supabase
      .from('environmental_management_systems')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || this.getDefaultEMS();
  }

  async updateEnvironmentalAspects(aspects: EnvironmentalAspect[]): Promise<void> {
    const { error } = await supabase
      .from('environmental_aspects')
      .upsert(aspects);
    
    if (error) throw error;
  }

  async conductEnvironmentalReview(): Promise<any> {
    const aspects = await this.getEnvironmentalAspects();
    const legalReqs = await this.getLegalRequirements('environmental');
    const objectives = await this.getObjectivesTargets('environmental');
    
    return {
      significant_aspects: aspects.filter(a => a.significance === 'high'),
      compliance_status: this.assessLegalCompliance(legalReqs),
      objective_performance: this.assessObjectivePerformance(objectives),
      improvement_opportunities: this.identifyImprovementOpportunities(aspects)
    };
  }

  // ISO 45001 Services
  async getOHSManagementSystem(): Promise<OHSManagementSystem> {
    const { data, error } = await supabase
      .from('ohs_management_systems')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || this.getDefaultOHS();
  }

  async conductHazardIdentification(): Promise<HazardIdentification[]> {
    const { data, error } = await supabase
      .from('hazard_identifications')
      .select('*')
      .order('risk_level desc');
    
    if (error) throw error;
    return data || [];
  }

  async investigateIncident(incident: Partial<IncidentInvestigation>): Promise<void> {
    const { error } = await supabase
      .from('incident_investigations')
      .insert(incident);
    
    if (error) throw error;
  }

  // ISO 50001 Services
  async getEnergyManagementSystem(): Promise<EnergyManagementSystem> {
    const { data, error } = await supabase
      .from('energy_management_systems')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || this.getDefaultEnMS();
  }

  async conductEnergyReview(): Promise<EnergyReview> {
    const energyData = await this.getEnergyData();
    
    return {
      energy_uses: energyData.uses,
      significant_energy_uses: energyData.uses
        .filter(u => u.percentage > 5)
        .map(u => u.use_type),
      energy_performance: energyData.total_consumption,
      opportunities_identified: this.identifyEnergyOpportunities(energyData)
    };
  }

  // SA 8000 Services
  async getSocialAccountabilitySystem(): Promise<SocialAccountabilitySystem> {
    const { data, error } = await supabase
      .from('social_accountability_systems')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || this.getDefaultSA8000();
  }

  async assessSupplier(supplierId: string): Promise<SupplierAssessment> {
    // Implementar avaliação completa do fornecedor conforme SA 8000
    return {
      supplier_id: supplierId,
      assessment_date: new Date().toISOString().split('T')[0],
      sa8000_compliance: false,
      non_conformities: [],
      improvement_plan: '',
      next_assessment_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  // ISO 37001 Services
  async getAntiBriberyManagementSystem(): Promise<AntiBriberyManagementSystem> {
    const { data, error } = await supabase
      .from('anti_bribery_management_systems')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || this.getDefaultABMS();
  }

  async conductDueDiligence(entityId: string, entityType: string): Promise<any> {
    return {
      entity_id: entityId,
      entity_type: entityType,
      risk_assessment: 'medium',
      findings: [],
      recommendations: [],
      approval_status: 'pending'
    };
  }

  // COSO Framework Services
  async getCOSOFramework(): Promise<COSOFramework> {
    const { data, error } = await supabase
      .from('coso_frameworks')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || this.getDefaultCOSO();
  }

  async assessInternalControls(): Promise<any> {
    const framework = await this.getCOSOFramework();
    
    return {
      control_environment_score: this.assessControlEnvironment(framework.control_environment),
      risk_assessment_score: this.assessRiskAssessment(framework.risk_assessment),
      control_activities_score: this.assessControlActivities(framework.control_activities),
      information_communication_score: this.assessInformationCommunication(framework.information_communication),
      monitoring_activities_score: this.assessMonitoringActivities(framework.monitoring_activities),
      overall_score: 0, // Calcular média ponderada
      recommendations: []
    };
  }

  // Management System Status
  async getManagementSystemsStatus(): Promise<ManagementSystem[]> {
    const systems = [
      { standard_code: 'ISO 14001', standard_name: 'Environmental Management', category: 'environmental' as const },
      { standard_code: 'ISO 45001', standard_name: 'Occupational Health & Safety', category: 'social' as const },
      { standard_code: 'ISO 50001', standard_name: 'Energy Management', category: 'environmental' as const },
      { standard_code: 'SA 8000', standard_name: 'Social Accountability', category: 'social' as const },
      { standard_code: 'ISO 31000', standard_name: 'Risk Management', category: 'governance' as const },
      { standard_code: 'ISO 37001', standard_name: 'Anti-Bribery Management', category: 'governance' as const },
      { standard_code: 'ISO 37301', standard_name: 'Compliance Management', category: 'governance' as const }
    ];

    return systems.map(system => ({
      id: system.standard_code,
      standard_code: system.standard_code,
      standard_name: system.standard_name,
      category: system.category,
      implementation_status: 'planning' as const,
      certification_status: 'not_certified' as const,
      compliance_score: Math.floor(Math.random() * 40) + 30, // Placeholder
      non_conformities: Math.floor(Math.random() * 10),
      opportunities_improvement: Math.floor(Math.random() * 15) + 5
    }));
  }

  // Helper methods
  private getDefaultEMS(): EnvironmentalManagementSystem {
    return {
      policy_statement: '',
      environmental_aspects: [],
      legal_requirements: [],
      objectives_targets: [],
      programs: [],
      monitoring_data: [],
      internal_audits: [],
      management_review: []
    };
  }

  private getDefaultOHS(): OHSManagementSystem {
    return {
      policy_statement: '',
      hazard_identification: [],
      risk_assessments: [],
      legal_requirements: [],
      objectives_targets: [],
      incident_investigations: [],
      emergency_procedures: [],
      training_records: []
    };
  }

  private getDefaultEnMS(): EnergyManagementSystem {
    return {
      energy_policy: '',
      energy_review: { energy_uses: [], significant_energy_uses: [], energy_performance: 0, opportunities_identified: [] },
      energy_baseline: { baseline_period: '', energy_consumption: 0, normalization_factors: [] },
      energy_performance_indicators: [],
      energy_objectives_targets: [],
      action_plans: [],
      monitoring_data: []
    };
  }

  private getDefaultSA8000(): SocialAccountabilitySystem {
    return {
      child_labour_policy: '',
      forced_labour_policy: '',
      health_safety_policy: '',
      freedom_association_policy: '',
      discrimination_policy: '',
      disciplinary_practices_policy: '',
      working_hours_policy: '',
      compensation_policy: '',
      management_system_policy: '',
      supplier_assessments: [],
      worker_interviews: [],
      corrective_actions: []
    };
  }

  private getDefaultABMS(): AntiBriberyManagementSystem {
    return {
      anti_bribery_policy: '',
      due_diligence_procedures: [],
      financial_controls: [],
      training_awareness: [],
      reporting_investigation: [],
      monitoring_review: [],
      third_party_assessments: []
    };
  }

  private getDefaultCOSO(): COSOFramework {
    return {
      control_environment: { integrity_ethical_values: '', board_oversight: '', organizational_structure: '', commitment_competence: '', accountability: '' },
      risk_assessment: { objectives_specification: '', risk_identification: '', risk_analysis: '', fraud_assessment: '', change_identification: '' },
      control_activities: [],
      information_communication: { information_quality: '', internal_communication: '', external_communication: '' },
      monitoring_activities: []
    };
  }

  private async getEnvironmentalAspects(): Promise<EnvironmentalAspect[]> {
    const { data, error } = await supabase
      .from('environmental_aspects')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  private async getLegalRequirements(category: string): Promise<LegalRequirement[]> {
    const { data, error } = await supabase
      .from('legal_requirements')
      .select('*')
      .eq('category', category);
    
    if (error) throw error;
    return data || [];
  }

  private async getObjectivesTargets(category: string): Promise<ObjectiveTarget[]> {
    const { data, error } = await supabase
      .from('objectives_targets')
      .select('*')
      .eq('category', category);
    
    if (error) throw error;
    return data || [];
  }

  private assessLegalCompliance(requirements: LegalRequirement[]): any {
    return {
      total: requirements.length,
      compliant: requirements.filter(r => r.compliance_status === 'compliant').length,
      non_compliant: requirements.filter(r => r.compliance_status === 'non_compliant').length
    };
  }

  private assessObjectivePerformance(objectives: ObjectiveTarget[]): any {
    return {
      total: objectives.length,
      on_track: objectives.filter(o => o.status === 'on_track').length,
      completed: objectives.filter(o => o.status === 'completed').length,
      behind: objectives.filter(o => o.status === 'behind').length
    };
  }

  private identifyImprovementOpportunities(aspects: EnvironmentalAspect[]): string[] {
    return aspects
      .filter(a => a.significance === 'high')
      .map(a => `Improve control measures for ${a.aspect}`);
  }

  private async getEnergyData(): Promise<any> {
    return { uses: [], total_consumption: 0 };
  }

  private identifyEnergyOpportunities(energyData: any): string[] {
    return ['Implement energy efficiency measures', 'Install renewable energy systems'];
  }

  private assessControlEnvironment(controlEnv: any): number {
    return 75; // Placeholder
  }

  private assessRiskAssessment(riskAssessment: any): number {
    return 80; // Placeholder
  }

  private assessControlActivities(activities: any[]): number {
    return 70; // Placeholder
  }

  private assessInformationCommunication(infoCom: any): number {
    return 85; // Placeholder
  }

  private assessMonitoringActivities(monitoring: any[]): number {
    return 75; // Placeholder
  }
}

export const managementStandardsService = new ManagementStandardsService();