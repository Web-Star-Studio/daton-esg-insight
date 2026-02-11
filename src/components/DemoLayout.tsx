import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";
import datonLogo from "@/assets/daton-logo-header.png";

export function DemoLayout() {
  const navigate = useNavigate();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background" data-sidebar>
        <nav aria-label="Navegação principal">
          <AppSidebar />
        </nav>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Demo Header simplificado */}
          <header className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 md:py-4 bg-background border-b border-border/40">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger className="h-11 w-11 hover:bg-muted/50" />
              <img src={datonLogo} alt="Daton" className="w-24 h-8 hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/auth")}
                className="gap-2"
              >
                Criar conta gratuita
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Banner demo */}
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-2 text-sm text-primary">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              Você está na <strong>versão demonstrativa</strong>. Algumas funcionalidades estão desativadas.
            </span>
            <Button
              variant="link"
              size="sm"
              className="ml-auto text-primary p-0 h-auto"
              onClick={() => navigate("/auth")}
            >
              Criar conta →
            </Button>
          </div>

          <main id="main-content" className="flex-1 p-3 sm:p-4 md:p-6 bg-muted/10">
            <Breadcrumbs />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
