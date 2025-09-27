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

// Complete interface definitions
export interface EnergyBaseline {
  baseline_period: string;
  energy_consumption: number;
  normalization_factors: string[];
}

export interface EnergyPerformanceIndicator {
  indicator_name: string;
  current_value: number;
  target_value: number;
  unit: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ActionPlan {
  id: string;
  action: string;
  responsible: string;
  deadline: string;
  status: string;
}

export interface EnergyMonitoringData {
  id: string;
  parameter: string;
  value: number;
  unit: string;
  measurement_date: string;
}

export interface EnergyUse {
  use_type: string;
  consumption: number;
  percentage: number;
}

export interface WorkerInterview {
  id: string;
  worker_id: string;
  interview_date: string;
  findings: string[];
  concerns_raised: string[];
}

export interface CorrectiveAction {
  id: string;
  description: string;
  responsible: string;
  deadline: string;
  status: string;
}

export interface RiskCriteria {
  likelihood_scale: string[];
  impact_scale: string[];
  risk_matrix: string[][];
}

export interface RiskRegister {
  id: string;
  risk_description: string;
  likelihood: string;
  impact: string;
  risk_level: string;
  treatment: string;
}

export interface RiskTreatment {
  id: string;
  risk_id: string;
  treatment_type: string;
  description: string;
  responsible: string;
  deadline: string;
}

export interface MonitoringReview {
  id: string;
  review_date: string;
  findings: string[];
  recommendations: string[];
}

export interface CommunicationConsultation {
  id: string;
  stakeholder: string;
  communication_method: string;
  frequency: string;
  topics: string[];
}

export interface DueDiligenceProcedure {
  id: string;
  procedure_name: string;
  scope: string;
  frequency: string;
  responsible: string;
}

export interface FinancialControl {
  id: string;
  control_name: string;
  description: string;
  frequency: string;
  responsible: string;
}

export interface TrainingAwareness {
  id: string;
  training_topic: string;
  target_audience: string;
  frequency: string;
  completion_rate: number;
}

export interface ReportingInvestigation {
  id: string;
  case_id: string;
  report_date: string;
  allegation: string;
  investigation_status: string;
  outcome: string;
}

export interface ThirdPartyAssessment {
  id: string;
  third_party: string;
  assessment_date: string;
  risk_level: string;
  recommendations: string[];
}

export interface ControlEnvironment {
  integrity_ethical_values: string;
  board_oversight: string;
  organizational_structure: string;
  commitment_competence: string;
  accountability: string;
}

export interface COSORiskAssessment {
  objectives_specification: string;
  risk_identification: string;
  risk_analysis: string;
  fraud_assessment: string;
  change_identification: string;
}

export interface ControlActivity {
  id: string;
  control_type: string;
  description: string;
  frequency: string;
  responsible: string;
  effectiveness: string;
}

export interface InformationCommunication {
  information_quality: string;
  internal_communication: string;
  external_communication: string;
}

export interface MonitoringActivity {
  id: string;
  activity_name: string;
  frequency: string;
  responsible: string;
  last_performed: string;
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

// ISO 31000 - Gestão de Riscos
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

// Shared interfaces
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

  // ISO 14001 Services
  async getEnvironmentalManagementSystem(): Promise<EnvironmentalManagementSystem> {
    return this.getDefaultEMS();
  }

  async conductEnvironmentalReview(): Promise<any> {
    return {
      significant_aspects: ['Energy consumption', 'Waste generation'],
      compliance_status: { total: 10, compliant: 8, non_compliant: 2 },
      objective_performance: { total: 5, on_track: 3, completed: 1, behind: 1 },
      improvement_opportunities: ['Implement energy efficiency measures']
    };
  }

  // ISO 45001 Services
  async getOHSManagementSystem(): Promise<OHSManagementSystem> {
    return this.getDefaultOHS();
  }

  async conductHazardIdentification(): Promise<HazardIdentification[]> {
    return [
      {
        id: '1',
        hazard_type: 'Physical',
        location: 'Office',
        potential_consequences: 'Minor injury',
        current_controls: ['Safety training'],
        risk_level: 'low'
      }
    ];
  }

  // ISO 50001 Services
  async getEnergyManagementSystem(): Promise<EnergyManagementSystem> {
    return this.getDefaultEnMS();
  }

  async conductEnergyReview(): Promise<EnergyReview> {
    return {
      energy_uses: [{ use_type: 'Electricity', consumption: 1000, percentage: 80 }],
      significant_energy_uses: ['Electricity'],
      energy_performance: 1000,
      opportunities_identified: ['LED lighting upgrade']
    };
  }

  // SA 8000 Services
  async getSocialAccountabilitySystem(): Promise<SocialAccountabilitySystem> {
    return this.getDefaultSA8000();
  }

  async assessSupplier(supplierId: string): Promise<SupplierAssessment> {
    return {
      supplier_id: supplierId,
      assessment_date: new Date().toISOString().split('T')[0],
      sa8000_compliance: true,
      non_conformities: [],
      improvement_plan: 'No improvements needed',
      next_assessment_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  // ISO 31000 Services
  async getRiskManagementFramework(): Promise<RiskManagementFramework> {
    return {
      risk_management_policy: 'Risk management policy statement',
      risk_criteria: {
        likelihood_scale: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
        impact_scale: ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'],
        risk_matrix: [['Low', 'Low', 'Medium', 'High', 'High']]
      },
      risk_register: [],
      risk_treatments: [],
      monitoring_review: [],
      communication_consultation: []
    };
  }

  // ISO 37001 Services
  async getAntiBriberyManagementSystem(): Promise<AntiBriberyManagementSystem> {
    return this.getDefaultABMS();
  }

  async conductDueDiligence(entityId: string, entityType: string): Promise<any> {
    return {
      entity_id: entityId,
      entity_type: entityType,
      risk_assessment: 'low',
      findings: [],
      recommendations: [],
      approval_status: 'approved'
    };
  }

  // COSO Framework Services
  async getCOSOFramework(): Promise<COSOFramework> {
    return this.getDefaultCOSO();
  }

  async assessInternalControls(): Promise<any> {
    return {
      control_environment_score: 75,
      risk_assessment_score: 80,
      control_activities_score: 70,
      information_communication_score: 85,
      monitoring_activities_score: 75,
      overall_score: 77,
      recommendations: ['Enhance control documentation', 'Improve monitoring frequency']
    };
  }

  // Helper methods - Default implementations
  private getDefaultEMS(): EnvironmentalManagementSystem {
    return {
      policy_statement: 'Environmental policy statement',
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
      policy_statement: 'Health and safety policy statement',
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
      energy_policy: 'Energy management policy',
      energy_review: { 
        energy_uses: [], 
        significant_energy_uses: [], 
        energy_performance: 0, 
        opportunities_identified: [] 
      },
      energy_baseline: { 
        baseline_period: '2024', 
        energy_consumption: 0, 
        normalization_factors: [] 
      },
      energy_performance_indicators: [],
      energy_objectives_targets: [],
      action_plans: [],
      monitoring_data: []
    };
  }

  private getDefaultSA8000(): SocialAccountabilitySystem {
    return {
      child_labour_policy: 'Child labor policy',
      forced_labour_policy: 'Forced labor policy',
      health_safety_policy: 'Health and safety policy',
      freedom_association_policy: 'Freedom of association policy',
      discrimination_policy: 'Anti-discrimination policy',
      disciplinary_practices_policy: 'Disciplinary practices policy',
      working_hours_policy: 'Working hours policy',
      compensation_policy: 'Compensation policy',
      management_system_policy: 'Management system policy',
      supplier_assessments: [],
      worker_interviews: [],
      corrective_actions: []
    };
  }

  private getDefaultABMS(): AntiBriberyManagementSystem {
    return {
      anti_bribery_policy: 'Anti-bribery policy statement',
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
      control_environment: { 
        integrity_ethical_values: 'Integrity and ethical values', 
        board_oversight: 'Board oversight', 
        organizational_structure: 'Organizational structure', 
        commitment_competence: 'Commitment to competence', 
        accountability: 'Accountability' 
      },
      risk_assessment: { 
        objectives_specification: 'Objectives specification', 
        risk_identification: 'Risk identification', 
        risk_analysis: 'Risk analysis', 
        fraud_assessment: 'Fraud assessment', 
        change_identification: 'Change identification' 
      },
      control_activities: [],
      information_communication: { 
        information_quality: 'Information quality', 
        internal_communication: 'Internal communication', 
        external_communication: 'External communication' 
      },
      monitoring_activities: []
    };
  }
}

export const managementStandardsService = new ManagementStandardsService();