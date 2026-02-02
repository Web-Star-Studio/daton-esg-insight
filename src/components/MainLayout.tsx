import { useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AppSidebar } from "@/components/AppSidebar"
import { AppHeader } from "@/components/AppHeader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TutorialProvider } from "@/contexts/TutorialContext"
import { UnifiedTourProvider } from "@/contexts/UnifiedTourContext"
import { CleanOnboardingMain } from "@/components/onboarding/CleanOnboardingMain"
import { UnifiedTourSystem } from "@/components/tutorial/unified/UnifiedTourSystem"
import { ProfessionalModalProvider } from "@/components/ui/professional-modal-manager"
import { ChatAssistant } from "@/components/tools/ChatAssistant"
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs"
import { useDocumentProcessingNotifications } from "@/hooks/useDocumentProcessingNotifications"
import { useAutoRetryProcessor } from "@/hooks/useAutoRetryProcessor"
import { logger } from "@/utils/logger"
import { SkipLinks } from "@/components/SkipLinks"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { shouldShowOnboarding, isLoading, user } = useAuth();
  
  // Ativar notificações de processamento de documentos em tempo real
  useDocumentProcessingNotifications();
  
  // Ativar processamento automático de retries para jobs que falharam
  useAutoRetryProcessor();
  
  // Use ref to prevent excessive re-logging
  const lastLoggedRef = useRef<string | null>(null);
  
  // Force check if onboarding should be shown on mount
  useEffect(() => {
    if (user?.id && !isLoading) {
      const logKey = `${user.id}-${shouldShowOnboarding}`;
      if (lastLoggedRef.current !== logKey) {
        logger.debug('MainLayout: Checking onboarding status', 'ui', {
          shouldShowOnboarding,
          userId: user.id
        });
        lastLoggedRef.current = logKey;
      }
    }
  }, [user?.id, isLoading, shouldShowOnboarding]);

  // Failsafe: Prevents permanently blocked body scroll
  useEffect(() => {
    const checkScroll = () => {
      const bodyOverflow = document.body.style.overflow;
      const isChatExpanded = document.querySelector('[data-chat-expanded="true"]');
      
      // If body is blocked but chat is not expanded, fix it
      if (bodyOverflow === 'hidden' && !isChatExpanded) {
        logger.warn('Body scroll was blocked unexpectedly, fixing', 'ui');
        document.body.style.overflow = '';
      }
    };
    
    const interval = setInterval(checkScroll, 2000);
    
    return () => clearInterval(interval);
  }, []);

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
              {/* Accessibility: Skip links for keyboard navigation */}
              <SkipLinks />
              
              <div className="min-h-screen flex w-full bg-background" data-sidebar>
                <nav id="navigation" aria-label="Navegação principal">
                  <AppSidebar />
                </nav>
                
                <div className="flex-1 flex flex-col min-w-0">
                  <AppHeader />
                  
                  <main id="main-content" className="flex-1 p-3 sm:p-4 md:p-6 bg-muted/10">
                    <Breadcrumbs />
                    {children}
                  </main>
                </div>
              </div>
              
              {/* Unified Tour System - Sistema consolidado de tours */}
              <UnifiedTourSystem />
              
              {/* AI Chat Assistant - Global floating chat */}
              <ChatAssistant />
            </SidebarProvider>
          </ProfessionalModalProvider>
        )}
      </UnifiedTourProvider>
    </TutorialProvider>
  )
}