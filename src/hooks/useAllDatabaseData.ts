import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAssetsHierarchy } from "@/services/assets";
import { 
  Building2, 
  Users, 
  Activity, 
  Package, 
  BarChart3, 
  Zap,
  Calculator,
  Gavel,
  AlertTriangle,
  Brain,
  Trash2,
  Flag,
  TrendingUp,
  BarChart,
  Leaf,
  TreePine,
  ShoppingCart,
  RotateCcw,
  FileText,
  Folder,
  Database,
  ClipboardList,
  Inbox,
  CheckSquare,
  Import,
  ShieldCheck,
  FileSearch,
  AlertCircle
} from "lucide-react";

export interface DatabaseSection {
  id: string;
  title: string;
  icon: any;
  count: number;
  data: any[];
  category: string;
  description: string;
  lastUpdated?: string;
  status: 'active' | 'empty' | 'error';
}

export const useAllDatabaseData = () => {
  // Core Business Data
  const { data: companyData, isLoading: companyLoading, error: companyError } = useQuery({
    queryKey: ['company-data'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('*').maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: profiles, isLoading: profilesLoading, error: profilesError } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  // Assets & Infrastructure
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: emissionSources, isLoading: emissionSourcesLoading, error: emissionSourcesError } = useQuery({
    queryKey: ['emission-sources'],
    queryFn: async () => {
      const { data, error } = await supabase.from('emission_sources').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: activityData, isLoading: activityDataLoading, error: activityDataError } = useQuery({
    queryKey: ['activity-data'],
    queryFn: async () => {
      const { data, error } = await supabase.from('activity_data').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: calculatedEmissions, isLoading: calculatedEmissionsLoading } = useQuery({
    queryKey: ['calculated-emissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('calculated_emissions').select('*').order('calculation_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: emissionFactors, isLoading: emissionFactorsLoading } = useQuery({
    queryKey: ['emission-factors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('emission_factors').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Environmental Licensing - Note: licenses table doesn't exist, using placeholder
  const { data: licenses, isLoading: licensesLoading, error: licensesError } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => {
      // Table doesn't exist in schema, returning empty array
      return [];
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: licenseAlerts, isLoading: licenseAlertsLoading } = useQuery({
    queryKey: ['license-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('license_alerts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: licenseAiAnalysis, isLoading: licenseAiAnalysisLoading } = useQuery({
    queryKey: ['license-ai-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase.from('license_ai_analysis').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Waste Management - Note: waste_logs table doesn't exist, using placeholder
  const { data: wasteLogs, isLoading: wasteLogsLoading, error: wasteLogsError } = useQuery({
    queryKey: ['waste-logs'],
    queryFn: async () => {
      // Table doesn't exist in schema, returning empty array
      return [];
    },
    retry: 1,
    retryDelay: 1000
  });

  // Goals & ESG
  const { data: goals, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: goalProgressUpdates, isLoading: goalProgressLoading } = useQuery({
    queryKey: ['goal-progress-updates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('goal_progress_updates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: esgMetrics, isLoading: esgMetricsLoading } = useQuery({
    queryKey: ['esg-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.from('esg_metrics').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Carbon Projects
  const { data: carbonProjects, isLoading: carbonProjectsLoading } = useQuery({
    queryKey: ['carbon-projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('carbon_projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: conservationActivities, isLoading: conservationActivitiesLoading } = useQuery({
    queryKey: ['conservation-activities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('conservation_activities').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: creditPurchases, isLoading: creditPurchasesLoading } = useQuery({
    queryKey: ['credit-purchases'],
    queryFn: async () => {
      const { data, error } = await supabase.from('credit_purchases').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: creditRetirements, isLoading: creditRetirementsLoading } = useQuery({
    queryKey: ['credit-retirements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('credit_retirements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Documents & Data
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('documents').select('*').order('upload_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: documentFolders, isLoading: documentFoldersLoading } = useQuery({
    queryKey: ['document-folders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_folders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: extractedDataPreview, isLoading: extractedDataLoading } = useQuery({
    queryKey: ['extracted-data-preview'],
    queryFn: async () => {
      const { data, error } = await supabase.from('extracted_data_preview').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Forms & Collection
  const { data: customForms, isLoading: customFormsLoading } = useQuery({
    queryKey: ['custom-forms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_forms').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: formSubmissions, isLoading: formSubmissionsLoading } = useQuery({
    queryKey: ['form-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('form_submissions').select('*').order('submitted_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: dataCollectionTasks, isLoading: dataCollectionLoading } = useQuery({
    queryKey: ['data-collection-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('data_collection_tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: dataImportJobs, isLoading: dataImportLoading } = useQuery({
    queryKey: ['data-import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('data_import_jobs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Compliance & Audits
  const { data: complianceTasks, isLoading: complianceTasksLoading } = useQuery({
    queryKey: ['compliance-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('compliance_tasks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: audits, isLoading: auditsLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('audits').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: auditFindings, isLoading: auditFindingsLoading } = useQuery({
    queryKey: ['audit-findings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('audit_findings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Reports
  const { data: generatedReports, isLoading: reportsLoading, error: reportsError } = useQuery({
    queryKey: ['generated-reports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('generated_reports').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: activityLogs, isLoading: activityLogsLoading, error: activityLogsError } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  // Additional missing tables
  const { data: files, isLoading: filesLoading, error: filesError } = useQuery({
    queryKey: ['files'],
    queryFn: async () => {
      const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: extractions, isLoading: extractionsLoading, error: extractionsError } = useQuery({
    queryKey: ['extractions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('extractions').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: extractionItemsStaging, isLoading: extractionStagingLoading, error: extractionStagingError } = useQuery({
    queryKey: ['extraction-items-staging'],
    queryFn: async () => {
      const { data, error } = await supabase.from('extraction_items_staging').select('*').limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: extractionItemsCurated, isLoading: extractionCuratedLoading, error: extractionCuratedError } = useQuery({
    queryKey: ['extraction-items-curated'],
    queryFn: async () => {
      const { data, error } = await supabase.from('extraction_items_curated').select('*').order('approved_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: documentExtractionJobs, isLoading: docExtractionLoading, error: docExtractionError } = useQuery({
    queryKey: ['document-extraction-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_extraction_jobs').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: esgSolutions, isLoading: esgSolutionsLoading, error: esgSolutionsError } = useQuery({
    queryKey: ['esg-solutions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('esg_solutions').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const { data: esgSolutionProviders, isLoading: esgProvidersLoading, error: esgProvidersError } = useQuery({
    queryKey: ['esg-solution-providers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('esg_solution_providers').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
    retry: 1,
    retryDelay: 1000
  });

  const isLoading = companyLoading || profilesLoading || assetsLoading || emissionSourcesLoading || 
                   activityDataLoading || calculatedEmissionsLoading || emissionFactorsLoading ||
                   licensesLoading || licenseAlertsLoading || licenseAiAnalysisLoading ||
                   wasteLogsLoading || goalsLoading || goalProgressLoading || esgMetricsLoading ||
                   carbonProjectsLoading || conservationActivitiesLoading || creditPurchasesLoading ||
                   creditRetirementsLoading || documentsLoading || documentFoldersLoading ||
                   extractedDataLoading || customFormsLoading || formSubmissionsLoading ||
                   dataCollectionLoading || dataImportLoading || complianceTasksLoading ||
                   auditsLoading || auditFindingsLoading || reportsLoading || activityLogsLoading ||
                   filesLoading || extractionsLoading || extractionStagingLoading || 
                   extractionCuratedLoading || docExtractionLoading || esgSolutionsLoading || esgProvidersLoading;

  const sectionIcons = {
    "company": Building2,
    "profiles": Users,
    "activity-logs": Activity,
    "assets": Package,
    "emission-sources": BarChart3,
    "activity-data": Zap,
    "calculated-emissions": Calculator,
    "emission-factors": BarChart3,
    "licenses": Gavel,
    "license-alerts": AlertTriangle,
    "license-ai-analysis": Brain,
    "waste-logs": Trash2,
    "goals": Flag,
    "goal-progress": TrendingUp,
    "esg-metrics": BarChart,
    "carbon-projects": Leaf,
    "conservation-activities": TreePine,
    "credit-purchases": ShoppingCart,
    "credit-retirements": RotateCcw,
    "documents": FileText,
    "document-folders": Folder,
    "extracted-data": Database,
    "custom-forms": ClipboardList,
    "form-submissions": Inbox,
    "data-collection-tasks": CheckSquare,
    "data-import-jobs": Import,
    "compliance-tasks": ShieldCheck,
    "audits": FileSearch,
    "audit-findings": AlertCircle,
    "generated-reports": BarChart,
    "files": FileText,
    "extractions": Database,
    "extraction-items-staging": Import,
    "extraction-items-curated": CheckSquare,
    "document-extraction-jobs": Brain,
    "esg-solutions": Leaf,
    "esg-solution-providers": Building2
  };

  return {
    sections: [
      // Core Business
      { id: "company", title: "Dados da Empresa", data: companyData ? [companyData] : [], category: "core", description: "Informações básicas da empresa" },
      { id: "profiles", title: "Usuários", data: profiles || [], category: "core", description: "Perfis de usuários do sistema" },
      { id: "activity-logs", title: "Logs de Atividade", data: activityLogs || [], category: "core", description: "Registro de ações no sistema" },
      
      // Assets & Infrastructure
      { id: "assets", title: "Ativos", data: assets || [], category: "assets", description: "Ativos da empresa" },
      { id: "emission-sources", title: "Fontes de Emissão", data: emissionSources || [], category: "assets", description: "Fontes de emissões GEE" },
      { id: "activity-data", title: "Dados de Atividade", data: activityData || [], category: "assets", description: "Dados coletados das atividades" },
      { id: "calculated-emissions", title: "Emissões Calculadas", data: calculatedEmissions || [], category: "assets", description: "Resultado dos cálculos de emissão" },
      { id: "emission-factors", title: "Fatores de Emissão", data: emissionFactors || [], category: "assets", description: "Fatores para cálculo de emissões" },
      
      // Environmental Licensing
      { id: "licenses", title: "Licenças Ambientais", data: licenses || [], category: "licensing", description: "Licenciamento ambiental" },
      { id: "license-alerts", title: "Alertas de Licenças", data: licenseAlerts || [], category: "licensing", description: "Alertas relacionados a licenças" },
      { id: "license-ai-analysis", title: "Análise IA de Licenças", data: licenseAiAnalysis || [], category: "licensing", description: "Análises automatizadas" },
      
      // Waste Management
      { id: "waste-logs", title: "Gestão de Resíduos", data: wasteLogs || [], category: "waste", description: "Registros de resíduos" },
      
      // Goals & ESG
      { id: "goals", title: "Metas ESG", data: goals || [], category: "esg", description: "Metas de sustentabilidade" },
      { id: "goal-progress", title: "Progresso de Metas", data: goalProgressUpdates || [], category: "esg", description: "Atualizações de progresso" },
      { id: "esg-metrics", title: "Métricas ESG", data: esgMetrics || [], category: "esg", description: "Indicadores de performance" },
      
      // Carbon Projects
      { id: "carbon-projects", title: "Projetos de Carbono", data: carbonProjects || [], category: "carbon", description: "Projetos de compensação" },
      { id: "conservation-activities", title: "Atividades de Conservação", data: conservationActivities || [], category: "carbon", description: "Atividades ambientais" },
      { id: "credit-purchases", title: "Compras de Créditos", data: creditPurchases || [], category: "carbon", description: "Créditos de carbono adquiridos" },
      { id: "credit-retirements", title: "Aposentadorias de Créditos", data: creditRetirements || [], category: "carbon", description: "Créditos aposentados" },
      
      // Documents & Data
      { id: "documents", title: "Documentos", data: documents || [], category: "documents", description: "Documentos do sistema" },
      { id: "document-folders", title: "Pastas", data: documentFolders || [], category: "documents", description: "Estrutura de pastas" },
      { id: "extracted-data", title: "Dados Extraídos", data: extractedDataPreview || [], category: "documents", description: "Dados extraídos por IA" },
      
      // Forms & Collection
      { id: "custom-forms", title: "Formulários", data: customForms || [], category: "forms", description: "Formulários customizados" },
      { id: "form-submissions", title: "Submissões", data: formSubmissions || [], category: "forms", description: "Respostas de formulários" },
      { id: "data-collection-tasks", title: "Tarefas de Coleta", data: dataCollectionTasks || [], category: "forms", description: "Tarefas de coleta de dados" },
      { id: "data-import-jobs", title: "Jobs de Importação", data: dataImportJobs || [], category: "forms", description: "Importações de dados" },
      
      // Compliance & Audits
      { id: "compliance-tasks", title: "Tarefas de Compliance", data: complianceTasks || [], category: "compliance", description: "Conformidade regulatória" },
      { id: "audits", title: "Auditorias", data: audits || [], category: "compliance", description: "Auditorias realizadas" },
      { id: "audit-findings", title: "Achados de Auditoria", data: auditFindings || [], category: "compliance", description: "Resultados das auditorias" },
      
      // Reports
      { id: "generated-reports", title: "Relatórios", data: generatedReports || [], category: "reports", description: "Relatórios gerados" },
      
      // Additional AI & Extraction Data
      { id: "files", title: "Arquivos", data: files || [], category: "documents", description: "Arquivos do sistema" },
      { id: "extractions", title: "Extrações", data: extractions || [], category: "documents", description: "Extrações de dados" },
      { id: "extraction-items-staging", title: "Itens em Processamento", data: extractionItemsStaging || [], category: "documents", description: "Dados sendo processados" },
      { id: "extraction-items-curated", title: "Itens Curados", data: extractionItemsCurated || [], category: "documents", description: "Dados validados" },
      { id: "document-extraction-jobs", title: "Jobs de Extração", data: documentExtractionJobs || [], category: "documents", description: "Processamentos de documentos" },
      
      // ESG Marketplace
      { id: "esg-solutions", title: "Soluções ESG", data: esgSolutions || [], category: "esg", description: "Soluções do marketplace" },
      { id: "esg-solution-providers", title: "Provedores ESG", data: esgSolutionProviders || [], category: "esg", description: "Empresas parceiras" },
    ].map(section => {
      const hasError = (section.id === 'assets' && assetsError) || 
                      (section.id === 'emission-sources' && emissionSourcesError) ||
                      (section.id === 'licenses' && licensesError) ||
                      (section.id === 'waste-logs' && wasteLogsError) ||
                      (section.id === 'company' && companyError) ||
                      (section.id === 'profiles' && profilesError) ||
                      (section.id === 'activity-data' && activityDataError) ||
                      (section.id === 'generated-reports' && reportsError) ||
                      (section.id === 'activity-logs' && activityLogsError) ||
                      (section.id === 'files' && filesError) ||
                      (section.id === 'extractions' && extractionsError) ||
                      (section.id === 'extraction-items-staging' && extractionStagingError) ||
                      (section.id === 'extraction-items-curated' && extractionCuratedError) ||
                      (section.id === 'document-extraction-jobs' && docExtractionError) ||
                      (section.id === 'esg-solutions' && esgSolutionsError) ||
                      (section.id === 'esg-solution-providers' && esgProvidersError) ||
                      (section.id === 'waste-logs' && wasteLogsError);
      
      return {
        ...section,
        icon: sectionIcons[section.id as keyof typeof sectionIcons] || Package,
        count: section.data?.length || 0,
        status: hasError ? 'error' : (section.data?.length > 0 ? 'active' : 'empty') as 'active' | 'empty' | 'error',
        lastUpdated: section.data?.length > 0 ? 'Hoje' : 'Nunca'
      };
    }),
    isLoading,
    totalRecords: [
      companyData ? 1 : 0,
      ...[profiles, assets, emissionSources, activityData, calculatedEmissions, emissionFactors,
          licenses, licenseAlerts, licenseAiAnalysis, wasteLogs, goals, goalProgressUpdates, esgMetrics,
          carbonProjects, conservationActivities, creditPurchases, creditRetirements, documents,
          documentFolders, extractedDataPreview, customForms, formSubmissions, dataCollectionTasks,
          dataImportJobs, complianceTasks, audits, auditFindings, generatedReports, activityLogs
      ].map(data => data?.length || 0)
    ].reduce((acc, curr) => acc + curr, 0)
  };
};