export type SocialProjectStatus =
  | "Planejado"
  | "Em Andamento"
  | "Concluído"
  | "Cancelado";

export interface SocialProjectContract {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  objective?: string;
  targetAudience?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  investedAmount: number;
  status: SocialProjectStatus;
  impactMetrics: Record<string, number>;
  responsibleUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialFilters {
  location?: string;
  department?: string;
  position?: string;
  minHours?: number;
  maxHours?: number;
}

export interface SocialFilterOptions {
  locations: Array<string>;
  departments: Array<string>;
  positions: Array<string>;
}

export interface EmployeesStats {
  totalEmployees: number;
  activeEmployees: number;
  departments: number;
  genderDistribution: Record<string, number>;
  avgSalary: number;
}

export interface SafetyMetrics {
  totalIncidents: number;
  daysLostTotal: number;
  withMedicalTreatment: number;
  accidentsWithLostTime: number;
  ltifr: number;
  severityRate: number;
  avgResolutionTime: number;
  severityDistribution: Record<string, number>;
  incidentTrend: Array<{ month: number; incidents: number }>;
}

export interface TrainingMetrics {
  totalTrainings: number;
  completedTrainings: number;
  completionRate: number;
  averageScore: number;
  totalHoursTrained: number;
  averageHoursPerEmployee: number;
  categoryDistribution: Record<string, number>;
}

export interface SocialImpactMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalInvestment: number;
  totalBudget: number;
  budgetUtilization: number;
  statusDistribution: Record<string, number>;
  beneficiariesReached: number;
  averageInvestmentPerProject: number;
}

export interface FilteredTrainingMetrics {
  totalEmployees: number;
  totalHours: number;
  avgHours: number;
  hoursByLocation: Array<{
    name: string;
    hours: number;
    avgHours: number;
    employees: number;
  }>;
  hoursByDepartment: Array<{
    name: string;
    hours: number;
    avgHours: number;
    employees: number;
  }>;
  hoursByPosition: Array<{
    name: string;
    hours: number;
    avgHours: number;
    employees: number;
  }>;
  employeeDetails: Array<{
    employee_id: string;
    employee_name: string;
    location?: string;
    department?: string;
    position?: string;
    hours: number;
  }>;
}
