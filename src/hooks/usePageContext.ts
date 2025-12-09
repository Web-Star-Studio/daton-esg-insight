import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

export interface PageContext {
  tables: string[];
  relevantColumns: string[];
  currentData?: any;
  pageTitle: string;
  dataType: string;
}

export function usePageContext(): PageContext {
  const location = useLocation();
  
  return useMemo(() => {
    const path = location.pathname;
    
    const contexts: Record<string, PageContext> = {
      '/gestao-stakeholders': {
        tables: ['stakeholders', 'stakeholder_surveys', 'stakeholder_assessments'],
        relevantColumns: ['name', 'category', 'email', 'phone', 'influence_level', 'interest_level'],
        pageTitle: 'Gestão de Stakeholders',
        dataType: 'stakeholders'
      },
      '/inventario-gee': {
        tables: ['emission_sources', 'activity_data', 'calculated_emissions'],
        relevantColumns: ['source_name', 'scope', 'co2e', 'quantity', 'period_start_date'],
        pageTitle: 'Inventário de GEE',
        dataType: 'emissions'
      },
      '/metas': {
        tables: ['goals', 'goal_progress_updates'],
        relevantColumns: ['goal_name', 'target_value', 'current_value', 'progress_percentage', 'due_date'],
        pageTitle: 'Gestão de Metas',
        dataType: 'goals'
      },
      '/gestao-tarefas': {
        tables: ['data_collection_tasks'],
        relevantColumns: ['name', 'status', 'due_date', 'task_type', 'frequency'],
        pageTitle: 'Gestão de Tarefas',
        dataType: 'tasks'
      },
      '/licenciamento': {
        tables: ['licenses', 'license_conditions', 'license_observations'],
        relevantColumns: ['license_name', 'license_number', 'expiry_date', 'status', 'license_type'],
        pageTitle: 'Licenciamento',
        dataType: 'licenses'
      },
      '/gestao-residuos': {
        tables: ['waste_logs', 'waste_suppliers', 'pgrs_plans'],
        relevantColumns: ['waste_type', 'quantity', 'disposal_method', 'destination', 'log_date'],
        pageTitle: 'Gestão de Resíduos',
        dataType: 'waste'
      },
      '/funcionarios': {
        tables: ['employees', 'employee_training', 'attendance_records'],
        relevantColumns: ['name', 'cpf', 'department', 'position', 'hire_date', 'status'],
        pageTitle: 'Gestão de Funcionários',
        dataType: 'employees'
      },
      '/fornecedores': {
        tables: ['suppliers', 'supplier_assessments'],
        relevantColumns: ['name', 'cnpj', 'category', 'rating', 'qualification_status'],
        pageTitle: 'Gestão de Fornecedores',
        dataType: 'suppliers'
      },
      '/riscos-oportunidades': {
        tables: ['esg_risks', 'opportunities', 'risk_occurrences'],
        relevantColumns: ['title', 'category', 'probability', 'impact', 'status'],
        pageTitle: 'Riscos e Oportunidades',
        dataType: 'risks_opportunities'
      },
      '/indicadores': {
        tables: ['indicator_measurements', 'process_indicators'],
        relevantColumns: ['indicator_name', 'measured_value', 'target_value', 'measurement_date'],
        pageTitle: 'Gestão de Indicadores',
        dataType: 'indicators'
      },
      '/gri-reporting': {
        tables: ['gri_reports', 'gri_indicator_data', 'materiality_topics'],
        relevantColumns: ['indicator_code', 'value', 'unit', 'reporting_period'],
        pageTitle: 'Relatórios GRI',
        dataType: 'gri_reports'
      }
    };
    
    return contexts[path] || {
      tables: [],
      relevantColumns: [],
      pageTitle: 'Página Desconhecida',
      dataType: 'general'
    };
  }, [location.pathname]);
}
