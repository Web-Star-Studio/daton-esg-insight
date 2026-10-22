import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PainelRedirectGuard } from "@/components/PainelRedirectGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";

// Páginas institucionais (lazy)
const Contato = lazy(() => import("./pages/Contato"));
const SobreNos = lazy(() => import("./pages/SobreNos"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));
const Seguranca = lazy(() => import("./pages/Seguranca"));
const ESGAmbiental = lazy(() => import("./pages/ESGAmbiental"));
const ESGSocial = lazy(() => import("./pages/ESGSocial"));
const ESGGovernanca = lazy(() => import("./pages/ESGGovernanca"));
const Funcionalidades = lazy(() => import("./pages/Funcionalidades"));
const Documentacao = lazy(() => import("./pages/Documentacao"));

const PageFallback = (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

/**
 * Este projeto é apenas a landing page institucional da Daton.
 * O sistema (v2) vive em https://painel.daton.com.br — qualquer rota
 * fora da LP é redirecionada para lá pelo PainelRedirectGuard.
 */
function App() {
  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={PageFallback}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/contato" element={<Contato />} />
                  <Route path="/sobre-nos" element={<SobreNos />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/privacidade" element={<Privacidade />} />
                  <Route path="/termos" element={<Termos />} />
                  <Route path="/seguranca" element={<Seguranca />} />
                  <Route path="/ambiental" element={<ESGAmbiental />} />
                  <Route path="/social" element={<ESGSocial />} />
                  <Route path="/governanca" element={<ESGGovernanca />} />
                  <Route path="/funcionalidades" element={<Funcionalidades />} />
                  <Route path="/documentacao" element={<Documentacao />} />

                  {/* Qualquer outra rota (sistema antigo) → painel externo */}
                  <Route
                    path="*"
                    element={
                      <PainelRedirectGuard>
                        {PageFallback}
                      </PainelRedirectGuard>
                    }
                  />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
