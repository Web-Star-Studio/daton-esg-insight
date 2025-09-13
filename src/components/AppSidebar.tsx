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
  Wand2
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
import datonLogo from "@/assets/daton-logo.png"

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
      { id: "painel", title: "Painel", icon: LayoutDashboard, path: "/" },
      { id: "simulador", title: "Simulador Eco Impacto", icon: FlaskConical, path: "/simulador" },
      { id: "ia-insights", title: "IA & Insights", icon: Sparkles, path: "/ia-insights" },
    ]
  },
  {
    title: "GESTÃO DE GEE",
    items: [
      { id: "inventario-gee", title: "Inventário GEE", icon: Package, path: "/inventario-gee" },
      { id: "dashboard-ghg", title: "Dashboard GHG", icon: BarChart3, path: "/dashboard-ghg" },
      { id: "metas", title: "Metas", icon: Flag, path: "/metas" },
      { id: "projetos-carbono", title: "Projetos de Carbono", icon: Recycle, path: "/projetos-carbono" },
    ]
  },
  {
    title: "ESG E SUSTENTABILIDADE",
    items: [
      { id: "gestao-esg", title: "Gestão ESG", icon: Briefcase, path: "/gestao-esg" },
      { id: "licenciamento", title: "Licenciamento", icon: Gavel, path: "/licenciamento" },
      { id: "residuos", title: "Resíduos", icon: Trash2, path: "/residuos" },
      { id: "ativos", title: "Ativos", icon: HardDrive, path: "/ativos" },
      { id: "desempenho", title: "Desempenho", icon: TrendingUp, path: "/desempenho" },
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
    <Sidebar className={isCollapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <img 
              src={datonLogo} 
              alt="Daton" 
              className="w-6 h-6 object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sidebar-primary text-lg font-semibold">
                Daton
              </span>
              <span className="text-sidebar-foreground/60 text-xs">
                ESG Platform
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {menuSections.map((section, sectionIndex) => (
          <SidebarGroup key={sectionIndex} className="mb-4">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-3 py-2">
                {section.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                        ${activeItem === item.id 
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        }
                        ${isCollapsed ? 'justify-center' : 'justify-start'}
                      `}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="text-sm truncate">{item.title}</span>
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