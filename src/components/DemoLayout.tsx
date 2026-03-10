import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/AppHeader";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { Info } from "lucide-react";
import { DemoDataSeeder } from "@/components/DemoDataSeeder";
import { DemoBlockedModal } from "@/components/DemoBlockedModal";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { UnifiedTourProvider } from "@/contexts/UnifiedTourContext";
import { UnifiedTourSystem } from "@/components/tutorial/unified/UnifiedTourSystem";

export function DemoLayout() {
  return (
    <DemoDataSeeder>
      <TutorialProvider>
        <UnifiedTourProvider>
          <SidebarProvider defaultOpen={true}>
            <div className="min-h-screen flex w-full bg-background" data-sidebar>
              <nav aria-label="Navegação principal">
                <AppSidebar />
              </nav>

              <div className="flex-1 flex flex-col min-w-0">
                <AppHeader />

                {/* Banner demo */}
                <div className="mx-3 mt-3 sm:mx-4 md:mx-6 md:mt-4 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-primary shadow-sm">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <span>
                      Sua conta está <strong>aguardando aprovação</strong> do administrador.
                    </span>
                  </div>
                  <span className="text-primary/80 sm:ml-auto text-xs sm:text-sm">Enquanto isso, explore a plataforma em modo demonstrativo.</span>
                </div>

                <main id="main-content" className="flex-1 p-3 sm:p-4 md:p-6 bg-muted/10">
                  <Breadcrumbs />
                  <Outlet />
                </main>
              </div>
            </div>
            <UnifiedTourSystem />
            <DemoBlockedModal />
          </SidebarProvider>
        </UnifiedTourProvider>
      </TutorialProvider>
    </DemoDataSeeder>
  );
}
