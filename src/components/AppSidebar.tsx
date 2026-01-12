import { useState, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Star, StarOff, ChevronRight, Search, X } from "lucide-react"
import * as icons from "lucide-react"
import { Input } from "@/components/ui/input"
import { BadgeNotification, StatusIndicator } from "@/components/ui/badge-notification"
import { useNotificationCounts } from "@/hooks/useNotificationCounts"
import { DISABLED_SECTION_IDS, DISABLED_ESG_CATEGORY_IDS } from "@/config/enabledModules"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { NavigationTooltip } from "@/components/navigation/NavigationTooltip"
import { useFavorites } from "@/hooks/useFavorites"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useHasRole } from "@/middleware/roleGuard"
import datonLogo from "@/assets/daton-logo-header.png"

// Importações de ícones organizadas por categoria
import {
  LayoutDashboard, BarChart3, TrendingUp, PieChart, Activity, Monitor,
  Leaf, CloudRain, Users, Shield, Eye, Heart, Scale,
  Award, CheckSquare, AlertTriangle, Target, ClipboardCheck,
  FileText, Upload, Database, Building, FileSpreadsheet, Layers, Folder, HardDrive,
  Users2, UserCheck, UserCog, GraduationCap, Briefcase, Calendar,
  FileBarChart, FileCheck, BookOpen, TrendingDown, CheckCircle, ShieldCheck,
  Settings, Bell, Clock, Building2, MapPin,
  Brain, ShoppingCart, Zap, Truck, BarChart, FlaskConical, Sparkles, Package, Flag, 
  Recycle, Gavel, Trash2, CloudUpload, Wand2, Workflow, BookMarked, Handshake,
  FolderKanban, DollarSign, HelpCircle, Droplets, Cloud, Crown, FolderTree, Mail
} from "lucide-react"

// Nova estrutura ESG completa reorganizada
interface MenuItem {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  description: string
  subItems?: MenuItem[]
}

interface MenuSection {
  id: string
  title: string
  icon?: React.ComponentType<{ className?: string }>
  items: MenuItem[]
  isCollapsible?: boolean
  defaultOpen?: boolean
  hasDivider?: boolean
}

const menuSections: MenuSection[] = [
  {
    id: "esg",
    title: "ESG",
    icon: Leaf,
    isCollapsible: true,
    defaultOpen: false,
    items: [
      { id: "esg-management", title: "Painel de Gestão ESG", icon: Leaf, path: "/gestao-esg", description: "Central de gestão ESG" },
      
      // CATEGORIA: AMBIENTAL (E)
      {
        id: "environmental-category",
        title: "Ambiental",
        icon: CloudRain,
        path: "#",
        description: "Gestão ambiental, emissões e licenciamento",
        subItems: [
          {
            id: "monitoring",
            title: "Monitoramento ESG",
            icon: Activity,
            path: "/monitoramento-esg",
            description: "Central consolidada de indicadores ESG",
            subItems: [
              { id: "monitoring-dashboard", title: "Dashboard de Monitoramento", icon: Activity, path: "/monitoramento-esg", description: "Central consolidada de indicadores ESG" },
              { id: "monitoring-water", title: "Monitoramento de Água", icon: Droplets, path: "/monitoramento-agua", description: "Gestão contínua de recursos hídricos (GRI 303)" },
              { id: "monitoring-energy", title: "Monitoramento de Energia", icon: Zap, path: "/monitoramento-energia", description: "Gestão contínua de consumo energético (GRI 302)" },
              { id: "monitoring-emissions", title: "Monitoramento de Emissões", icon: Cloud, path: "/monitoramento-emissoes", description: "Inventário contínuo de GEE (GRI 305)" },
              { id: "monitoring-waste", title: "Monitoramento de Resíduos", icon: Trash2, path: "/monitoramento-residuos", description: "Gestão contínua de resíduos sólidos (GRI 306)" }
            ]
          },
          {
            id: "emissions",
            title: "Emissões de GEE",
            icon: CloudRain,
            path: "/inventario-gee",
            description: "Gestão de gases de efeito estufa",
            subItems: [
              { id: "ghg-dashboard", title: "Dashboard GHG", icon: BarChart3, path: "/dashboard-ghg", description: "Painel de monitoramento de emissões" },
              { id: "ghg-inventory", title: "Inventário de Emissões", icon: FileBarChart, path: "/inventario-gee", description: "Controle completo do inventário GEE" },
              { id: "carbon-projects", title: "Projetos de Carbono", icon: Leaf, path: "/projetos-carbono", description: "Gestão de projetos de redução" }
            ]
          },
          {
            id: "waste-management",
            title: "Gestão de Resíduos",
            icon: Recycle,
            path: "/residuos",
            description: "Controle e destinação de resíduos",
            subItems: [
              { id: "waste-logs", title: "Registros de Resíduos", icon: Trash2, path: "/residuos", description: "Controle e destinação de resíduos" }
            ]
          },
          
          { id: "sustainability-targets", title: "Metas de Sustentabilidade", icon: Target, path: "/metas-sustentabilidade", description: "Definição e acompanhamento de metas" }
        ]
      },
      
      // CATEGORIA: SOCIAL (S)
      {
        id: "social-category",
        title: "Social",
        icon: Users,
        path: "#",
        description: "Gestão de pessoas, saúde e desenvolvimento",
        subItems: [
          { id: "social-dashboard", title: "Dashboard Social", icon: Users, path: "/social-esg", description: "Visão geral consolidada dos aspectos sociais" },
          { id: "job-descriptions", title: "Gestão de Cargos", icon: Briefcase, path: "/descricao-cargos", description: "Gestão completa de cargos e funções" },
          { id: "employee-management", title: "Gestão de Funcionários", icon: UserCheck, path: "/gestao-funcionarios", description: "Gestão completa de recursos humanos" },
          { id: "health-safety", title: "Segurança do Trabalho", icon: Heart, path: "/seguranca-trabalho", description: "SST e bem-estar dos colaboradores" },
          { id: "training-management", title: "Treinamentos", icon: GraduationCap, path: "/gestao-treinamentos", description: "Gestão de capacitação e treinamentos" },
          { id: "career-development", title: "Desenvolvimento de Carreira", icon: TrendingUp, path: "/desenvolvimento-carreira", description: "PDIs, mentoria e crescimento profissional" }
        ]
      },
      
      // CATEGORIA: GOVERNANÇA (G)
      {
        id: "governance-category",
        title: "Governança",
        icon: Shield,
        path: "#",
        description: "Compliance, riscos, auditorias e ética",
        subItems: [
          { id: "governance-panel", title: "Painel de Governança", icon: Shield, path: "/governanca-esg", description: "Visão geral da governança corporativa" },
          { id: "risk-management", title: "Gestão de Riscos", icon: AlertTriangle, path: "/gestao-riscos", description: "Identificação e mitigação de riscos" },
          { id: "compliance-policies", title: "Compliance e Políticas", icon: Scale, path: "/compliance", description: "Conformidade regulatória e políticas" },
          { id: "audits", title: "Auditorias", icon: CheckCircle, path: "/auditoria", description: "Gestão de auditorias internas e externas" },
          { id: "stakeholder-management", title: "Gestão de Stakeholders", icon: Handshake, path: "/gestao-stakeholders", description: "Gestão de partes interessadas" },
          { id: "materiality-analysis", title: "Análise de Materialidade", icon: Eye, path: "/analise-materialidade", description: "Identificação de temas ESG relevantes" }
        ]
      }
    ]
  },
  {
    id: "financial",
    title: "FINANCEIRO",
    icon: DollarSign,
    isCollapsible: true,
    defaultOpen: false,
    items: [
      { 
        id: "financial-dashboard", 
        title: "Dashboard Financeiro", 
        icon: icons.DollarSign, 
        path: "/financeiro/dashboard", 
        description: "Visão consolidada das finanças" 
      },
      { 
        id: "chart-of-accounts", 
        title: "Plano de Contas", 
        icon: icons.DollarSign, 
        path: "/financeiro/plano-contas", 
        description: "Estrutura contábil da empresa" 
      },
      { 
        id: "accounting-entries", 
        title: "Lançamentos Contábeis", 
        icon: icons.DollarSign, 
        path: "/financeiro/lancamentos-contabeis", 
        description: "Registro de operações contábeis" 
      },
      { 
        id: "accounts-payable", 
        title: "Contas a Pagar", 
        icon: icons.DollarSign, 
        path: "/financeiro/contas-pagar", 
        description: "Gestão de obrigações financeiras" 
      },
      { 
        id: "accounts-receivable", 
        title: "Contas a Receber", 
        icon: TrendingUp, 
        path: "/financeiro/contas-receber", 
        description: "Gestão de recebíveis" 
      },
      { 
        id: "financial-approvals", 
        title: "Aprovações", 
        icon: icons.CheckCircle, 
        path: "/financeiro/aprovacoes", 
        description: "Aprovações financeiras pendentes" 
      },
      { 
        id: "esg-financial-dashboard", 
        title: "Dashboard ESG", 
        icon: icons.Activity, 
        path: "/financeiro/esg-dashboard", 
        description: "Integração Financeiro-ESG" 
      },
      { 
        id: "budget-management",
        title: "Gestão de Orçamento", 
        icon: TrendingUp, 
        path: "/financeiro/orcamento", 
        description: "Planejamento e controle orçamentário" 
      },
      { 
        id: "cash-flow", 
        title: "Fluxo de Caixa", 
        icon: icons.DollarSign, 
        path: "/financeiro/fluxo-caixa", 
        description: "Controle de entradas e saídas" 
      },
      { 
        id: "cost-centers", 
        title: "Centros de Custo", 
        icon: Building2, 
        path: "/financeiro/centros-custo", 
        description: "Alocação de despesas por departamento" 
      },
      { 
        id: "financial-reports", 
        title: "Relatórios Financeiros", 
        icon: icons.DollarSign, 
        path: "/financeiro/relatorios", 
        description: "DRE e análises gerenciais" 
      },
      { 
        id: "profitability-analysis", 
        title: "Análise de Rentabilidade", 
        icon: TrendingUp, 
        path: "/financeiro/rentabilidade", 
        description: "ROI de projetos e categorias" 
      },
      { 
        id: "waste-payables", 
        title: "Contas a Pagar - Resíduos", 
        icon: icons.DollarSign, 
        path: "/financeiro/residuos/contas-a-pagar", 
        description: "Gestão financeira de pagamentos de resíduos" 
      },
      { 
        id: "waste-receivables", 
        title: "Contas a Receber - Resíduos", 
        icon: TrendingUp, 
        path: "/financeiro/residuos/contas-a-receber", 
        description: "Receitas com venda de recicláveis" 
      }
    ]
  },
  {
    id: "sgq",
    title: "QUALIDADE",
    icon: Award,
    isCollapsible: true,
    defaultOpen: false,
    items: [
      { id: "sgq-dashboard", title: "Dashboard SGQ", icon: Award, path: "/quality-dashboard", description: "Painel de gestão da qualidade" },
      { id: "gestao-indicadores", title: "Gestão de Indicadores", icon: BarChart3, path: "/gestao-indicadores", description: "Monitoramento e análise de indicadores" },
      { id: "strategic-planning", title: "Planejamento Estratégico", icon: Target, path: "/planejamento-estrategico", description: "Definição de estratégias organizacionais" },
      { id: "process-mapping", title: "Mapeamento de Processos", icon: Workflow, path: "/mapeamento-processos", description: "Documentação e otimização de processos" },
      { id: "non-conformities", title: "Não Conformidades", icon: AlertTriangle, path: "/nao-conformidades", description: "Gestão de não conformidades e ações corretivas" },
      { id: "corrective-actions", title: "Ações Corretivas", icon: CheckSquare, path: "/acoes-corretivas", description: "Planos de ação e melhorias" },
      { id: "document-control", title: "Controle de Documentos", icon: FileText, path: "/controle-documentos", description: "Versionamento e controle documental" },
      { id: "laia", title: "LAIA", icon: Leaf, path: "/laia", description: "Levantamento e Avaliação de Aspectos e Impactos Ambientais" },
      {
        id: "licensing", 
        title: "Licenciamento", 
        icon: Gavel, 
        path: "/licenciamento", 
        description: "Gestão de licenças e autorizações",
        subItems: [
          { id: "licensing-dashboard", title: "Dashboard", icon: BarChart3, path: "/licenciamento", description: "Visão geral de licenciamento" },
          { id: "licensing-legislations", title: "Legislações", icon: Scale, path: "/licenciamento/legislacoes", description: "Gestão de legislações aplicáveis" }
        ]
      }
    ]
  },
  {
    id: "suppliers",
    title: "FORNECEDORES",
    icon: Truck,
    isCollapsible: true,
    defaultOpen: false,
    items: [
      { id: "supplier-dashboard", title: "Dashboard de Fornecedores", icon: LayoutDashboard, path: "/fornecedores/dashboard", description: "Visão geral da gestão de fornecedores" },
      { id: "supplier-registration", title: "Cadastro de Fornecedores", icon: Users2, path: "/fornecedores/cadastro", description: "Registro e gestão de fornecedores" },
      { 
        id: "supplier-records", 
        title: "Registros", 
        icon: Database, 
        path: "#", 
        description: "Configurações de tipos e documentação",
        subItems: [
          { id: "required-documents", title: "Documentação Obrigatória", icon: FileText, path: "/fornecedores/documentacao", description: "Documentos exigidos por tipo" },
          { id: "supplier-categories", title: "Categorias de Fornecedor", icon: FolderTree, path: "/fornecedores/categorias", description: "Agrupamento de tipos (2º nível)" },
          { id: "supplier-types", title: "Tipos de Fornecedor", icon: Layers, path: "/fornecedores/tipos", description: "Categorização de fornecedores" },
          { id: "supplier-trainings", title: "Treinamentos e Informativos", icon: BookOpen, path: "/fornecedores/treinamentos", description: "Materiais, links e questionários" },
          { id: "supplier-readings", title: "Leituras Obrigatórias", icon: BookMarked, path: "/fornecedores/leituras-obrigatorias", description: "Documentos para leitura" },
          { id: "supplier-surveys", title: "Pesquisas/Questionários", icon: ClipboardCheck, path: "/fornecedores/pesquisas", description: "Pesquisas para fornecedores" }
        ]
      },
      { id: "supplier-doc-type-assoc", title: "Associação Doc ↔ Tipo", icon: Handshake, path: "/fornecedores/associacao-documentos", description: "Vincular documentos obrigatórios a tipos" },
      { id: "supplier-connections", title: "Conexões", icon: Handshake, path: "/fornecedores/conexoes", description: "Vínculos entre fornecedores" },
      { id: "supplier-deliveries", title: "Fornecimentos (ALX)", icon: Package, path: "/fornecedores/entregas", description: "Registro de fornecimentos individuais" },
      { id: "supplier-evaluations", title: "Avaliações", icon: CheckSquare, path: "/fornecedores/avaliacoes", description: "Avaliação de documentos e qualificação" },
      { id: "supplier-evaluation-criteria", title: "Critérios de Avaliação", icon: Settings, path: "/fornecedores/criterios-avaliacao", description: "Configurar critérios e pesos AVA2" },
      { id: "supplier-failures", title: "Falhas de Fornecimento", icon: AlertTriangle, path: "/fornecedores/falhas", description: "Registro de falhas e inativação automática" },
      { id: "supplier-indicators", title: "Indicadores de Gestão", icon: BarChart3, path: "/fornecedores/indicadores", description: "AVA1, AVA2, EXT1 - Conformidade e participação" },
      { id: "supplier-import-export", title: "Importar/Exportar", icon: FileSpreadsheet, path: "/fornecedores/importar-exportar", description: "Importar e exportar fornecedores via Excel" }
    ]
  },
  {
    id: "data-reports",
    title: "DADOS E RELATÓRIOS",
    icon: Database,
    isCollapsible: true,
    defaultOpen: false,
    items: [
      { id: "data-collection", title: "Coleta de Dados", icon: Database, path: "/coleta-dados", description: "Importação e gestão de dados ESG" },
      { id: "documents", title: "Documentos", icon: Folder, path: "/documentos", description: "Biblioteca, extrações e reconciliação IA" },
      { id: "assets", title: "Ativos", icon: Building2, path: "/ativos", description: "Gestão de ativos da organização" },
      { id: "recommended-indicators", title: "Indicadores ESG Recomendados", icon: BarChart3, path: "/indicadores-recomendados", description: "Cálculos automáticos de KPIs ESG com benchmarks" },
      { id: "integrated-reports", title: "Relatórios Integrados", icon: BookMarked, path: "/relatorios-integrados", description: "Relatórios ESG completos e integrados" },
      { id: "sdg-dashboard", title: "Dashboard ODS", icon: Target, path: "/sdg-dashboard", description: "Visualização de contribuição aos ODS" }
    ]
  },
  {
    id: "settings",
    title: "CONFIGURAÇÕES",
    icon: Settings,
    isCollapsible: true,
    defaultOpen: false,
    hasDivider: true,
    items: [
      { id: "organization-config", title: "Configuração da Organização", icon: Building, path: "/configuracao-organizacional", description: "Dados e estrutura organizacional" },
      { id: "factor-library", title: "Biblioteca de Fatores", icon: FlaskConical, path: "/biblioteca-fatores", description: "Fatores de emissão e conversão" },
      { id: "custom-forms", title: "Formulários Customizados", icon: ClipboardCheck, path: "/formularios-customizados", description: "Criação de formulários personalizados" },
      { id: "mailing-lists", title: "Listas de Envio", icon: Mail, path: "/listas-de-envio", description: "Gerenciar listas de email e campanhas" },
      { id: "user-management", title: "Gestão de Usuários", icon: UserCog, path: "/gestao-usuarios", description: "Controle de usuários e permissões" },
      { id: "system-status", title: "Status do Sistema", icon: Activity, path: "/system-status", description: "Monitoramento e prontidão para produção" }
    ]
  },
  {
    id: "platform-admin",
    title: "ADMINISTRAÇÃO DA PLATAFORMA",
    hasDivider: true,
    items: [
      { id: "platform-admin-dashboard", title: "Dashboard Platform Admin", icon: Crown, path: "/platform-admin", description: "Gestão de empresas e analytics da plataforma" }
    ]
  },
  {
    id: "help",
    title: "AJUDA",
    icon: HelpCircle,
    isCollapsible: true,
    defaultOpen: false,
    items: [
      { id: "help-center", title: "Central de Ajuda", icon: HelpCircle, path: "/ajuda", description: "Central de ajuda e suporte" }
    ]
  }
]

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const { user, restartOnboarding } = useAuth()
  const { toast } = useToast()
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  const isPlatformAdmin = useHasRole('platform_admin')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'esg': false,
    'environmental-category': false,
    'social-category': false,
    'governance-category': false
  })
  const [isHovering, setIsHovering] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { data: notificationCounts } = useNotificationCounts()
  
  const currentPath = location.pathname
  const isActive = (path: string) => currentPath === path
  
  // Auto-expand category if active page belongs to it
  useState(() => {
    const environmentalPaths = ['/monitoramento-esg', '/monitoramento-agua', '/monitoramento-energia', '/monitoramento-emissoes', '/monitoramento-residuos', '/inventario-gee', '/dashboard-ghg', '/projetos-carbono', '/residuos', '/financeiro/residuos', '/licenciamento', '/metas-sustentabilidade']
    const socialPaths = ['/social-esg', '/gestao-funcionarios', '/seguranca-trabalho', '/gestao-treinamentos', '/desenvolvimento-carreira']
    const governancePaths = ['/governanca-esg', '/gestao-riscos', '/compliance', '/auditoria', '/gestao-stakeholders', '/analise-materialidade']
    
    if (environmentalPaths.some(p => currentPath.startsWith(p))) {
      setExpandedSections(prev => ({ ...prev, 'environmental-category': true }))
    } else if (socialPaths.some(p => currentPath.startsWith(p))) {
      setExpandedSections(prev => ({ ...prev, 'social-category': true }))
    } else if (governancePaths.some(p => currentPath.startsWith(p))) {
      setExpandedSections(prev => ({ ...prev, 'governance-category': true }))
    }
  })

  const handleFavoriteToggle = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite({
      id: item.id,
      title: item.title,
      path: item.path,
      icon: item.icon.name || 'FileText'
    })
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Get notification count for specific menu item
  const getNotificationCount = (itemId: string): number => {
    if (!notificationCounts) return 0;
    
    const countMap: Record<string, number> = {
      'environmental-licensing': notificationCounts.licenses_expiring,
      'audits': notificationCounts.pending_audits,
      'non-conformities': notificationCounts.open_non_conformities,
      'training-management': notificationCounts.pending_trainings,
    };
    
    return countMap[itemId] || 0;
  }

  // Get status indicator for specific menu item
  const getStatusIndicator = (itemId: string): 'active' | 'warning' | 'expired' | null => {
    const count = getNotificationCount(itemId);
    
    if (itemId === 'environmental-licensing' && count > 0) {
      return count > 5 ? 'expired' : 'warning';
    }
    
    if (itemId === 'non-conformities' && count > 0) {
      return 'warning';
    }
    
    return null;
  }

  const renderSubMenuItem = (item: MenuItem, isParentActive: boolean) => {
    const active = isActive(item.path)
    const isFav = isFavorite(item.id)

    return (
      <SidebarMenuSubItem key={item.id}>
        <SidebarMenuSubButton
          onClick={() => navigate(item.path)}
          className={`group cursor-pointer ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/30"}`}
        >
          <NavigationTooltip
            title={item.title}
            description={item.description}
            disabled={false}
          >
            <div className="flex items-center flex-1 min-w-0 pl-2">
              {!collapsed && (
                <span className={`text-[11px] truncate flex-1 min-w-0 ${active ? "" : "text-muted-foreground"}`}>
                  {item.title}
                </span>
              )}
            </div>
          </NavigationTooltip>
          
          {!collapsed && (
            <div
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity hover-scale flex items-center justify-center"
              onClick={(e) => handleFavoriteToggle(item, e)}
            >
              {isFav ? <Star className="h-2.5 w-2.5 fill-current text-yellow-500" /> : <StarOff className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground" />}
            </div>
          )}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  const renderMenuItem = (item: MenuItem, hideIcon: boolean = false) => {
    const active = isActive(item.path)
    const isFav = isFavorite(item.id)
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isExpanded = expandedSections[item.id] || false
    const hasActiveSubItem = item.subItems?.some(subItem => {
      if (isActive(subItem.path)) return true
      return subItem.subItems?.some(deepSubItem => isActive(deepSubItem.path))
    }) || false
    const notificationCount = getNotificationCount(item.id)
    const statusIndicator = getStatusIndicator(item.id)
    const isCategory = item.path === "#"

    if (hasSubItems) {
      return (
        <Collapsible key={item.id} open={isExpanded} onOpenChange={() => toggleSection(item.id)}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={`group ${
                  isCategory 
                    ? "font-semibold text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
                    : active || hasActiveSubItem 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted/50"
                }`}
              >
                <NavigationTooltip
                  title={item.title}
                  description={item.description}
                  disabled={!collapsed}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {!hideIcon && (
                      <div className="relative">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {statusIndicator && (
                          <StatusIndicator 
                            status={statusIndicator} 
                            pulse={statusIndicator === 'warning'}
                            className="absolute -top-0.5 -right-0.5"
                          />
                        )}
                      </div>
                    )}
                    {!collapsed && (
                      <span className={hideIcon ? "text-[11px] text-muted-foreground truncate pl-2" : "text-sm font-medium truncate"}>
                        {item.title}
                      </span>
                    )}
                  </div>
                </NavigationTooltip>
                
                <div className="flex items-center gap-1">
                  {!collapsed && notificationCount > 0 && (
                    <BadgeNotification 
                      count={notificationCount}
                      variant={notificationCount > 5 ? 'destructive' : 'warning'}
                      className="mr-1"
                    />
                  )}
                  {!collapsed && (
                    <div
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity hover-scale flex items-center justify-center"
                      onClick={(e) => handleFavoriteToggle(item, e)}
                    >
                      {isFav ? <Star className="h-3 w-3 fill-current text-yellow-500" /> : <StarOff className="h-3 w-3 text-muted-foreground hover:text-foreground" />}
                    </div>
                  )}
                  {!collapsed && (
                    <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  )}
                </div>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className={isCategory ? "border-l-2 border-muted ml-2 pl-1.5" : ""}>
                {item.subItems?.map(subItem => 
                  subItem.subItems && subItem.subItems.length > 0 
                    ? renderMenuItem(subItem, hideIcon)
                    : renderSubMenuItem(subItem, active || hasActiveSubItem)
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      )
    }

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => navigate(item.path)}
          className={`group transition-all duration-200 hover-scale ${active ? "bg-primary/10 text-primary font-medium shadow-sm" : "hover:bg-muted/50 hover:shadow-sm"}`}
        >
          <NavigationTooltip
            title={item.title}
            description={item.description}
            disabled={!collapsed}
          >
            <div className="flex items-center gap-3 flex-1">
              {!hideIcon && (
                <div className="relative">
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {statusIndicator && (
                    <StatusIndicator 
                      status={statusIndicator} 
                      pulse={statusIndicator === 'warning'}
                      className="absolute -top-0.5 -right-0.5"
                    />
                  )}
                </div>
              )}
              {!collapsed && (
                <span className={hideIcon ? "text-[11px] text-muted-foreground truncate pl-2" : "text-sm font-medium truncate"}>
                  {item.title}
                </span>
              )}
            </div>
          </NavigationTooltip>
          
          {!collapsed && notificationCount > 0 && (
            <BadgeNotification 
              count={notificationCount}
              variant={notificationCount > 5 ? 'destructive' : 'warning'}
              className="mr-1"
            />
          )}
          
          {!collapsed && (
            <div
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200 hover-scale flex items-center justify-center"
              onClick={(e) => handleFavoriteToggle(item, e)}
            >
              {isFav ? <Star className="h-3 w-3 fill-current text-yellow-500" /> : <StarOff className="h-3 w-3 text-muted-foreground hover:text-foreground" />}
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // Filter menu items based on search
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    if (!searchQuery.trim()) return items
    
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (matchesSearch) return true
      
      // Check subitems
      if (item.subItems) {
        return item.subItems.some(subItem => 
          subItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subItem.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      return false
    })
  }

  // Filter sections based on enabled modules configuration
  const modulesFilteredSections = useMemo(() => {
    return menuSections
      // Filter out disabled top-level sections (financial, data-reports)
      .filter(section => !DISABLED_SECTION_IDS.includes(section.id))
      // Filter out disabled ESG categories within ESG section
      .map(section => {
        if (section.id === 'esg') {
          return {
            ...section,
            items: section.items.filter(item => !DISABLED_ESG_CATEGORY_IDS.includes(item.id))
          }
        }
        return section
      })
  }, [])

  const filteredSections = searchQuery.trim() 
    ? modulesFilteredSections
        .filter(section => isPlatformAdmin || section.id !== 'platform-admin')
        .map(section => ({
          ...section,
          items: filterMenuItems(section.items)
        }))
        .filter(section => section.items.length > 0)
    : modulesFilteredSections.filter(section => isPlatformAdmin || section.id !== 'platform-admin')

  return (
    <Sidebar 
      className="border-r bg-sidebar transition-all duration-300 hover:shadow-lg" 
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      data-tour="sidebar"
    >
      <SidebarHeader className={`p-4 border-b transition-all duration-300 ${isHovering ? 'shadow-sm' : ''}`}>
        <img 
          src={datonLogo} 
          alt="Daton" 
          className={`transition-all duration-300 ${collapsed ? "w-8 h-8" : "w-24 h-8"} ${isHovering ? 'brightness-110' : ''}`} 
        />
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {/* Quick Search - Only visible when expanded */}
        {!collapsed && (
          <div className="px-3 py-3 border-b animate-fade-in">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/50 border-muted-foreground/20 focus:border-primary transition-colors"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}


        {/* Favoritos */}
        {favorites.length > 0 && !collapsed && !searchQuery && (
          <SidebarGroup className="px-0 animate-fade-in">
            <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
              ⭐ FAVORITOS
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favorites.slice(0, 5).map((fav) => {
                  // Renderizar ícone original do módulo (não estrela)
                  const IconComponent = icons[fav.icon as keyof typeof icons] as React.ComponentType<{ className?: string }> || FileText
                  
                  return (
                    <SidebarMenuItem key={`fav-${fav.id}`} className="animate-fade-in">
                      <SidebarMenuButton 
                        onClick={() => navigate(fav.path)}
                        className="group transition-all duration-200 hover-scale"
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm">{fav.title}</span>
                        {!collapsed && (
                          <div
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200 hover-scale flex items-center justify-center ml-auto"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite({
                                id: fav.id,
                                title: fav.title,
                                path: fav.path,
                                icon: fav.icon
                              })
                            }}
                          >
                            <Star className="h-3 w-3 fill-current text-yellow-500 hover:text-yellow-600" />
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Search Results Info */}
        {searchQuery && filteredSections.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground animate-fade-in">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum resultado encontrado</p>
            <p className="text-xs mt-1">Tente outro termo de busca</p>
          </div>
        )}

        {/* Botão Início - Sempre visível no topo */}
        {!searchQuery && (
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => navigate('/dashboard')}
                    className={`group transition-all duration-200 hover-scale px-4 ${
                      isActive('/dashboard') ? 'bg-primary/10 text-primary font-medium' : ''
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    {!collapsed && <span className="text-sm font-normal">Início</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Seções principais */}
        {filteredSections.map((section) => (
          <div key={section.id} className="animate-fade-in">
            {section.hasDivider && !searchQuery && (
              <div className="mx-4 my-4 border-t border-border"></div>
            )}
            
            {section.isCollapsible && !searchQuery ? (
              <Collapsible 
                defaultOpen={section.defaultOpen || searchQuery.length > 0}
                open={searchQuery.length > 0 ? true : expandedSections[section.id]}
                onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, [section.id]: open }))}
              >
                <SidebarGroup className="px-0">
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-all duration-200 flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        {section.icon && <section.icon className="h-4 w-4" />}
                        <span>{section.title}</span>
                      </div>
                      {!collapsed && (
                        <ChevronRight className={`h-3 w-3 transition-all duration-200 group-hover:text-foreground ${expandedSections[section.id] || searchQuery ? 'rotate-90' : ''}`} />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="transition-all duration-200">
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {section.items.map((item) => renderMenuItem(item, true))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ) : (
              <SidebarGroup className="px-0">
                <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                  {section.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => renderMenuItem(item, true))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}