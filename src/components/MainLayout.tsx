import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AppSidebar } from "@/components/AppSidebar"
import { AppHeader } from "@/components/AppHeader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TutorialProvider } from "@/contexts/TutorialContext"
import { UnifiedTourProvider } from "@/contexts/UnifiedTourContext"
import { CleanOnboardingMain } from "@/components/onboarding/CleanOnboardingMain"
import { UnifiedToolHub } from "@/components/tools/UnifiedToolHub"
import { UnifiedTourSystem } from "@/components/tutorial/unified/UnifiedTourSystem"
import { ProfessionalModalProvider } from "@/components/ui/professional-modal-manager"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { shouldShowOnboarding, isLoading, user } = useAuth();
  
  // Force check if onboarding should be shown on mount
  useEffect(() => {
    if (user?.id && !isLoading) {
      console.log('🔍 MainLayout: Checking onboarding status...', {
        shouldShowOnboarding,
        userId: user.id
      });
    }
  }, [user?.id, isLoading, shouldShowOnboarding]);

  return (
    <TutorialProvider>
      <UnifiedTourProvider>
        {/* Show loading while checking auth status */}
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          </div>
        ) : shouldShowOnboarding ? (
          /* Show onboarding flow for first-time users */
          <CleanOnboardingMain />
        ) : (
          /* Main application layout */
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
              
              {/* Unified Tour System - Sistema consolidado de tours */}
              <UnifiedTourSystem />
            </SidebarProvider>
          </ProfessionalModalProvider>
        )}
      </UnifiedTourProvider>
    </TutorialProvider>
  )
}