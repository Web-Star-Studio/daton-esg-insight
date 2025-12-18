import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  CheckCircle, 
  ListTodo, 
  Home,
  BarChart3,
  Leaf,
  FileCheck,
  Droplets,
  Zap,
  Trash2,
  Target,
  Users,
  Settings,
  Brain,
  Folder,
  DollarSign,
  CreditCard,
  Wallet,
  TrendingUp,
  Building,
  FileSpreadsheet,
  Award,
  AlertTriangle,
  Shield,
  ClipboardCheck,
  GraduationCap,
  UserPlus,
  HardHat,
  Clock,
  UsersRound,
  FileBarChart,
  Building2,
  FolderKanban,
  Database,
  Package,
  Factory,
  MapPin,
  Recycle,
  BookOpen,
  Boxes
} from 'lucide-react';
import { isRouteDisabled } from '@/config/enabledModules';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/contexts/CompanyContext';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
  category: string;
  badge?: string;
}

const SYSTEM_PAGES = [
  // Core
  { title: 'Dashboard', path: '/dashboard', icon: Home, keywords: ['inicio', 'home', 'painel', 'visao geral'] },
  { title: 'Documentos', path: '/documentos', icon: FileText, keywords: ['docs', 'files', 'arquivos', 'documento'] },
  { title: 'Aprovações de Extrações', path: '/documentos?tab=extracoes', icon: CheckCircle, keywords: ['aprovacao', 'extracoes', 'revisar', 'validar'] },
  { title: 'IA Insights', path: '/ia-insights', icon: Brain, keywords: ['inteligencia', 'artificial', 'ai', 'analytics'] },
  { title: 'Intelligence Center', path: '/intelligence-center', icon: Brain, keywords: ['inteligencia', 'center', 'centro'] },
  { title: 'Documentação do Banco', path: '/documentacao-banco', icon: Database, keywords: ['database', 'banco', 'tabelas', 'schema'] },
  { title: 'Configurações', path: '/configuracao', icon: Settings, keywords: ['config', 'ajustes', 'settings'] },
  
  // Financeiro
  { title: 'Dashboard Financeiro', path: '/financeiro/dashboard', icon: DollarSign, keywords: ['financeiro', 'money', 'dinheiro', 'finance'] },
  { title: 'Contas a Pagar', path: '/financeiro/contas-pagar', icon: CreditCard, keywords: ['pagar', 'fornecedor', 'boleto', 'payment'] },
  { title: 'Contas a Receber', path: '/financeiro/contas-receber', icon: Wallet, keywords: ['receber', 'faturamento', 'cliente', 'receivable'] },
  { title: 'Fluxo de Caixa', path: '/financeiro/fluxo-caixa', icon: TrendingUp, keywords: ['caixa', 'cash', 'fluxo', 'flow'] },
  { title: 'Orçamento', path: '/financeiro/orcamento', icon: Target, keywords: ['budget', 'orcamento', 'planejamento'] },
  { title: 'Centro de Custos', path: '/financeiro/centros-custo', icon: Building, keywords: ['custo', 'centro', 'cost center'] },
  { title: 'Plano de Contas', path: '/financeiro/plano-contas', icon: FileSpreadsheet, keywords: ['contabil', 'contas', 'chart'] },
  
  // Qualidade (SGQ)
  { title: 'Dashboard Qualidade', path: '/quality-dashboard', icon: Award, keywords: ['qualidade', 'sgq', 'indicadores', 'quality'] },
  { title: 'Não Conformidades', path: '/nao-conformidades', icon: AlertTriangle, keywords: ['nc', 'problema', 'desvio', 'nonconformity'] },
  { title: 'Ações Corretivas', path: '/acoes-corretivas', icon: CheckCircle, keywords: ['corretiva', 'acao', 'capa', 'corrective'] },
  { title: 'Gestão de Riscos', path: '/gestao-riscos', icon: Shield, keywords: ['risco', 'mitigacao', 'risk', 'analise'] },
  { title: 'Auditorias', path: '/auditoria', icon: ClipboardCheck, keywords: ['auditoria', 'interna', 'externa', 'audit'] },
  { title: 'Plano 5W2H', path: '/plano-acao-5w2h', icon: Target, keywords: ['5w2h', 'acao', 'plano', 'plan'] },
  { title: 'Indicadores de Qualidade', path: '/indicadores-qualidade', icon: BarChart3, keywords: ['indicador', 'kpi', 'metrica', 'quality'] },
  
  // RH
  { title: 'Gestão de Funcionários', path: '/gestao-funcionarios', icon: Users, keywords: ['funcionario', 'colaborador', 'rh', 'employee'] },
  { title: 'Treinamentos', path: '/gestao-treinamentos', icon: GraduationCap, keywords: ['treinamento', 'capacitacao', 'curso', 'training'] },
  { title: 'Gestão de Desempenho', path: '/gestao-desempenho', icon: Award, keywords: ['avaliacao', 'desempenho', 'pdi', 'performance'] },
  { title: 'Recrutamento', path: '/recrutamento', icon: UserPlus, keywords: ['vaga', 'selecao', 'contratacao', 'recruitment'] },
  { title: 'Segurança do Trabalho', path: '/seguranca-trabalho', icon: HardHat, keywords: ['sst', 'seguranca', 'acidente', 'safety'] },
  { title: 'Ponto e Frequência', path: '/ponto-frequencia', icon: Clock, keywords: ['ponto', 'presenca', 'falta', 'attendance'] },
  
  // ESG & Ambiental
  { title: 'Gestão ESG', path: '/gestao-esg', icon: BarChart3, keywords: ['esg', 'sustentabilidade', 'sustainability'] },
  { title: 'Inventário GEE', path: '/inventario-gee', icon: Leaf, keywords: ['emissoes', 'carbono', 'ghg', 'gee', 'emission'] },
  { title: 'Licenciamento', path: '/licenciamento', icon: FileCheck, keywords: ['licenca', 'ambiental', 'orgao', 'license'] },
  { title: 'Monitoramento de Água', path: '/monitoramento-agua', icon: Droplets, keywords: ['agua', 'water', 'consumo', 'hidrico'] },
  { title: 'Monitoramento de Energia', path: '/monitoramento-energia', icon: Zap, keywords: ['energia', 'eletricidade', 'kwh', 'energy'] },
  { title: 'Monitoramento de Resíduos', path: '/monitoramento-residuos', icon: Trash2, keywords: ['residuos', 'lixo', 'waste', 'garbage'] },
  { title: 'Metas ESG', path: '/metas', icon: Target, keywords: ['objetivos', 'goals', 'kpi', 'meta', 'target'] },
  { title: 'GRI', path: '/gri', icon: FileText, keywords: ['relatorio', 'gri', 'reporting', 'report'] },
  { title: 'Gestão de Stakeholders', path: '/gestao-stakeholders', icon: UsersRound, keywords: ['stakeholder', 'parte interessada', 'engajamento'] },
  { title: 'Materialidade', path: '/materialidade', icon: Target, keywords: ['material', 'relevancia', 'tema', 'materiality'] },
  { title: 'Indicadores ESG', path: '/indicadores-esg', icon: BarChart3, keywords: ['indicador', 'kpi', 'metrica', 'esg'] },
  { title: 'Relatórios Integrados', path: '/relatorios-integrados', icon: FileBarChart, keywords: ['relatorio', 'gri', 'sasb', 'report'] },
  { title: 'Governança ESG', path: '/governanca-esg', icon: Building2, keywords: ['governanca', 'compliance', 'governance'] },
  
  // Projetos & Estratégia
  { title: 'Gerenciamento de Projetos', path: '/gerenciamento-projetos', icon: FolderKanban, keywords: ['projeto', 'tarefa', 'kanban', 'project'] },
  { title: 'Gestão Estratégica', path: '/gestao-estrategica', icon: Target, keywords: ['estrategia', 'planejamento', 'strategic'] },
  { title: 'OKRs', path: '/okrs', icon: Target, keywords: ['okr', 'objetivos', 'key results', 'metas'] },
  { title: 'BSC', path: '/bsc', icon: BarChart3, keywords: ['balanced', 'scorecard', 'bsc', 'perspectivas'] },
  
  // Operações
  { title: 'Gestão de Ativos', path: '/gestao-ativos', icon: Factory, keywords: ['ativo', 'equipamento', 'asset', 'maquina'] },
  { title: 'Fornecedores', path: '/fornecedores', icon: Users, keywords: ['suppliers', 'terceiros', 'vendor', 'fornecedor'] },
  { title: 'Coleta de Dados', path: '/coleta-dados', icon: ListTodo, keywords: ['formularios', 'tasks', 'coleta', 'collection'] },
  { title: 'Gestão de Formulários', path: '/gestao-formularios', icon: FileText, keywords: ['formulario', 'form', 'custom', 'personalizado'] },
  { title: 'Planos de Ação', path: '/planos-acao', icon: Target, keywords: ['plano', 'acao', 'action plan', '5w2h'] },
  { title: 'PGRS', path: '/pgrs', icon: Recycle, keywords: ['residuos', 'gestao', 'plano', 'waste management'] },
];

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out pages from disabled modules
  const enabledSystemPages = useMemo(() => {
    return SYSTEM_PAGES.filter(page => !isRouteDisabled(page.path));
  }, []);

  // Search function with parallel queries
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    try {
      // Search system pages (filtered by enabled modules)
      const matchingPages = enabledSystemPages.filter(page => 
        page.title.toLowerCase().includes(lowerQuery) ||
        page.keywords.some(kw => kw.includes(lowerQuery))
      );

      matchingPages.forEach(page => {
        searchResults.push({
          id: `page-${page.path}`,
          title: page.title,
          subtitle: 'Página do sistema',
          icon: page.icon,
          action: () => {
            navigate(page.path);
            onOpenChange(false);
          },
          category: 'Páginas',
        });
      });

      // Execute all database searches in parallel
      if (selectedCompany) {
        const [
          documents,
          extractions,
          tasks,
          employees,
          projects,
          nonConformities,
          licenses,
          suppliers,
          assets,
          trainings,
          audits,
          esgTargets,
          actionPlans,
          stakeholders,
          forms,
          payables,
          receivables,
          emissionSources,
          wasteLogs,
          qualityIndicators,
        ] = await Promise.all([
          // Documents
          supabase
            .from('documents')
            .select('id, file_name, document_type')
            .eq('company_id', selectedCompany.id)
            .or(`file_name.ilike.%${query}%,document_type.ilike.%${query}%`)
            .limit(8),
          
          // Extractions (now properly filtered)
          supabase
            .from('extracted_data_preview')
            .select(`
              id,
              target_table,
              validation_status,
              extraction_job:document_extraction_jobs(
                document:documents(file_name)
              )
            `)
            .or(`target_table.ilike.%${query}%,validation_status.ilike.%${query}%`)
            .limit(5),
          
          // Tasks
          supabase
            .from('data_collection_tasks')
            .select('id, name, description, status')
            .eq('company_id', selectedCompany.id)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(8),
          
          // Employees
          supabase
            .from('employees')
            .select('id, full_name, position, department')
            .eq('company_id', selectedCompany.id)
            .or(`full_name.ilike.%${query}%,position.ilike.%${query}%,department.ilike.%${query}%`)
            .limit(8),
          
          // Projects
          supabase
            .from('projects')
            .select('id, name, description, status')
            .eq('company_id', selectedCompany.id)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(8),
          
          // Non-conformities
          supabase
            .from('non_conformities')
            .select('id, title, severity, status')
            .eq('company_id', selectedCompany.id)
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(8),
          
          // Licenses
          supabase
            .from('licenses')
            .select('id, name, type, status')
            .eq('company_id', selectedCompany.id)
            .or(`name.ilike.%${query}%,process_number.ilike.%${query}%`)
            .limit(8),
          
          // Suppliers
          supabase
            .from('suppliers')
            .select('id, name, cnpj')
            .eq('company_id', selectedCompany.id)
            .or(`name.ilike.%${query}%,cnpj.ilike.%${query}%`)
            .limit(8),
          
          // Assets
          supabase
            .from('assets')
            .select('id, name, asset_type')
            .eq('company_id', selectedCompany.id)
            .or(`name.ilike.%${query}%,asset_type.ilike.%${query}%`)
            .limit(8),
          
          // Training programs
          supabase
            .from('training_programs')
            .select('id, name, description')
            .eq('company_id', selectedCompany.id)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(8),
          
          // Audits
          supabase
            .from('audits')
            .select('id, title, audit_type, status')
            .eq('company_id', selectedCompany.id)
            .or(`title.ilike.%${query}%,audit_type.ilike.%${query}%`)
            .limit(8),
          
          // Goals (ESG Targets)
          supabase
            .from('goals')
            .select('id, name, description')
            .eq('company_id', selectedCompany.id)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(8),
          
          // Action Plans
          supabase
            .from('action_plans')
            .select('id, title, description, status')
            .eq('company_id', selectedCompany.id)
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(8),
          
          // Stakeholders
          supabase
            .from('stakeholders')
            .select('id, name, organization')
            .eq('company_id', selectedCompany.id)
            .or(`name.ilike.%${query}%,organization.ilike.%${query}%`)
            .limit(8),
          
          // Custom Forms
          supabase
            .from('custom_forms')
            .select('id, title, description')
            .eq('company_id', selectedCompany.id)
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(8),
          
          // Accounts Payable
          supabase
            .from('accounts_payable')
            .select('id, invoice_number, supplier_name, original_amount')
            .eq('company_id', selectedCompany.id)
            .or(`invoice_number.ilike.%${query}%,supplier_name.ilike.%${query}%`)
            .limit(8),
          
          // Accounts Receivable
          supabase
            .from('accounts_receivable')
            .select('id, invoice_number, customer_name, original_amount')
            .eq('company_id', selectedCompany.id)
            .or(`invoice_number.ilike.%${query}%,customer_name.ilike.%${query}%`)
            .limit(8),
          
          // Emission Sources
          supabase
            .from('emission_sources')
            .select('id, name, description')
            .eq('company_id', selectedCompany.id)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(8),
          
          // Waste Logs
          supabase
            .from('waste_logs')
            .select('id, waste_source_id, quantity, log_date, waste_source:waste_sources(name)')
            .eq('company_id', selectedCompany.id)
            .limit(8),
          
          // Quality Indicators
          supabase
            .from('quality_indicators')
            .select('id, name, description')
            .eq('company_id', selectedCompany.id)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(8),
        ]);

        // Process documents
        documents.data?.forEach(doc => {
          searchResults.push({
            id: `doc-${doc.id}`,
            title: doc.file_name,
            subtitle: doc.document_type || 'Documento',
            icon: FileText,
            action: () => { navigate('/documentos'); onOpenChange(false); },
            category: 'Documentos',
          });
        });

        // Process extractions
        extractions.data?.forEach((ext: any) => {
          searchResults.push({
            id: `ext-${ext.id}`,
            title: ext.extraction_job?.document?.file_name || 'Extração',
            subtitle: ext.target_table,
            icon: CheckCircle,
            action: () => { navigate('/documentos?tab=extracoes'); onOpenChange(false); },
            category: 'Extrações',
            badge: ext.validation_status,
          });
        });

        // Process tasks
        tasks.data?.forEach(task => {
          searchResults.push({
            id: `task-${task.id}`,
            title: task.name,
            subtitle: task.description || `Status: ${task.status}`,
            icon: ListTodo,
            action: () => { navigate('/coleta-dados'); onOpenChange(false); },
            category: 'Tarefas',
            badge: task.status,
          });
        });

        // Process employees
        employees.data?.forEach(emp => {
          searchResults.push({
            id: `emp-${emp.id}`,
            title: emp.full_name,
            subtitle: `${emp.position || ''} - ${emp.department || ''}`,
            icon: Users,
            action: () => { navigate('/gestao-funcionarios'); onOpenChange(false); },
            category: 'Funcionários',
          });
        });

        // Process projects
        projects.data?.forEach(proj => {
          searchResults.push({
            id: `proj-${proj.id}`,
            title: proj.name,
            subtitle: proj.description || proj.status,
            icon: FolderKanban,
            action: () => { navigate('/gerenciamento-projetos'); onOpenChange(false); },
            category: 'Projetos',
            badge: proj.status,
          });
        });

        // Process non-conformities
        nonConformities.data?.forEach(nc => {
          searchResults.push({
            id: `nc-${nc.id}`,
            title: nc.title,
            subtitle: `Severidade: ${nc.severity}`,
            icon: AlertTriangle,
            action: () => { navigate('/nao-conformidades'); onOpenChange(false); },
            category: 'Não Conformidades',
            badge: nc.status,
          });
        });

        // Process licenses
        licenses.data?.forEach(lic => {
          searchResults.push({
            id: `lic-${lic.id}`,
            title: lic.name,
            subtitle: lic.type || 'Licença ambiental',
            icon: FileCheck,
            action: () => { navigate('/licenciamento'); onOpenChange(false); },
            category: 'Licenças',
            badge: lic.status,
          });
        });

        // Process suppliers
        suppliers.data?.forEach(sup => {
          searchResults.push({
            id: `sup-${sup.id}`,
            title: sup.name,
            subtitle: sup.cnpj,
            icon: Package,
            action: () => { navigate('/fornecedores'); onOpenChange(false); },
            category: 'Fornecedores',
          });
        });

        // Process assets
        assets.data?.forEach(asset => {
          searchResults.push({
            id: `asset-${asset.id}`,
            title: asset.name,
            subtitle: asset.asset_type,
            icon: Factory,
            action: () => { navigate('/gestao-ativos'); onOpenChange(false); },
            category: 'Ativos',
          });
        });

        // Process trainings
        trainings.data?.forEach(tr => {
          searchResults.push({
            id: `train-${tr.id}`,
            title: tr.name,
            subtitle: tr.description,
            icon: GraduationCap,
            action: () => { navigate('/gestao-treinamentos'); onOpenChange(false); },
            category: 'Treinamentos',
          });
        });

        // Process audits
        audits.data?.forEach(audit => {
          searchResults.push({
            id: `audit-${audit.id}`,
            title: audit.title,
            subtitle: audit.audit_type,
            icon: ClipboardCheck,
            action: () => { navigate('/auditoria'); onOpenChange(false); },
            category: 'Auditorias',
            badge: audit.status,
          });
        });

        // Process goals/ESG targets
        esgTargets.data?.forEach(target => {
          searchResults.push({
            id: `target-${target.id}`,
            title: target.name,
            subtitle: target.description,
            icon: Target,
            action: () => { navigate('/metas'); onOpenChange(false); },
            category: 'Metas ESG',
          });
        });

        // Process action plans
        actionPlans.data?.forEach(plan => {
          searchResults.push({
            id: `plan-${plan.id}`,
            title: plan.title,
            subtitle: plan.description,
            icon: Target,
            action: () => { navigate('/planos-acao'); onOpenChange(false); },
            category: 'Planos de Ação',
            badge: plan.status,
          });
        });

        // Process stakeholders
        stakeholders.data?.forEach(sh => {
          searchResults.push({
            id: `sh-${sh.id}`,
            title: sh.name,
            subtitle: sh.organization,
            icon: UsersRound,
            action: () => { navigate('/gestao-stakeholders'); onOpenChange(false); },
            category: 'Stakeholders',
          });
        });

        // Process custom forms
        forms.data?.forEach(form => {
          searchResults.push({
            id: `form-${form.id}`,
            title: form.title,
            subtitle: form.description,
            icon: FileText,
            action: () => { navigate('/gestao-formularios'); onOpenChange(false); },
            category: 'Formulários',
          });
        });

        // Process accounts payable
        payables.data?.forEach(pay => {
          searchResults.push({
            id: `pay-${pay.id}`,
            title: `Fatura ${pay.invoice_number}`,
            subtitle: `${pay.supplier_name} - R$ ${pay.original_amount?.toFixed(2)}`,
            icon: CreditCard,
            action: () => { navigate('/financeiro/contas-pagar'); onOpenChange(false); },
            category: 'Contas a Pagar',
          });
        });

        // Process accounts receivable
        receivables.data?.forEach(rec => {
          searchResults.push({
            id: `rec-${rec.id}`,
            title: `Fatura ${rec.invoice_number}`,
            subtitle: `${rec.customer_name} - R$ ${rec.original_amount?.toFixed(2)}`,
            icon: Wallet,
            action: () => { navigate('/financeiro/contas-receber'); onOpenChange(false); },
            category: 'Contas a Receber',
          });
        });

        // Process emission sources
        emissionSources.data?.forEach(es => {
          searchResults.push({
            id: `es-${es.id}`,
            title: es.name,
            subtitle: es.description,
            icon: Leaf,
            action: () => { navigate('/inventario-gee'); onOpenChange(false); },
            category: 'Fontes de Emissão',
          });
        });

        // Process waste logs
        wasteLogs.data?.forEach((wl: any) => {
          searchResults.push({
            id: `wl-${wl.id}`,
            title: wl.waste_source?.name || 'Resíduo',
            subtitle: `${wl.quantity} kg - ${new Date(wl.log_date).toLocaleDateString()}`,
            icon: Trash2,
            action: () => { navigate('/monitoramento-residuos'); onOpenChange(false); },
            category: 'Resíduos',
          });
        });

        // Process quality indicators
        qualityIndicators.data?.forEach(qi => {
          searchResults.push({
            id: `qi-${qi.id}`,
            title: qi.name,
            subtitle: qi.description,
            icon: BarChart3,
            action: () => { navigate('/indicadores-qualidade'); onOpenChange(false); },
            category: 'Indicadores',
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompany, navigate, onOpenChange]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Buscar documentos, extrações, tasks ou páginas..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Buscando...' : 'Nenhum resultado encontrado.'}
        </CommandEmpty>
        
        {Object.entries(groupedResults).map(([category, items], idx) => (
          <div key={category}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {items.map((result) => {
                const Icon = result.icon;
                return (
                  <CommandItem
                    key={result.id}
                    onSelect={result.action}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    {result.badge && (
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                        {result.badge}
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}

        {/* Quick actions when no search */}
        {!searchQuery && (
          <>
            <CommandGroup heading="Ações Rápidas">
              <CommandItem
                onSelect={() => {
                  navigate('/documentos');
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Ver todos os documentos</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate('/documentos?tab=extracoes');
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Ver aprovações pendentes</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  navigate('/coleta-dados');
                  onOpenChange(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              >
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Ver tasks de coleta</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Dica">
              <CommandItem disabled className="text-xs text-muted-foreground">
                <Search className="h-3 w-3 mr-2" />
                Digite para buscar em documentos, extrações e páginas
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
