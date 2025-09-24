import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/MainLayout";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import Contato from "./pages/Contato";
import Funcionalidades from "./pages/Funcionalidades";
import Documentacao from "./pages/Documentacao";
import Index from "./pages/Index";
import InventarioGEE from "./pages/InventarioGEE";
import DashboardGHG from "./pages/DashboardGHG";
import Licenciamento from "./pages/Licenciamento";
import LicenseDetails from "./pages/LicenseDetails";
import LicenseForm from "@/pages/LicenseForm";
import ProcessarLicenca from "./pages/ProcessarLicenca";
import Residuos from "./pages/Residuos";
import RegistrarDestinacao from "./pages/RegistrarDestinacao";
import Metas from "./pages/Metas";
import CriarMeta from "./pages/CriarMeta";
import Relatorios from "./pages/Relatorios";
import BibliotecaFatores from "./pages/BibliotecaFatores";
import ProjetosCarbono from "./pages/ProjetosCarbono";
import RegistrarAtividadeConservacao from "./pages/RegistrarAtividadeConservacao";
import FornecedoresResiduos from "./pages/FornecedoresResiduos";
// Backward-compat alias to avoid runtime errors from stale references
const RegistrarCreditosCarbono = RegistrarAtividadeConservacao;
import Ativos from "./pages/Ativos";
import Desempenho from "./pages/Desempenho";
import Configuracao from "./pages/Configuracao";
import { SimuladorEcoImpacto } from "./pages/SimuladorEcoImpacto";

import IAInsights from "./pages/IAInsights";
import Marketplace from "./pages/Marketplace";
import GestaoESG from "./pages/GestaoESG";
import ColetaDados from "./pages/ColetaDados";
import FormulariosCustomizados from "./pages/FormulariosCustomizados";
import PublicForm from "./pages/PublicForm";
import Documentos from "./pages/Documentos";
import { ReconciliacaoDocumentos } from "./pages/ReconciliacaoDocumentos";

import TestExtraction from "./pages/TestExtraction";
import Auditoria from "./pages/Auditoria";
import Compliance from "./pages/Compliance";
import NotFound from "./pages/NotFound";

import RelatoriosSustentabilidade from "./pages/RelatoriosSustentabilidade";

// Novos módulos de materialidade e stakeholders
import { SmartNotificationSystem } from "@/components/SmartNotificationSystem";
import { IntelligentAlertsSystem } from "@/components/IntelligentAlertsSystem";
import { AdvancedReportingSystem } from "@/components/AdvancedReportingSystem";
import GestaoStakeholders from "./pages/GestaoStakeholders";
import AnaliseMaterialidade from "./pages/AnaliseMaterialidade";
import ConfiguracaoOrganizacional from "./pages/ConfiguracaoOrganizacional";

// Novos módulos ESG completos
import SocialESG from "./pages/SocialESG";
import GovernancaESG from "./pages/GovernancaESG";
import RelatoriosIntegrados from "./pages/RelatoriosIntegrados";

// SGQ (Sistema de Gestão da Qualidade) modules
import PlanejamentoEstrategico from "./pages/PlanejamentoEstrategico";
import MapeamentoProcessos from "./pages/MapeamentoProcessos";
import GestaoRiscos from "./pages/GestaoRiscos";
import NaoConformidades from "./pages/NaoConformidades";
import PlanoAcao5W2H from "./pages/PlanoAcao5W2H";
import BaseConhecimento from "./pages/BaseConhecimento";
import GestaoFornecedores from "./pages/GestaoFornecedores";
import QualityDashboard from "./pages/QualityDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing Page - público */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Rota de autenticação - pública */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Contato - público */}
            <Route path="/contato" element={<Contato />} />
            
            {/* Funcionalidades - público */}
            <Route path="/funcionalidades" element={<Funcionalidades />} />
            
            {/* Documentação - público */}
            <Route path="/documentacao" element={<Documentacao />} />
            
            {/* Simulador - público */}
            <Route path="/simulador" element={<SimuladorEcoImpacto />} />
            
            {/* Dashboard principal - protegido */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainLayout>
                  <Index />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* Rotas protegidas */}
            <Route path="/inventario-gee" element={
              <ProtectedRoute>
                <MainLayout>
                  <InventarioGEE />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard-ghg" element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardGHG />
                </MainLayout>
              </ProtectedRoute>
            } />
            {/* Licenciamento Routes - Organizadas */}
            <Route path="/licenciamento" element={
              <ProtectedRoute>
                <MainLayout>
                  <Licenciamento />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/licenciamento/processar" element={
              <ProtectedRoute>
                <MainLayout>
                  <ProcessarLicenca />
                </MainLayout>
              </ProtectedRoute>
            } />
            {/* Legacy redirects for backward compatibility */}
            <Route path="/licenciamento/analise" element={<Navigate to="/licenciamento/processar" replace />} />
            <Route path="/licenciamento/nova" element={<Navigate to="/licenciamento/novo" replace />} />
            <Route path="/licenciamento/:id/analise" element={<Navigate to="/licenciamento/processar" replace />} />
            <Route path="/licenciamento/novo" element={
              <ProtectedRoute requiredRole="Editor">
                <MainLayout>
                  <LicenseForm />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/licenciamento/:id" element={
              <ProtectedRoute>
                <MainLayout>
                  <LicenseDetails />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/licenciamento/:id/editar" element={
              <ProtectedRoute requiredRole="Editor">
                <MainLayout>
                  <LicenseForm />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/residuos" element={
              <ProtectedRoute>
                <MainLayout>
                  <Residuos />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/fornecedores-residuos" element={
              <ProtectedRoute requiredRole="Editor">
                <MainLayout>
                  <FornecedoresResiduos />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/metas" element={
              <ProtectedRoute>
                <MainLayout>
                  <Metas />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/metas/nova" element={
              <ProtectedRoute requiredRole="Editor">
                <MainLayout>
                  <CriarMeta />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <MainLayout>
                  <Relatorios />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/relatorios-sustentabilidade" element={
              <ProtectedRoute>
                <MainLayout>
                  <RelatoriosSustentabilidade />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/biblioteca-fatores" element={
              <ProtectedRoute>
                <MainLayout>
                  <BibliotecaFatores />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/projetos-carbono" element={
              <ProtectedRoute>
                <MainLayout>
                  <ProjetosCarbono />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/projetos-carbono/registrar-atividade" element={
              <ProtectedRoute requiredRole="Editor">
                <MainLayout>
                  <RegistrarAtividadeConservacao />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/gestao-esg" element={
              <ProtectedRoute>
                <MainLayout>
                  <GestaoESG />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/ativos" element={
              <ProtectedRoute>
                <MainLayout>
                  <Ativos />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/desempenho" element={
              <ProtectedRoute>
                <MainLayout>
                  <Desempenho />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/configuracao" element={
              <ProtectedRoute requiredRole="Admin">
                <MainLayout>
                  <Configuracao />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/ia-insights" element={
              <ProtectedRoute>
                <MainLayout>
                  <IAInsights />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/marketplace" element={
              <ProtectedRoute>
                <MainLayout>
                  <Marketplace />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/coleta-dados" element={
              <ProtectedRoute>
                <MainLayout>
                  <ColetaDados />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/formularios-customizados" element={
              <ProtectedRoute>
                <MainLayout>
                  <FormulariosCustomizados />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/documentos" element={
              <ProtectedRoute>
                <MainLayout>
                  <Documentos />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/reconciliacao-documentos" element={
              <ProtectedRoute>
                <MainLayout>
                  <ReconciliacaoDocumentos />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/auditoria" element={
              <ProtectedRoute>
                <MainLayout>
                  <Auditoria />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/compliance" element={
              <ProtectedRoute>
                <MainLayout>
                  <Compliance />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/gestao-stakeholders" element={
              <ProtectedRoute>
                <MainLayout>
                  <GestaoStakeholders />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/smart-notifications" element={
              <ProtectedRoute>
                <MainLayout>
                  <SmartNotificationSystem />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/intelligent-alerts" element={
              <ProtectedRoute>
                <MainLayout>
                  <IntelligentAlertsSystem />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/advanced-reports" element={
              <ProtectedRoute>
                <MainLayout>
                  <AdvancedReportingSystem />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/analise-materialidade" element={
              <ProtectedRoute>
                <MainLayout>
                  <AnaliseMaterialidade />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/configuracao-organizacional" element={
              <ProtectedRoute>
                <MainLayout>
                  <ConfiguracaoOrganizacional />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/social-esg" element={
              <ProtectedRoute>
                <MainLayout>
                  <SocialESG />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/governanca-esg" element={
              <ProtectedRoute>
                <MainLayout>
                  <GovernancaESG />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/relatorios-integrados" element={
              <ProtectedRoute>
                <MainLayout>
                  <RelatoriosIntegrados />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* SGQ (Sistema de Gestão da Qualidade) Routes */}
            <Route path="/planejamento-estrategico" element={
              <ProtectedRoute>
                <MainLayout>
                  <PlanejamentoEstrategico />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/mapeamento-processos" element={
              <ProtectedRoute>
                <MainLayout>
                  <MapeamentoProcessos />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/gestao-riscos" element={
              <ProtectedRoute>
                <MainLayout>
                  <GestaoRiscos />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/nao-conformidades" element={
              <ProtectedRoute>
                <MainLayout>
                  <NaoConformidades />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/plano-acao-5w2h" element={
              <ProtectedRoute>
                <MainLayout>
                  <PlanoAcao5W2H />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/base-conhecimento" element={
              <ProtectedRoute>
                <MainLayout>
                  <BaseConhecimento />
                </MainLayout>
              </ProtectedRoute>
            } />
            
          <Route path="/gestao-fornecedores" element={
            <ProtectedRoute>
              <MainLayout>
                <GestaoFornecedores />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/quality-dashboard" element={
            <ProtectedRoute>
              <MainLayout>
                <QualityDashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Public form route - no authentication required */}
            <Route path="/form/:formId" element={<PublicForm />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
