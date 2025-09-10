import { 
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import datonLogo from "@/assets/daton-logo.png"

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
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

      <SidebarContent className="p-4">
        {/* Menu items serão adicionados nas próximas iterações */}
        <div className="text-sidebar-foreground/60 text-sm">
          {isCollapsed ? "•••" : "Menu em desenvolvimento"}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}