import { Search, Bell, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppHeader() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
      {/* Trigger da sidebar e busca */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        
        <div className="relative w-96 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Buscar relatórios, métricas, empresas..." 
            className="pl-10 bg-muted/50 border-muted-foreground/20 focus-visible:ring-accent"
          />
        </div>
      </div>

      {/* Ações do usuário */}
      <div className="flex items-center gap-3">
        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></div>
        </Button>

        {/* Avatar do usuário */}
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">João Silva</p>
            <p className="text-xs text-muted-foreground">ESG Manager</p>
          </div>
        </div>
      </div>
    </header>
  )
}