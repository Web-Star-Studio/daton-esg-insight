import { useState } from "react"
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
  Settings 
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
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const menuSections: MenuSection[] = [
  {
    title: "ANÁLISE GERAL",
    items: [
      { id: "painel", title: "Painel", icon: LayoutDashboard },
      { id: "simulador", title: "Simulador Eco Impacto", icon: FlaskConical },
      { id: "ia-insights", title: "IA & Insights", icon: Sparkles },
    ]
  },
  {
    title: "GESTÃO DE GEE",
    items: [
      { id: "inventario-gee", title: "Inventário GEE", icon: Package },
      { id: "dashboard-ghg", title: "Dashboard GHG", icon: BarChart3 },
      { id: "metas", title: "Metas", icon: Flag },
      { id: "projetos-carbono", title: "Projetos de Carbono", icon: Recycle },
    ]
  },
  {
    title: "ESG E SUSTENTABILIDADE",
    items: [
      { id: "gestao-esg", title: "Gestão ESG", icon: Briefcase },
      { id: "licenciamento", title: "Licenciamento", icon: Gavel },
      { id: "residuos", title: "Resíduos", icon: Trash2 },
      { id: "ativos", title: "Ativos", icon: HardDrive },
      { id: "desempenho", title: "Desempenho", icon: TrendingUp },
    ]
  },
  {
    title: "DADOS E DOCUMENTOS",
    items: [
      { id: "coleta-dados", title: "Coleta de Dados", icon: CloudUpload },
      { id: "formularios", title: "Formulários", icon: FileText },
      { id: "documentos", title: "Documentos", icon: Folder },
      { id: "biblioteca-fatores", title: "Biblioteca de Fatores", icon: BookOpen },
    ]
  },
  {
    title: "RELATÓRIOS E COMPLIANCE",
    items: [
      { id: "relatorios", title: "Relatórios", icon: FileBarChart },
      { id: "auditoria", title: "Auditoria", icon: CheckCircle },
      { id: "compliance", title: "Compliance", icon: ShieldCheck },
    ]
  },
  {
    title: "CONFIGURAÇÕES",
    items: [
      { id: "configuracao", title: "Configuração", icon: Settings },
    ]
  }
]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const [activeItem, setActiveItem] = useState("painel")

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId)
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
                      onClick={() => handleItemClick(item.id)}
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