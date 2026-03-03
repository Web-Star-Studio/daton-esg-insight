import { useState } from "react"
import { User, Settings, LogOut, Crown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { EnhancedGlobalSearch } from "@/components/navigation/EnhancedGlobalSearch"
import { NotificationCenter } from "@/components/notifications/NotificationCenter"
import { TourTriggerButton } from "@/components/tutorial/unified/TourTriggerButton"
import { ContextualHelp } from "@/components/ContextualHelp"
import { ChatAssistant } from "@/components/tools/ChatAssistant"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/hooks/usePermissions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isPlatformAdmin } = usePermissions()
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
      navigate("/auth")
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar sair. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const handleProfileClick = () => {
    navigate("/configuracao")
  }

  const handleSettingsClick = () => {
    navigate("/configuracao")
  }

  // Função para gerar iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <header className="mx-3 mt-3 flex items-center justify-between rounded-2xl border border-border/60 bg-background/85 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_18px_36px_-30px_rgba(15,23,42,0.55)] backdrop-blur-md sm:mx-4 sm:px-4 md:mx-6 md:mt-4 md:px-5 md:py-3">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarTrigger className="h-10 w-10 rounded-xl hover:bg-muted/55" />
        
        <div className="hidden sm:block">
          <EnhancedGlobalSearch />
        </div>
      </div>

      <div className="flex items-center gap-2" data-notifications>
        <ContextualHelp />
        <NotificationCenter />
        
        <TourTriggerButton />

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChatOpen(prev => !prev)}
            aria-label="Assistente IA"
            className="rounded-xl hover:bg-muted/55"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
          <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-xl hover:bg-muted/55" data-profile>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user ? getInitials(user.full_name || user.email) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium">
                  {user?.full_name || user?.email || "Carregando..."}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user?.company?.name || "Carregando..."}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleProfileClick}
              className="cursor-pointer hover:bg-muted"
            >
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleSettingsClick}
              className="cursor-pointer hover:bg-muted"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            {isPlatformAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate("/platform-admin")}
                  className="cursor-pointer hover:bg-muted"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Platform Admin
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive cursor-pointer hover:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja sair? Você precisará fazer login novamente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleLogout}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sair
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
