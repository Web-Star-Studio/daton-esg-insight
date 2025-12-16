import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Star, StarOff, ChevronRight, Search, X, Zap } from "lucide-react"
import * as icons from "lucide-react"
import { Input } from "@/components/ui/input"
import { BadgeNotification, StatusIndicator } from "@/components/ui/badge-notification"
import { useNotificationCounts } from "@/hooks/useNotificationCounts"
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
import { cn } from "@/lib/utils"

// Importações de ícones organizadas por categoria
import {
  LayoutDashboard, BarChart3, TrendingUp, PieChart, Activity, Monitor,
  Leaf, CloudRain, Users, Shield, Eye, Heart, Scale,
  Award, CheckSquare, AlertTriangle, Target, ClipboardCheck,
  FileText, Upload, Database, Building, FileSpreadsheet, Layers, Folder, HardDrive,
  Users2, UserCheck, UserCog, GraduationCap, Briefcase, Calendar,
  FileBarChart, FileCheck, BookOpen, TrendingDown, CheckCircle, ShieldCheck,
  Settings, Bell, Clock, Building2, MapPin,
  Brain, ShoppingCart, Truck, BarChart, FlaskConical, Sparkles, Package, Flag, 
  Recycle, Gavel, Trash2, CloudUpload, Wand2, Workflow, BookMarked, Handshake,
  FolderKanban, DollarSign, HelpCircle, Droplets, Cloud, Crown, FolderTree
} from "lucide-react"

// Zone colors mapping for industrial visual
const ZONE_COLORS: Record<string, { border: string; bg: string; code: string }> = {
  home: { border: "border-l-industrial-green", bg: "bg-industrial-green/10", code: "ZN-00" },
  esg: { border: "border-l-industrial-yellow", bg: "bg-industrial-yellow/10", code: "ZN-01" },
  financial: { border: "border-l-industrial-cyan", bg: "bg-industrial-cyan/10", code: "ZN-02" },
  sgq: { border: "border-l-industrial-orange", bg: "bg-industrial-orange/10", code: "ZN-03" },
  suppliers: { border: "border-l-industrial-purple", bg: "bg-industrial-purple/10", code: "ZN-04" },
  "data-reports": { border: "border-l-industrial-cyan", bg: "bg-industrial-cyan/10", code: "ZN-05" },
  settings: { border: "border-l-industrial-steel", bg: "bg-industrial-steel/10", code: "ZN-06" },
  "platform-admin": { border: "border-l-industrial-orange", bg: "bg-industrial-orange/10", code: "ZN-07" },
  help: { border: "border-l-sidebar-foreground/30", bg: "bg-sidebar-foreground/5", code: "ZN-08" },
}

// Interface definitions
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

// Menu sections definition (keeping original structure)
const menuSections: MenuSection[] = [
  {
    id: "home",
    title: "INÍCIO",
    items: [
      { id: "dashboard", title: "Painel Principal", icon: LayoutDashboard, path: "/dashboard", description: "Visão geral do sistema ESG" },
      { id: "performance", title: "Análise de Desempenho", icon: TrendingUp, path: "/desempenho", description: "Monitoramento de KPIs ESG" }
    ]
  },
  {
    id: "esg",
    title: "ESG",
    isCollapsible: true,
    defaultOpen: true,
    items: [
      { id: "esg-management", title: "Painel de Gestão ESG", icon: Leaf, path: "/gestao-esg", description: "Central de gestão ESG" },
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
      { id: "financial-dashboard", title: "Dashboard Financeiro", icon: icons.DollarSign, path: "/financeiro/dashboard", description: "Visão consolidada das finanças" },
      { id: "chart-of-accounts", title: "Plano de Contas", icon: icons.DollarSign, path: "/financeiro/plano-contas", description: "Estrutura contábil da empresa" },
      { id: "accounting-entries", title: "Lançamentos Contábeis", icon: icons.DollarSign, path: "/financeiro/lancamentos-contabeis", description: "Registro de operações contábeis" },
      { id: "accounts-payable", title: "Contas a Pagar", icon: icons.DollarSign, path: "/financeiro/contas-pagar", description: "Gestão de obrigações financeiras" },
      { id: "accounts-receivable", title: "Contas a Receber", icon: TrendingUp, path: "/financeiro/contas-receber", description: "Gestão de recebíveis" },
      { id: "financial-approvals", title: "Aprovações", icon: icons.CheckCircle, path: "/financeiro/aprovacoes", description: "Aprovações financeiras pendentes" },
      { id: "esg-financial-dashboard", title: "Dashboard ESG", icon: icons.Activity, path: "/financeiro/esg-dashboard", description: "Integração Financeiro-ESG" },
      { id: "budget-management", title: "Gestão de Orçamento", icon: TrendingUp, path: "/financeiro/orcamento", description: "Planejamento e controle orçamentário" },
      { id: "cash-flow", title: "Fluxo de Caixa", icon: icons.DollarSign, path: "/financeiro/fluxo-caixa", description: "Controle de entradas e saídas" },
      { id: "cost-centers", title: "Centros de Custo", icon: Building2, path: "/financeiro/centros-custo", description: "Alocação de despesas por departamento" },
      { id: "financial-reports", title: "Relatórios Financeiros", icon: icons.DollarSign, path: "/financeiro/relatorios", description: "DRE e análises gerenciais" },
      { id: "profitability-analysis", title: "Análise de Rentabilidade", icon: TrendingUp, path: "/financeiro/rentabilidade", description: "ROI de projetos e categorias" },
      { id: "waste-payables", title: "Contas a Pagar - Resíduos", icon: icons.DollarSign, path: "/financeiro/residuos/contas-a-pagar", description: "Gestão financeira de pagamentos de resíduos" },
      { id: "waste-receivables", title: "Contas a Receber - Resíduos", icon: TrendingUp, path: "/financeiro/residuos/contas-a-receber", description: "Receitas com venda de recicláveis" }
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
      { id: "strategic-planning", title: "Planejamento Estratégico", icon: Target, path: "/planejamento-estrategico", description: "Definição de estratégias organizacionais" },
      { id: "process-mapping", title: "Mapeamento de Processos", icon: Workflow, path: "/mapeamento-processos", description: "Documentação e otimização de processos" },
      { id: "non-conformities", title: "Não Conformidades", icon: AlertTriangle, path: "/nao-conformidades", description: "Gestão de não conformidades e ações corretivas" },
      { id: "corrective-actions", title: "Ações Corretivas", icon: CheckSquare, path: "/acoes-corretivas", description: "Planos de ação e melhorias" },
      { id: "document-control", title: "Controle de Documentos", icon: FileText, path: "/controle-documentos", description: "Versionamento e controle documental" },
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
          { id: "supplier-types", title: "Tipos de Fornecedor", icon: Layers, path: "/fornecedores/tipos", description: "Categorização de fornecedores" }
        ]
      },
      { id: "supplier-connections", title: "Conexões", icon: Handshake, path: "/fornecedores/conexoes", description: "Vínculos entre fornecedores" },
      { id: "supplier-evaluations", title: "Avaliações", icon: CheckSquare, path: "/fornecedores/avaliacoes", description: "Avaliação de documentos e qualificação" }
    ]
  },
  {
    id: "data-reports",
    title: "DADOS E RELATÓRIOS",
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
    hasDivider: true,
    items: [
      { id: "organization-config", title: "Configuração da Organização", icon: Building, path: "/configuracao-organizacional", description: "Dados e estrutura organizacional" },
      { id: "factor-library", title: "Biblioteca de Fatores", icon: FlaskConical, path: "/biblioteca-fatores", description: "Fatores de emissão e conversão" },
      { id: "custom-forms", title: "Formulários Customizados", icon: ClipboardCheck, path: "/formularios-customizados", description: "Criação de formulários personalizados" },
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
    items: [
      { id: "faq", title: "Perguntas Frequentes", icon: HelpCircle, path: "/faq", description: "Central de ajuda e dúvidas comuns" }
    ]
  }
]

// LED Indicator Component
const LedIndicator = ({ status }: { status: 'active' | 'warning' | 'danger' | null }) => {
  if (!status) return null
  
  const statusClasses = {
    active: "led-active",
    warning: "led-warning",
    danger: "led-danger"
  }
  
  return <div className={cn("led-indicator", statusClasses[status])} />
}

// Zone Badge Component
const ZoneBadge = ({ code }: { code: string }) => (
  <span className="zone-code">{code}</span>
)

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
    'environmental-category': true,
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

  const getNotificationCount = (itemId: string): number => {
    if (!notificationCounts) return 0
    const countMap: Record<string, number> = {
      'environmental-licensing': notificationCounts.licenses_expiring,
      'audits': notificationCounts.pending_audits,
      'non-conformities': notificationCounts.open_non_conformities,
      'training-management': notificationCounts.pending_trainings,
    }
    return countMap[itemId] || 0
  }

  const getStatusIndicator = (itemId: string): 'active' | 'warning' | 'danger' | null => {
    const count = getNotificationCount(itemId)
    if (itemId === 'environmental-licensing' && count > 0) {
      return count > 5 ? 'danger' : 'warning'
    }
    if (itemId === 'non-conformities' && count > 0) {
      return 'warning'
    }
    return null
  }

  const renderSubMenuItem = (item: MenuItem, isParentActive: boolean) => {
    const active = isActive(item.path)
    const isFav = isFavorite(item.id)

    return (
      <SidebarMenuSubItem key={item.id}>
        <SidebarMenuSubButton
          onClick={() => navigate(item.path)}
          className={cn(
            "group cursor-pointer font-industrial text-xs transition-all duration-150",
            active 
              ? "bg-primary/15 text-primary border-l-2 border-primary" 
              : "hover:bg-sidebar-accent/80 border-l-2 border-transparent hover:border-sidebar-foreground/20"
          )}
        >
          <NavigationTooltip title={item.title} description={item.description} disabled={false}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="industrial-button p-1">
                <item.icon className="h-3 w-3 flex-shrink-0" />
              </div>
              {!collapsed && <span className="truncate flex-1 min-w-0">{item.title}</span>}
            </div>
          </NavigationTooltip>
          
          {!collapsed && (
            <div
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity flex items-center justify-center"
              onClick={(e) => handleFavoriteToggle(item, e)}
            >
              {isFav ? <Star className="h-2.5 w-2.5 fill-current text-industrial-yellow" /> : <StarOff className="h-2.5 w-2.5 text-sidebar-foreground/40 hover:text-sidebar-foreground" />}
            </div>
          )}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  const renderMenuItem = (item: MenuItem) => {
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
                className={cn(
                  "group font-industrial transition-all duration-150",
                  isCategory 
                    ? "zone-header py-2"
                    : active || hasActiveSubItem 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-sidebar-accent/80"
                )}
              >
                <NavigationTooltip title={item.title} description={item.description} disabled={!collapsed}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "industrial-button p-1.5 relative",
                      (active || hasActiveSubItem) && "active"
                    )}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {statusIndicator && (
                        <div className="absolute -top-1 -right-1">
                          <LedIndicator status={statusIndicator} />
                        </div>
                      )}
                    </div>
                    {!collapsed && <span className="text-sm font-medium truncate">{item.title}</span>}
                  </div>
                </NavigationTooltip>
                
                <div className="flex items-center gap-1.5">
                  {!collapsed && notificationCount > 0 && (
                    <BadgeNotification 
                      count={notificationCount}
                      variant={notificationCount > 5 ? 'destructive' : 'warning'}
                      className="font-mono text-[10px]"
                    />
                  )}
                  {!collapsed && (
                    <div
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity flex items-center justify-center"
                      onClick={(e) => handleFavoriteToggle(item, e)}
                    >
                      {isFav ? <Star className="h-3 w-3 fill-current text-industrial-yellow" /> : <StarOff className="h-3 w-3 text-sidebar-foreground/40 hover:text-sidebar-foreground" />}
                    </div>
                  )}
                  {!collapsed && (
                    <ChevronRight className={cn(
                      "h-3 w-3 transition-transform duration-150",
                      isExpanded && "rotate-90"
                    )} />
                  )}
                </div>
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-industrial-slide">
              <SidebarMenuSub className={cn(
                "ml-4 pl-2",
                isCategory && "border-l border-sidebar-border"
              )}>
                {item.subItems?.map(subItem => 
                  subItem.subItems && subItem.subItems.length > 0 
                    ? renderMenuItem(subItem)
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
          className={cn(
            "group font-industrial transition-all duration-150",
            active 
              ? "bg-primary/10 text-primary" 
              : "hover:bg-sidebar-accent/80"
          )}
        >
          <NavigationTooltip title={item.title} description={item.description} disabled={!collapsed}>
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                "industrial-button p-1.5 relative",
                active && "active"
              )}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {statusIndicator && (
                  <div className="absolute -top-1 -right-1">
                    <LedIndicator status={statusIndicator} />
                  </div>
                )}
              </div>
              {!collapsed && <span className="text-sm font-medium truncate">{item.title}</span>}
            </div>
          </NavigationTooltip>
          
          {!collapsed && notificationCount > 0 && (
            <BadgeNotification 
              count={notificationCount}
              variant={notificationCount > 5 ? 'destructive' : 'warning'}
              className="font-mono text-[10px]"
            />
          )}
          
          {!collapsed && (
            <div
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity flex items-center justify-center"
              onClick={(e) => handleFavoriteToggle(item, e)}
            >
              {isFav ? <Star className="h-3 w-3 fill-current text-industrial-yellow" /> : <StarOff className="h-3 w-3 text-sidebar-foreground/40 hover:text-sidebar-foreground" />}
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    if (!searchQuery.trim()) return items
    
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase())
      if (matchesSearch) return true
      if (item.subItems) {
        return item.subItems.some(subItem => 
          subItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          subItem.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      return false
    })
  }

  const filteredSections = searchQuery.trim() 
    ? menuSections
        .filter(section => isPlatformAdmin || section.id !== 'platform-admin')
        .map(section => ({
          ...section,
          items: filterMenuItems(section.items)
        }))
        .filter(section => section.items.length > 0)
    : menuSections.filter(section => isPlatformAdmin || section.id !== 'platform-admin')

  return (
    <Sidebar 
      className="border-r border-sidebar-border bg-sidebar metal-texture transition-all duration-200" 
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      data-tour="sidebar"
    >
      {/* Industrial Header */}
      <SidebarHeader className={cn(
        "p-4 border-b border-sidebar-border transition-all duration-200",
        isHovering && "bg-sidebar-accent/30"
      )}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={datonLogo} 
              alt="Daton" 
              className={cn(
                "transition-all duration-200",
                collapsed ? "w-8 h-8" : "w-24 h-8"
              )} 
            />
          </div>
          {!collapsed && (
            <div className="flex items-center gap-1.5">
              <div className="led-indicator led-active" />
              <span className="font-mono text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Online</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {/* Industrial Search Terminal */}
        {!collapsed && (
          <div className="px-3 py-3 border-b border-sidebar-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40" />
              <Input
                type="text"
                placeholder="> BUSCAR MÓDULO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="industrial-input pl-8 h-9 text-xs"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-sidebar-accent"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Quick Access Zone - Favoritos */}
        {favorites.length > 0 && !collapsed && !searchQuery && (
          <SidebarGroup className="px-0 border-b border-sidebar-border">
            <SidebarGroupLabel className="px-4 py-2 flex items-center gap-2">
              <Zap className="h-3 w-3 text-industrial-yellow" />
              <span className="zone-header">ACESSO RÁPIDO</span>
              <ZoneBadge code="FAV" />
            </SidebarGroupLabel>
            <SidebarGroupContent className="caution-stripe py-1">
              <SidebarMenu>
                {favorites.slice(0, 5).map((fav) => {
                  const IconComponent = icons[fav.icon as keyof typeof icons] as React.ComponentType<{ className?: string }> || FileText
                  
                  return (
                    <SidebarMenuItem key={`fav-${fav.id}`}>
                      <SidebarMenuButton 
                        onClick={() => navigate(fav.path)}
                        className="group font-industrial transition-all duration-150 hover:bg-sidebar-accent/80"
                      >
                        <div className="industrial-button p-1.5">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{fav.title}</span>
                        {!collapsed && (
                          <div
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity flex items-center justify-center ml-auto"
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
                            <Star className="h-3 w-3 fill-current text-industrial-yellow" />
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
          <div className="px-4 py-8 text-center text-sm text-sidebar-foreground/60">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-mono text-xs">NENHUM RESULTADO</p>
            <p className="text-[10px] mt-1 font-industrial">Tente outro termo</p>
          </div>
        )}

        {/* Operational Zones - Main Sections */}
        {filteredSections.map((section) => {
          const zoneConfig = ZONE_COLORS[section.id] || ZONE_COLORS.help
          
          return (
            <div key={section.id}>
              {section.hasDivider && !searchQuery && (
                <div className="mx-4 my-3 border-t border-dashed border-sidebar-border" />
              )}
              
              {section.isCollapsible && !searchQuery ? (
                <Collapsible 
                  defaultOpen={section.defaultOpen || searchQuery.length > 0}
                  open={searchQuery.length > 0 ? true : expandedSections[section.id]}
                  onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, [section.id]: open }))}
                >
                  <SidebarGroup className={cn("px-0", zoneConfig.border, "border-l-2 ml-2")}>
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel className="px-3 py-2 cursor-pointer hover:bg-sidebar-accent/50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          {section.icon && (
                            <div className="industrial-button p-1">
                              <section.icon className="h-3 w-3" />
                            </div>
                          )}
                          <span className="zone-header">{section.title}</span>
                          <ZoneBadge code={zoneConfig.code} />
                        </div>
                        {!collapsed && (
                          <ChevronRight className={cn(
                            "h-3 w-3 transition-transform duration-150 text-sidebar-foreground/40 group-hover:text-sidebar-foreground",
                            (expandedSections[section.id] || searchQuery) && "rotate-90"
                          )} />
                        )}
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="animate-industrial-slide">
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {section.items.map((item) => renderMenuItem(item))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              ) : (
                <SidebarGroup className={cn("px-0", zoneConfig.border, "border-l-2 ml-2")}>
                  <SidebarGroupLabel className="px-3 py-2 flex items-center gap-2">
                    <span className="zone-header">{section.title}</span>
                    <ZoneBadge code={zoneConfig.code} />
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => renderMenuItem(item))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </div>
          )
        })}
      </SidebarContent>
    </Sidebar>
  )
}
