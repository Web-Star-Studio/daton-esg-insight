import { Database } from '@/integrations/supabase/types';

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  defaultValue?: string;
  description?: string;
}

export interface TableRelationship {
  foreignKeyName: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  isOneToOne: boolean;
}

export interface TableSchema {
  name: string;
  displayName: string;
  domain: string;
  description: string;
  columns: TableColumn[];
  relationships: TableRelationship[];
  businessRules: string[];
  hasRLS: boolean;
}

export interface ParsedDatabase {
  tables: TableSchema[];
  totalTables: number;
  totalRelationships: number;
  totalColumns: number;
  domains: string[];
}

const DOMAIN_MAPPING: Record<string, { name: string; color: string; icon: string }> = {
  financial: { name: 'Financeiro', color: 'hsl(var(--success))', icon: '💰' },
  environmental: { name: 'Ambiental', color: 'hsl(142, 76%, 36%)', icon: '🌱' },
  quality: { name: 'Qualidade (SGQ)', color: 'hsl(var(--primary))', icon: '📊' },
  hr: { name: 'Recursos Humanos', color: 'hsl(var(--warning))', icon: '👥' },
  project: { name: 'Projetos', color: 'hsl(221, 83%, 53%)', icon: '📋' },
  esg: { name: 'ESG & Sustentabilidade', color: 'hsl(173, 80%, 40%)', icon: '♻️' },
  strategic: { name: 'Gestão Estratégica', color: 'hsl(263, 70%, 50%)', icon: '🎯' },
  core: { name: 'Sistema Core', color: 'hsl(var(--muted-foreground))', icon: '⚙️' },
};

const TABLE_DOMAIN_MAP: Record<string, string> = {
  // Financial
  accounts_payable: 'financial',
  accounts_receivable: 'financial',
  accounting_entries: 'financial',
  accounting_entry_lines: 'financial',
  bank_accounts: 'financial',
  chart_of_accounts: 'financial',
  cost_centers: 'financial',
  budgets: 'financial',
  
  // Environmental
  assets: 'environmental',
  emission_sources: 'environmental',
  activity_data: 'environmental',
  calculated_emissions: 'environmental',
  emission_factors: 'environmental',
  waste_logs: 'environmental',
  waste_types: 'environmental',
  licenses: 'environmental',
  license_conditions: 'environmental',
  license_documents: 'environmental',
  pgrs_plans: 'environmental',
  waste_sources: 'environmental',
  pgrs_procedures: 'environmental',
  pgrs_goals: 'environmental',
  conservation_activities: 'environmental',
  activity_monitoring: 'environmental',
  water_consumption: 'environmental',
  energy_consumption: 'environmental',
  monitoring_alerts: 'environmental',
  
  // Quality
  non_conformities: 'quality',
  quality_indicators: 'quality',
  audits: 'quality',
  audit_findings: 'quality',
  corrective_actions: 'quality',
  indicator_records: 'quality',
  non_conformity_timeline: 'quality',
  
  // HR
  employees: 'hr',
  training_programs: 'hr',
  training_courses: 'hr',
  course_modules: 'hr',
  course_enrollments: 'hr',
  training_enrollments: 'hr',
  performance_evaluations: 'hr',
  career_development_plans: 'hr',
  leave_requests: 'hr',
  recruitment_processes: 'hr',
  mentoring_relationships: 'hr',
  attendance_records: 'hr',
  employee_benefits: 'hr',
  benefit_enrollments: 'hr',
  
  // Project
  projects: 'project',
  project_tasks: 'project',
  project_milestones: 'project',
  project_resources: 'project',
  burndown_data: 'project',
  scope_changes: 'project',
  
  // ESG
  esg_targets: 'esg',
  target_progress: 'esg',
  carbon_projects: 'esg',
  gri_reports: 'esg',
  gri_indicators: 'esg',
  stakeholders: 'esg',
  stakeholder_interactions: 'esg',
  materiality_assessments: 'esg',
  materiality_topics: 'esg',
  circular_economy_assessments: 'esg',
  supplier_assessments: 'esg',
  board_members: 'esg',
  
  // Strategic
  strategic_maps: 'strategic',
  bsc_perspectives: 'strategic',
  bsc_objectives: 'strategic',
  bsc_indicators: 'strategic',
  okrs: 'strategic',
  okr_key_results: 'strategic',
  strategic_initiatives: 'strategic',
  strategic_associations: 'strategic',
  
  // Core
  companies: 'core',
  profiles: 'core',
  user_roles: 'core',
  permissions: 'core',
  role_permissions: 'core',
  documents: 'core',
  activity_logs: 'core',
  notifications: 'core',
  notification_logs: 'core',
  custom_forms: 'core',
  form_submissions: 'core',
  action_plans: 'core',
  action_plan_items: 'core',
};

const TABLE_DESCRIPTIONS: Record<string, string> = {
  accounts_payable: 'Gestão de contas a pagar, fornecedores e pagamentos',
  accounts_receivable: 'Gestão de contas a receber e faturamento',
  accounting_entries: 'Lançamentos contábeis do sistema',
  accounting_entry_lines: 'Linhas individuais dos lançamentos contábeis',
  non_conformities: 'Não conformidades do sistema de gestão da qualidade',
  quality_indicators: 'Indicadores de qualidade e performance',
  emission_sources: 'Fontes de emissões de GEE das empresas',
  activity_data: 'Dados de atividade para cálculo de emissões',
  calculated_emissions: 'Emissões calculadas a partir dos dados de atividade',
  employees: 'Cadastro de colaboradores das empresas',
  projects: 'Projetos gerenciados no sistema',
  assets: 'Ativos ambientais e equipamentos',
  licenses: 'Licenças ambientais e documentos regulatórios',
  waste_logs: 'Registro de geração e destinação de resíduos',
  companies: 'Empresas cadastradas no sistema',
  profiles: 'Perfis de usuários do sistema',
};

const BUSINESS_RULES: Record<string, string[]> = {
  accounts_payable: [
    'Cálculo automático de valor final com descontos, juros e multas',
    'Status: Pendente → Aprovado → Pago ou Cancelado',
    'Trigger: set_accounts_payable_company_id (auto-assign company)',
    'Trigger: update_accounts_payable_updated_at (timestamp)',
    'RLS habilitado para multi-tenancy',
  ],
  non_conformities: [
    'Auto-criação de entrada na timeline ao inserir NC',
    'Workflow de status: Aberta → Em Análise → Em Tratamento → Fechada',
    'Trigger: create_nc_timeline_entry()',
    'RLS habilitado para multi-tenancy',
  ],
  calculated_emissions: [
    'Cálculo automático de CO2e a partir de dados de atividade',
    'Separação de emissões biogênicas e fósseis',
    'Relacionamento 1:1 com activity_data',
  ],
  activity_data: [
    'Validação de período (data fim >= data início)',
    'Quantidade deve ser positiva',
    'Trigger para cálculo automático de emissões',
  ],
};

function getColumnType(type: string): string {
  if (type.includes('uuid')) return 'UUID';
  if (type.includes('string') || type.includes('text')) return 'TEXT';
  if (type.includes('number')) return 'NUMBER';
  if (type.includes('boolean')) return 'BOOLEAN';
  if (type.includes('Json')) return 'JSON';
  return type.toUpperCase();
}

export function parseSupabaseDatabase(): ParsedDatabase {
  type Tables = Database['public']['Tables'];
  const tableNames = Object.keys({} as Tables) as (keyof Tables)[];
  
  const tables: TableSchema[] = tableNames.map(tableName => {
    const table = {} as Tables[typeof tableName];
    const rowType = table['Row'];
    const relationships = (table['Relationships'] || []) as any[];
    
    // Parse columns from Row type
    const columns: TableColumn[] = Object.keys(rowType || {}).map(colName => {
      const isPK = colName === 'id';
      const isFKCol = relationships.some((rel: any) => 
        Array.isArray(rel.columns) && rel.columns.includes(colName)
      );
      
      return {
        name: colName,
        type: getColumnType(typeof (rowType as any)?.[colName]),
        nullable: colName.includes('_at') || colName.includes('notes') || colName.includes('description'),
        isPrimaryKey: isPK,
        isForeignKey: isFKCol,
      };
    });
    
    // Parse relationships
    const parsedRelationships: TableRelationship[] = relationships.map((rel: any) => ({
      foreignKeyName: rel.foreignKeyName || '',
      columns: Array.isArray(rel.columns) ? rel.columns : [rel.columns],
      referencedTable: rel.referencedRelation || '',
      referencedColumns: Array.isArray(rel.referencedColumns) ? rel.referencedColumns : [rel.referencedColumns],
      isOneToOne: rel.isOneToOne || false,
    }));
    
    const domain = TABLE_DOMAIN_MAP[tableName as string] || 'core';
    const displayName = (tableName as string).split('_').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
    
    return {
      name: tableName as string,
      displayName,
      domain,
      description: TABLE_DESCRIPTIONS[tableName as string] || `Tabela ${displayName}`,
      columns,
      relationships: parsedRelationships,
      businessRules: BUSINESS_RULES[tableName as string] || [],
      hasRLS: true, // Most tables have RLS enabled
    };
  });
  
  const totalRelationships = tables.reduce((sum, t) => sum + t.relationships.length, 0);
  const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);
  const domains = Array.from(new Set(tables.map(t => t.domain)));
  
  return {
    tables,
    totalTables: tables.length,
    totalRelationships,
    totalColumns,
    domains,
  };
}

export function getDomainInfo(domain: string) {
  return DOMAIN_MAPPING[domain] || DOMAIN_MAPPING.core;
}

export function searchTables(tables: TableSchema[], query: string): TableSchema[] {
  if (!query.trim()) return tables;
  
  const lowerQuery = query.toLowerCase();
  
  return tables.filter(table => {
    // Search in table name
    if (table.name.toLowerCase().includes(lowerQuery)) return true;
    if (table.displayName.toLowerCase().includes(lowerQuery)) return true;
    if (table.description.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in column names
    if (table.columns.some(col => col.name.toLowerCase().includes(lowerQuery))) return true;
    
    // Search in relationships
    if (table.relationships.some(rel => 
      rel.referencedTable.toLowerCase().includes(lowerQuery)
    )) return true;
    
    // Search in business rules
    if (table.businessRules.some(rule => rule.toLowerCase().includes(lowerQuery))) return true;
    
    return false;
  });
}

export function filterTablesByDomain(tables: TableSchema[], domains: string[]): TableSchema[] {
  if (domains.length === 0) return tables;
  return tables.filter(t => domains.includes(t.domain));
}
