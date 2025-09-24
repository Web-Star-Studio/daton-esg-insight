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
import { GerenciamentoProjetos } from "./pages/GerenciamentoProjetos";
import EstruturaOrganizacional from "./pages/EstruturaOrganizacional";
import GestaoFuncionarios from "./pages/GestaoFuncionarios";
import GestaoTreinamentos from "./pages/GestaoTreinamentos";
import GestaoDesempenho from "./pages/GestaoDesempenho";
import BeneficiosRemuneracao from "./pages/BeneficiosRemuneracao";
import Recrutamento from "./pages/Recrutamento";
import SeguracaTrabalho from "./pages/SeguracaTrabalho";

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
            
            {/* Simulador moved to protected routes */}
            
            {/* Rotas protegidas - agrupadas sob um único MainLayout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/inventario-gee" element={
              <ProtectedRoute>
                <InventarioGEE />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-ghg" element={
              <ProtectedRoute>
                <DashboardGHG />
              </ProtectedRoute>
            } />
            <Route path="/licenciamento" element={
              <ProtectedRoute>
                <Licenciamento />
              </ProtectedRoute>
            } />
            <Route path="/licenciamento/processar" element={
              <ProtectedRoute>
                <ProcessarLicenca />
              </ProtectedRoute>
            } />
            {/* Legacy redirects for backward compatibility */}
            <Route path="/licenciamento/analise" element={<Navigate to="/licenciamento/processar" replace />} />
            <Route path="/licenciamento/nova" element={<Navigate to="/licenciamento/novo" replace />} />
            <Route path="/licenciamento/:id/analise" element={<Navigate to="/licenciamento/processar" replace />} />
            <Route path="/licenciamento/novo" element={
              <ProtectedRoute requiredRole="Editor">
                <LicenseForm />
              </ProtectedRoute>
            } />
            <Route path="/licenciamento/:id" element={
              <ProtectedRoute>
                <LicenseDetails />
              </ProtectedRoute>
            } />
            <Route path="/licenciamento/:id/editar" element={
              <ProtectedRoute requiredRole="Editor">
                <LicenseForm />
              </ProtectedRoute>
            } />
            <Route path="/residuos" element={
              <ProtectedRoute>
                <Residuos />
              </ProtectedRoute>
            } />
            <Route path="/fornecedores-residuos" element={
              <ProtectedRoute requiredRole="Editor">
                <FornecedoresResiduos />
              </ProtectedRoute>
            } />
            <Route path="/metas" element={
              <ProtectedRoute>
                <Metas />
              </ProtectedRoute>
            } />
            <Route path="/metas/nova" element={
              <ProtectedRoute requiredRole="Editor">
                <CriarMeta />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <Relatorios />
              </ProtectedRoute>
            } />
            <Route path="/relatorios-sustentabilidade" element={
              <ProtectedRoute>
                <RelatoriosSustentabilidade />
              </ProtectedRoute>
            } />
            <Route path="/biblioteca-fatores" element={
              <ProtectedRoute>
                <BibliotecaFatores />
              </ProtectedRoute>
            } />
            <Route path="/projetos-carbono" element={
              <ProtectedRoute>
                <ProjetosCarbono />
              </ProtectedRoute>
            } />
            <Route path="/projetos-carbono/registrar-atividade" element={
              <ProtectedRoute requiredRole="Editor">
                <RegistrarAtividadeConservacao />
              </ProtectedRoute>
            } />
            <Route path="/gestao-esg" element={
              <ProtectedRoute>
                <GestaoESG />
              </ProtectedRoute>
            } />
            <Route path="/ativos" element={
              <ProtectedRoute>
                <Ativos />
              </ProtectedRoute>
            } />
            <Route path="/desempenho" element={
              <ProtectedRoute>
                <Desempenho />
              </ProtectedRoute>
            } />
            <Route path="/configuracao" element={
              <ProtectedRoute requiredRole="Admin">
                <Configuracao />
              </ProtectedRoute>
            } />
            <Route path="/ia-insights" element={
              <ProtectedRoute>
                <IAInsights />
              </ProtectedRoute>
            } />
            <Route path="/marketplace" element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            } />
            <Route path="/coleta-dados" element={
              <ProtectedRoute>
                <ColetaDados />
              </ProtectedRoute>
            } />
            <Route path="/formularios-customizados" element={
              <ProtectedRoute>
                <FormulariosCustomizados />
              </ProtectedRoute>
            } />
            <Route path="/documentos" element={
              <ProtectedRoute>
                <Documentos />
              </ProtectedRoute>
            } />
            <Route path="/reconciliacao-documentos" element={
              <ProtectedRoute>
                <ReconciliacaoDocumentos />
              </ProtectedRoute>
            } />
            <Route path="/auditoria" element={
              <ProtectedRoute>
                <Auditoria />
              </ProtectedRoute>
            } />
            <Route path="/compliance" element={
              <ProtectedRoute>
                <Compliance />
              </ProtectedRoute>
            } />
            <Route path="/gestao-stakeholders" element={
              <ProtectedRoute>
                <GestaoStakeholders />
              </ProtectedRoute>
            } />
            <Route path="/smart-notifications" element={
              <ProtectedRoute>
                <SmartNotificationSystem />
              </ProtectedRoute>
            } />
            <Route path="/intelligent-alerts" element={
              <ProtectedRoute>
                <IntelligentAlertsSystem />
              </ProtectedRoute>
            } />
            <Route path="/advanced-reports" element={
              <ProtectedRoute>
                <AdvancedReportingSystem />
              </ProtectedRoute>
            } />
            <Route path="/analise-materialidade" element={
              <ProtectedRoute>
                <AnaliseMaterialidade />
              </ProtectedRoute>
            } />
            <Route path="/configuracao-organizacional" element={
              <ProtectedRoute>
                <ConfiguracaoOrganizacional />
              </ProtectedRoute>
            } />
            <Route path="/social-esg" element={
              <ProtectedRoute>
                <SocialESG />
              </ProtectedRoute>
            } />
            <Route path="/governanca-esg" element={
              <ProtectedRoute>
                <GovernancaESG />
              </ProtectedRoute>
            } />
            <Route path="/relatorios-integrados" element={
              <ProtectedRoute>
                <RelatoriosIntegrados />
              </ProtectedRoute>
            } />
            <Route path="/planejamento-estrategico" element={
              <ProtectedRoute>
                <PlanejamentoEstrategico />
              </ProtectedRoute>
            } />
            <Route path="/mapeamento-processos" element={
              <ProtectedRoute>
                <MapeamentoProcessos />
              </ProtectedRoute>
            } />
            <Route path="/gestao-riscos" element={
              <ProtectedRoute>
                <GestaoRiscos />
              </ProtectedRoute>
            } />
            <Route path="/nao-conformidades" element={
              <ProtectedRoute>
                <NaoConformidades />
              </ProtectedRoute>
            } />
            <Route path="/plano-acao-5w2h" element={
              <ProtectedRoute>
                <PlanoAcao5W2H />
              </ProtectedRoute>
            } />
            <Route path="/base-conhecimento" element={
              <ProtectedRoute>
                <BaseConhecimento />
              </ProtectedRoute>
            } />
            <Route path="/gestao-fornecedores" element={
              <ProtectedRoute>
                <GestaoFornecedores />
              </ProtectedRoute>
            } />
            <Route path="/quality-dashboard" element={
              <ProtectedRoute>
                <QualityDashboard />
              </ProtectedRoute>
            } />
          <Route path="/gerenciamento-projetos" element={
            <ProtectedRoute>
              <GerenciamentoProjetos />
            </ProtectedRoute>
          } />
          <Route path="/estrutura-organizacional" element={
            <ProtectedRoute>
              <EstruturaOrganizacional />
            </ProtectedRoute>
          } />
          <Route path="/gestao-funcionarios" element={
            <ProtectedRoute>
              <GestaoFuncionarios />
            </ProtectedRoute>
          } />
          <Route path="/gestao-treinamentos" element={
            <ProtectedRoute>
              <GestaoTreinamentos />
            </ProtectedRoute>
          } />
          <Route path="/gestao-desempenho" element={
            <ProtectedRoute>
              <GestaoDesempenho />
            </ProtectedRoute>
          } />
          <Route path="/beneficios-remuneracao" element={
            <ProtectedRoute>
              <BeneficiosRemuneracao />
            </ProtectedRoute>
          } />
          <Route path="/recrutamento" element={
            <ProtectedRoute>
              <Recrutamento />
            </ProtectedRoute>
          } />
          <Route path="/seguranca-trabalho" element={
            <ProtectedRoute>
              <SeguracaTrabalho />
            </ProtectedRoute>
          } />
            <Route path="/simulador" element={
              <ProtectedRoute>
                <SimuladorEcoImpacto />
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
