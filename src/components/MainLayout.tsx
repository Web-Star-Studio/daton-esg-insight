import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { AppHeader } from "@/components/AppHeader"
import { ChatAssistant } from "@/components/ChatAssistant"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          
          <main className="flex-1 p-6 bg-muted/20">
            {children}
          </main>
        </div>
        
        <ChatAssistant />
      </div>
    </SidebarProvider>
  )
}