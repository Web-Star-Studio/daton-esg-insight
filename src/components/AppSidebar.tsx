import { useNavigate, useLocation } from "react-router-dom"
import { 
  LayoutDashboard, 
  FlaskConical, 
  Sparkles, 
  Package, 
  BarChart3, 
  Flag, 
  Recycle, 
  Briefcase, 
  Gavel, 
  Trash2, 
  HardDrive, 
  TrendingUp, 
  CloudUpload, 
  FileText, 
  Folder, 
  BookOpen, 
  FileBarChart, 
  CheckCircle, 
  ShieldCheck, 
  Settings, 
  Wand2, 
  ShoppingCart
} from "lucide-react"
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
  useSidebar
} from "@/components/ui/sidebar"
import datonLogo from "@/assets/daton-logo-header.png"

interface MenuItem {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  path: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    title: "ANÁLISE GERAL",
    items: [
      { id: "painel", title: "Painel", icon: LayoutDashboard, path: "/dashboard" },
      { id: "gestao-esg", title: "Gestão ESG", icon: Briefcase, path: "/gestao-esg" },
      { id: "simulador", title: "Simulador Eco Impacto", icon: FlaskConical, path: "/simulador" },
      
      { id: "ia-insights", title: "IA & Insights", icon: Sparkles, path: "/ia-insights" },
      { id: "marketplace", title: "Marketplace ESG", icon: ShoppingCart, path: "/marketplace" },
      { id: "desempenho", title: "Desempenho", icon: TrendingUp, path: "/desempenho" },
    ]
  },
  {
    title: "EMISSÕES",
    items: [
      { id: "dashboard-ghg", title: "Dashboard GHG", icon: BarChart3, path: "/dashboard-ghg" },
      { id: "inventario-gee", title: "Inventário GEE", icon: Package, path: "/inventario-gee" },
      { id: "projetos-carbono", title: "Projetos de Carbono", icon: Recycle, path: "/projetos-carbono" },
      { id: "metas", title: "Metas", icon: Flag, path: "/metas" },
    ]
  },
  {
    title: "AMBIENTAL",
    items: [
      { id: "licenciamento", title: "Licenciamento", icon: Gavel, path: "/licenciamento" },
      { id: "residuos", title: "Resíduos", icon: Trash2, path: "/residuos" },
    ]
  },
  {
    title: "DADOS E DOCUMENTOS",
    items: [
      { id: "coleta-dados", title: "Coleta de Dados", icon: CloudUpload, path: "/coleta-dados" },
      { id: "formularios", title: "Formulários Customizados", icon: FileText, path: "/formularios-customizados" },
      { id: "documentos", title: "Documentos", icon: Folder, path: "/documentos" },
      { id: "reconciliacao-documentos", title: "Reconciliação IA", icon: Wand2, path: "/reconciliacao-documentos" },
      { id: "biblioteca-fatores", title: "Biblioteca de Fatores", icon: BookOpen, path: "/biblioteca-fatores" },
      { id: "ativos", title: "Ativos", icon: HardDrive, path: "/ativos" },
    ]
  },
  {
    title: "RELATÓRIOS E COMPLIANCE",
    items: [
      { id: "relatorios", title: "Relatórios", icon: FileBarChart, path: "/relatorios" },
      { id: "auditoria", title: "Auditoria", icon: CheckCircle, path: "/auditoria" },
      { id: "compliance", title: "Compliance", icon: ShieldCheck, path: "/compliance" },
    ]
  },
  {
    title: "CONFIGURAÇÕES",
    items: [
      { id: "configuracao", title: "Configuração", icon: Settings, path: "/configuracao" },
    ]
  }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const navigate = useNavigate()
  const location = useLocation()
  
  // Determinar item ativo baseado na rota atual
  const getActiveItem = () => {
    const currentPath = location.pathname
    for (const section of menuSections) {
      for (const item of section.items) {
        if (item.path === currentPath) {
          return item.id
        }
      }
    }
    return "painel" // default
  }
  
  const activeItem = getActiveItem()

  const handleItemClick = (item: MenuItem) => {
    navigate(item.path)
  }

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-64"} border-r border-border/40 bg-background`}>
      <SidebarHeader className="p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <img 
              src={datonLogo} 
              alt="Daton" 
              className={`${isCollapsed ? "w-8 h-8" : "w-24 h-8"} object-contain`}
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        {menuSections.map((section, sectionIndex) => (
          <SidebarGroup key={sectionIndex} className="mb-6">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 mb-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm
                        ${activeItem === item.id 
                          ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary' 
                          : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
                        }
                        ${isCollapsed ? 'justify-center px-2' : 'justify-start'}
                      `}
                    >
                      <item.icon className={`${isCollapsed ? "w-5 h-5" : "w-4 h-4"} flex-shrink-0`} />
                      {!isCollapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}