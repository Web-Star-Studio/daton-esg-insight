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

// Nova estrutura ESG reorganizada
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
}

const menuSections: MenuSection[] = [
  {
    id: "home",
    title: "INÍCIO",
    items: [
      { id: "dashboard", title: "Painel Principal", icon: LayoutDashboard, path: "/dashboard", description: "Visão geral do sistema ESG" },
      { id: "performance", title: "Análise de Desempenho", icon: TrendingUp, path: "/desempenho", description: "Monitoramento de KPIs" }
    ]
  },
  {
    id: "strategy-esg",
    title: "ESTRATÉGIA ESG",
    items: [
      { id: "esg-management", title: "Painel de Gestão ESG", icon: Leaf, path: "/gestao-esg", description: "Central ESG" },
      { id: "materiality-analysis", title: "Análise de Materialidade", icon: Eye, path: "/analise-materialidade", description: "Temas ESG relevantes" },
      { id: "stakeholder-management", title: "Gestão de Stakeholders", icon: Users, path: "/gestao-stakeholders", description: "Partes interessadas" },
      { id: "targets", title: "Metas", icon: Target, path: "/metas", description: "Metas de sustentabilidade" }
    ]
  },
  {
    id: "environmental",
    title: "AMBIENTAL (E)",
    items: [
      {
        id: "emissions",
        title: "Emissões de GEE",
        icon: Zap,
        path: "/emissoes",
        description: "Gestão de gases de efeito estufa",
        subItems: [
          { id: "ghg-dashboard", title: "Dashboard GHG", icon: BarChart3, path: "/dashboard-ghg", description: "Painel de emissões" },
          { id: "ghg-inventory", title: "Inventário", icon: FileBarChart, path: "/inventario-gee", description: "Inventário de emissões" },
          { id: "carbon-projects", title: "Projetos de Carbono", icon: Leaf, path: "/projetos-carbono", description: "Projetos de redução" }
        ]
      },
      { id: "waste-management", title: "Gestão de Resíduos", icon: Trash2, path: "/residuos", description: "Controle de resíduos" },
      { id: "licensing", title: "Licenciamento", icon: Gavel, path: "/licenciamento", description: "Licenças ambientais" }
    ]
  }
]

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  
  const currentPath = location.pathname
  const isActive = (path: string) => currentPath === path

  const handleFavoriteToggle = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite({
      id: item.id,
      title: item.title,
      path: item.path,
      icon: 'FileText'
    })
  }

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.path)
    const isFav = isFavorite(item.id)

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => navigate(item.path)}
          className={`group ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"}`}
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
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => handleFavoriteToggle(item, e)}
            >
              {isFav ? <Star className="h-3 w-3 fill-current text-yellow-500" /> : <StarOff className="h-3 w-3" />}
            </Button>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar className="border-r bg-sidebar">
      <SidebarHeader className="p-4 border-b">
        <img src={datonLogo} alt="Daton" className={collapsed ? "w-8 h-8" : "w-24 h-8"} />
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
                    onClick={() => {
                      // Navigate to onboarding or show restart dialog
                      const shouldRestart = confirm('Deseja reiniciar o guia de configuração inicial?');
                      if (shouldRestart) {
                        localStorage.removeItem('daton_onboarding_progress');
                        window.location.href = '/';
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
          <SidebarGroup key={section.id} className="px-0">
            <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => renderMenuItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}