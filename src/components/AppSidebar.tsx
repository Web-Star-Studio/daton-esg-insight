import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Star, StarOff, ChevronRight } from "lucide-react"
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
import datonLogo from "@/assets/daton-logo-header.png"

// Importações de ícones organizadas por categoria
import {
  LayoutDashboard, BarChart3, TrendingUp, PieChart, Activity, Monitor,
  Leaf, CloudRain, Users, Shield, Eye, Heart, Scale,
  Award, CheckSquare, AlertTriangle, Target, Search, ClipboardCheck,
  FileText, Upload, Database, Building, FileSpreadsheet, Layers, Folder, HardDrive,
  Users2, UserCheck, UserCog, GraduationCap, Briefcase, Calendar,
  FileBarChart, FileCheck, BookOpen, TrendingDown, CheckCircle, ShieldCheck,
  Settings, Bell, Clock, Building2, MapPin,
  Brain, ShoppingCart, Zap, Truck, BarChart, FlaskConical, Sparkles, Package, Flag, 
  Recycle, Gavel, Trash2, CloudUpload, Wand2, Workflow, BookMarked, Handshake,
  FolderKanban, DollarSign
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
  items: MenuItem[]
  isCollapsible?: boolean
  defaultOpen?: boolean
  hasDivider?: boolean
}

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
    id: "strategy-esg",
    title: "ESTRATÉGIA ESG",
    items: [
      { id: "esg-management", title: "Painel de Gestão ESG", icon: Leaf, path: "/gestao-esg", description: "Central de gestão ESG" },
      { id: "materiality-analysis", title: "Análise de Materialidade", icon: Eye, path: "/analise-materialidade", description: "Identificação de temas ESG relevantes" },
      { id: "stakeholder-management", title: "Gestão de Stakeholders", icon: Handshake, path: "/gestao-stakeholders", description: "Gestão de partes interessadas" },
      { id: "sustainability-targets", title: "Metas de Sustentabilidade", icon: Target, path: "/metas-sustentabilidade", description: "Definição e acompanhamento de metas" }
    ]
  },
  {
    id: "environmental",
    title: "AMBIENTAL (E)",
    items: [
      {
        id: "emissions",
        title: "Emissões de GEE",
        icon: CloudRain,
        path: "/emissoes",
        description: "Gestão de gases de efeito estufa",
        subItems: [
          { id: "ghg-dashboard", title: "Dashboard GHG", icon: BarChart3, path: "/dashboard-ghg", description: "Painel de monitoramento de emissões" },
          { id: "ghg-inventory", title: "Inventário de Emissões", icon: FileBarChart, path: "/inventario-gee", description: "Controle completo do inventário GEE" },
          { id: "carbon-projects", title: "Projetos de Carbono", icon: Leaf, path: "/projetos-carbono", description: "Gestão de projetos de redução" }
        ]
      },
      { id: "waste-management", title: "Gestão de Resíduos", icon: Recycle, path: "/residuos", description: "Controle e destinação de resíduos" },
      { id: "environmental-licensing", title: "Licenciamento Ambiental", icon: Gavel, path: "/licenciamento", description: "Gestão de licenças ambientais" }
    ]
  },
  {
    id: "social",
    title: "SOCIAL (S)",
    items: [
      { id: "social-dashboard", title: "Dashboard Social", icon: Users, path: "/social-esg", description: "Visão geral consolidada dos aspectos sociais" },
      { id: "employee-management", title: "Gestão de Funcionários", icon: UserCheck, path: "/gestao-funcionarios", description: "Gestão completa de recursos humanos" },
      { id: "health-safety", title: "Segurança do Trabalho", icon: Heart, path: "/seguranca-trabalho", description: "SST e bem-estar dos colaboradores" },
      { id: "training-management", title: "Treinamentos", icon: GraduationCap, path: "/gestao-treinamentos", description: "Gestão de capacitação e treinamentos" },
      { id: "career-development", title: "Desenvolvimento de Carreira", icon: TrendingUp, path: "/desenvolvimento-carreira", description: "PDIs, mentoria e crescimento profissional" }
    ]
  },
  {
    id: "governance",
    title: "GOVERNANÇA (G)",
    items: [
      { id: "governance-panel", title: "Painel de Governança", icon: Shield, path: "/painel-governanca", description: "Visão geral da governança corporativa" },
      { id: "risk-management", title: "Gestão de Riscos", icon: AlertTriangle, path: "/gestao-riscos", description: "Identificação e mitigação de riscos" },
      { id: "compliance-policies", title: "Compliance e Políticas", icon: Scale, path: "/compliance", description: "Conformidade regulatória e políticas" },
      { id: "audits", title: "Auditorias", icon: CheckCircle, path: "/auditorias", description: "Gestão de auditorias internas e externas" }
    ]
  },
  {
    id: "sgq",
    title: "GESTÃO DA QUALIDADE (SGQ)",
    isCollapsible: true,
    defaultOpen: false,
    items: [
      { id: "sgq-dashboard", title: "Dashboard SGQ", icon: Award, path: "/sgq-dashboard", description: "Painel de gestão da qualidade" },
      { id: "strategic-planning", title: "Planejamento Estratégico", icon: Target, path: "/planejamento-estrategico", description: "Definição de estratégias organizacionais" },
      { id: "process-mapping", title: "Mapeamento de Processos", icon: Workflow, path: "/mapeamento-processos", description: "Documentação e otimização de processos" },
      { id: "non-conformities", title: "Não Conformidades", icon: AlertTriangle, path: "/nao-conformidades", description: "Gestão de não conformidades e ações corretivas" },
      { id: "internal-audits", title: "Auditorias Internas", icon: Search, path: "/auditorias-internas", description: "Auditorias do sistema de qualidade" },
      { id: "corrective-actions", title: "Ações Corretivas", icon: CheckSquare, path: "/acoes-corretivas", description: "Planos de ação e melhorias" },
      { id: "document-control", title: "Controle de Documentos", icon: FileText, path: "/controle-documentos", description: "Versionamento e controle documental" },
      { id: "supplier-evaluation", title: "Avaliação de Fornecedores", icon: Users2, path: "/avaliacao-fornecedores", description: "Qualificação e monitoramento de fornecedores" }
    ]
  },
  {
    id: "data-center",
    title: "CENTRAL DE DADOS",
    items: [
      { id: "data-collection", title: "Coleta de Dados", icon: Database, path: "/coleta-dados", description: "Importação e gestão de dados ESG" },
      { id: "documents", title: "Documentos", icon: Folder, path: "/documentos", description: "Biblioteca de documentos e arquivos" },
      { id: "assets", title: "Ativos", icon: Building2, path: "/ativos", description: "Gestão de ativos da organização" },
      { id: "ai-reconciliation", title: "Reconciliação IA", icon: Brain, path: "/reconciliacao-ia", description: "Reconciliação inteligente de dados" }
    ]
  },
  {
    id: "reports",
    title: "RELATÓRIOS E DIVULGAÇÃO",
    items: [
      { id: "report-generator", title: "Gerador de Relatórios", icon: FileText, path: "/gerador-relatorios", description: "Criação personalizada de relatórios" },
      { id: "integrated-reports", title: "Relatórios Integrados", icon: BookMarked, path: "/relatorios-integrados", description: "Relatórios ESG completos e integrados" },
      { id: "esg-marketplace", title: "Marketplace ESG", icon: ShoppingCart, path: "/marketplace-esg", description: "Plataforma de soluções ESG" }
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
      { id: "user-management", title: "Gestão de Usuários", icon: UserCog, path: "/gestao-usuarios", description: "Controle de usuários e permissões" }
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [isHovering, setIsHovering] = useState(false)
  
  const currentPath = location.pathname
  const isActive = (path: string) => currentPath === path

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

  const renderSubMenuItem = (item: MenuItem, isParentActive: boolean) => {
    const active = isActive(item.path)
    const isFav = isFavorite(item.id)

    return (
      <SidebarMenuSubItem key={item.id}>
        <SidebarMenuSubButton
          onClick={() => navigate(item.path)}
          className={`group ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"}`}
        >
          <NavigationTooltip
            title={item.title}
            description={item.description}
            disabled={!collapsed}
          >
            <div className="flex items-center gap-3 flex-1">
              <item.icon className="h-3 w-3 flex-shrink-0" />
              {!collapsed && <span className="text-xs truncate">{item.title}</span>}
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

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.path)
    const isFav = isFavorite(item.id)
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isExpanded = expandedSections[item.id] || false
    const hasActiveSubItem = item.subItems?.some(subItem => isActive(subItem.path)) || false

    if (hasSubItems) {
      return (
        <Collapsible key={item.id} open={isExpanded} onOpenChange={() => toggleSection(item.id)}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className={`group ${active || hasActiveSubItem ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"}`}
              >
                <NavigationTooltip
                  title={item.title}
                  description={item.description}
                  disabled={!collapsed}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium truncate">{item.title}</span>}
                  </div>
                </NavigationTooltip>
                
                <div className="flex items-center gap-1">
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
              <SidebarMenuSub>
                {item.subItems?.map(subItem => renderSubMenuItem(subItem, active || hasActiveSubItem))}
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
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium truncate">{item.title}</span>}
            </div>
          </NavigationTooltip>
          
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
        {/* Configuração Inicial */}
        <SidebarGroup>
          <SidebarGroupLabel>Configuração Inicial</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={async () => {
                      const shouldRestart = confirm('Deseja reiniciar o guia de configuração inicial? Isso permitirá que você passe novamente pelo processo de setup.');
                      if (shouldRestart) {
                        await restartOnboarding();
                      }
                    }}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span>Guia de Configuração</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Favoritos */}
        {favorites.length > 0 && !collapsed && (
          <SidebarGroup className="px-0">
            <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
              ⭐ FAVORITOS
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favorites.slice(0, 5).map((fav) => (
                  <SidebarMenuItem key={`fav-${fav.id}`}>
                    <SidebarMenuButton onClick={() => navigate(fav.path)}>
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      <span className="text-sm">{fav.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Seções principais */}
        {menuSections.map((section) => (
          <div key={section.id}>
            {section.hasDivider && (
              <div className="mx-4 my-4 border-t border-border"></div>
            )}
            
            {section.isCollapsible ? (
              <Collapsible 
                defaultOpen={section.defaultOpen}
                onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, [section.id]: open }))}
              >
                <SidebarGroup className="px-0">
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground transition-colors flex items-center justify-between">
                      <span>{section.title}</span>
                      {!collapsed && (
                        <ChevronRight className={`h-3 w-3 transition-transform ${expandedSections[section.id] ? 'rotate-90' : ''}`} />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {section.items.map((item) => renderMenuItem(item))}
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
                    {section.items.map((item) => renderMenuItem(item))}
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