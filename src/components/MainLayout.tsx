import { useAuth } from "@/contexts/AuthContext"
import { AppSidebar } from "@/components/AppSidebar"
import { AppHeader } from "@/components/AppHeader"
import { EnhancedAIAssistant } from "@/components/EnhancedAIAssistant"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TutorialProvider } from "@/contexts/TutorialContext"
import { InteractiveTour } from "@/components/tutorial/InteractiveTour"
import { TutorialAssistant } from "@/components/tutorial/TutorialAssistant"
import { UnifiedHelpCenter } from "@/components/tutorial/UnifiedHelpCenter"
import { OnboardingMain } from "@/components/onboarding/OnboardingMain"
import { CleanOnboardingMain } from "@/components/onboarding/CleanOnboardingMain"

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
        <UnifiedHelpCenter />
        <InteractiveTour />
        <TutorialAssistant />
      </SidebarProvider>
    </TutorialProvider>
  )
}