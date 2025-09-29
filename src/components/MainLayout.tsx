import { useAuth } from "@/contexts/AuthContext"
import { AppSidebar } from "@/components/AppSidebar"
import { AppHeader } from "@/components/AppHeader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TutorialProvider } from "@/contexts/TutorialContext"
import { CleanOnboardingMain } from "@/components/onboarding/CleanOnboardingMain"
import { UnifiedToolHub } from "@/components/tools/UnifiedToolHub"
import { SmartInteractiveTour } from "@/components/tutorial/SmartInteractiveTour"
import { ProfessionalModalProvider } from "@/components/ui/professional-modal-manager"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { shouldShowOnboarding } = useAuth();

  // Show onboarding flow for first-time users
  if (shouldShowOnboarding) {
    return (
      <TutorialProvider>
        <CleanOnboardingMain />
      </TutorialProvider>
    );
  }

  return (
    <TutorialProvider>
      <ProfessionalModalProvider>
        <SidebarProvider defaultOpen={true}>
          <div className="min-h-screen flex w-full bg-background" data-sidebar>
            <AppSidebar />
            
            <div className="flex-1 flex flex-col min-w-0">
              <AppHeader />
              
              <main className="flex-1 p-6 bg-muted/10">
                {children}
              </main>
            </div>
          </div>
          
          {/* Unified Tool Hub - Single entry point for all tools */}
          <UnifiedToolHub />
          
          {/* Smart Interactive Tour - Intelligent guided tour system */}
          <SmartInteractiveTour />
        </SidebarProvider>
      </ProfessionalModalProvider>
    </TutorialProvider>
  )
}