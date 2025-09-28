import { useAuth } from "@/contexts/AuthContext"
import { AppSidebar } from "@/components/AppSidebar"
import { AppHeader } from "@/components/AppHeader"
import { EnhancedAIAssistant } from "@/components/EnhancedAIAssistant"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TutorialProvider } from "@/contexts/TutorialContext"
import { OnboardingWizard } from "@/components/tutorial/OnboardingWizard"
import { InteractiveTour } from "@/components/tutorial/InteractiveTour"
import { TutorialAssistant } from "@/components/tutorial/TutorialAssistant"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <TutorialProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          
          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader />
            
            <main className="flex-1 p-6 bg-muted/20">
              {children}
            </main>
          </div>
          
          <EnhancedAIAssistant />
        </div>
        
        {/* Tutorial Components */}
        <OnboardingWizard />
        <InteractiveTour />
        <TutorialAssistant />
      </SidebarProvider>
    </TutorialProvider>
  )
}