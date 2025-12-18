import React, { lazy, Suspense } from "react";
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ENABLED_MODULES } from "@/config/enabledModules";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/middleware/roleGuard";
import { LazyPageWrapper } from "@/components/LazyPageWrapper";
import { ProtectedLazyPageWrapper } from "@/components/ProtectedLazyPageWrapper";
import { SmartToastProvider } from "@/components/feedback/SmartToastProvider";
import { PageTransition } from "@/components/layout/PageTransition";
import { errorHandler } from "@/utils/errorHandler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import RouteValidator from "@/components/RouteValidator";
import { GlobalKeyboardShortcuts } from "@/components/GlobalKeyboardShortcuts";
import { useDocumentProcessingNotifications } from "@/hooks/useDocumentProcessingNotifications";

// Páginas críticas carregadas sincronamente
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import { OnboardingRoute } from "./routes/onboarding";

// Lazy loading para todas as outras páginas
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Contato = lazy(() => import("./pages/Contato"));
const Funcionalidades = lazy(() => import("./pages/Funcionalidades"));
const Documentacao = lazy(() => import("./pages/Documentacao"));
const FAQ = lazy(() => import("./pages/FAQ"));
const InventarioGEE = lazy(() => import("./pages/InventarioGEE"));
const DashboardGHG = lazy(() => import("./pages/DashboardGHG"));
const Licenciamento = lazy(() => import("./pages/Licenciamento"));
const LicenseDetails = lazy(() => import("./pages/LicenseDetails"));
const LicenseForm = lazy(() => import("./pages/LicenseForm"));
const LicenseMonitoring = lazy(() => import("./pages/LicenseMonitoring"));
const ProcessarLicenca = lazy(() => import("./pages/ProcessarLicenca"));

// Legislações - Subpáginas do Licenciamento
const LegislationsHub = lazy(() => import("./pages/LegislationsHub"));
const LegislationForm = lazy(() => import("./pages/LegislationForm"));
const LegislationDetail = lazy(() => import("./pages/LegislationDetail"));
const LegislationReports = lazy(() => import("./pages/LegislationReports"));
const LegislationComplianceProfiles = lazy(() => import("./pages/LegislationComplianceProfiles"));
const Residuos = lazy(() => import("./pages/Residuos"));
const RegistrarDestinacao = lazy(() => import("./pages/RegistrarDestinacao"));
const RelatoriosPGRS = lazy(() => import("./pages/RelatoriosPGRS"));
const Metas = lazy(() => import("./pages/Metas"));
const CriarMeta = lazy(() => import("./pages/CriarMeta"));

const BibliotecaFatores = lazy(() => import("./pages/BibliotecaFatores"));
const ProjetosCarbono = lazy(() => import("./pages/ProjetosCarbono"));
const RegistrarAtividadeConservacao = lazy(() => import("./pages/RegistrarAtividadeConservacao"));
const FornecedoresResiduos = lazy(() => import("./pages/FornecedoresResiduos"));
const FinanceiroResiduosContasAPagar = lazy(() => import("./pages/FinanceiroResiduosContasAPagar"));
const FinanceiroResiduosContasAReceber = lazy(() => import("./pages/FinanceiroResiduosContasAReceber"));
const DashboardFinanceiro = lazy(() => import("./pages/DashboardFinanceiro"));
const GestaoOrcamento = lazy(() => import("./pages/GestaoOrcamento"));
const FluxoCaixa = lazy(() => import("./pages/FluxoCaixa"));
const CentroCustos = lazy(() => import("./pages/CentroCustos"));
const RelatoriosFinanceiros = lazy(() => import("./pages/RelatoriosFinanceiros"));
const AnaliseRentabilidade = lazy(() => import("./pages/AnaliseRentabilidade"));
const PlanoContas = lazy(() => import("./pages/PlanoContas"));
const LancamentosContabeis = lazy(() => import("./pages/LancamentosContabeis"));
const ContasAPagar = lazy(() => import("./pages/ContasAPagar"));
const ContasAReceber = lazy(() => import("./pages/ContasAReceber"));
const AprovacoesFinanceiras = lazy(() => import("./pages/AprovacoesFinanceiras"));
const ESGFinancialDashboard = lazy(() => import("./pages/ESGFinancialDashboard"));
const Ativos = lazy(() => import("./pages/Ativos"));
const Desempenho = lazy(() => import("./pages/Desempenho"));
const Configuracao = lazy(() => import("./pages/Configuracao"));
const SimuladorEcoImpacto = lazy(() => import("./pages/SimuladorEcoImpacto").then(module => ({ default: module.SimuladorEcoImpacto })));
const IAInsights = lazy(() => import("./pages/IAInsights"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const GestaoESG = lazy(() => import("./pages/GestaoESG"));
const ColetaDados = lazy(() => import("./pages/ColetaDados"));
const FormulariosCustomizados = lazy(() => import("./pages/FormulariosCustomizados"));
const PublicForm = lazy(() => import("./pages/PublicForm"));
const DocumentosHub = lazy(() => import("./pages/DocumentosHub"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const AuditDetails = lazy(() => import("./pages/AuditDetails"));
const Compliance = lazy(() => import("./pages/Compliance"));

// Lazy loading para componentes de sistema
const SmartNotificationSystem = lazy(() => import("./components/SmartNotificationSystem").then(module => ({ default: module.SmartNotificationSystem })));
const IntelligentAlertsSystem = lazy(() => import("./components/IntelligentAlertsSystem").then(module => ({ default: module.IntelligentAlertsSystem })));
const AdvancedReportingSystem = lazy(() => import("./components/AdvancedReportingSystem").then(module => ({ default: module.AdvancedReportingSystem })));

// Lazy loading para módulos ESG e gestão
const GestaoStakeholders = lazy(() => import("./pages/GestaoStakeholders"));
const AnaliseMaterialidade = lazy(() => import("./pages/AnaliseMaterialidade"));
const ConfiguracaoOrganizacional = lazy(() => import("./pages/ConfiguracaoOrganizacional"));
const SocialESG = lazy(() => import("./pages/SocialESG"));
const GovernancaESG = lazy(() => import("./pages/GovernancaESG"));
const RelatoriosIntegrados = lazy(() => import("./pages/RelatoriosIntegrados"));
const ProductionMonitoring = lazy(() => import("./pages/ProductionMonitoring"));


// Lazy loading para SGQ modules
const PlanejamentoEstrategico = lazy(() => import("./pages/PlanejamentoEstrategico"));
const MapeamentoProcessos = lazy(() => import("./pages/MapeamentoProcessos"));
const GestaoRiscos = lazy(() => import("./pages/GestaoRiscos"));
const NaoConformidades = lazy(() => import("./pages/NaoConformidades"));
const PlanoAcao5W2H = lazy(() => import("./pages/PlanoAcao5W2H"));
const BaseConhecimento = lazy(() => import("./pages/BaseConhecimento"));
const GestaoFornecedores = lazy(() => import("./pages/GestaoFornecedores"));
const QualityDashboard = lazy(() => import("./pages/QualityDashboard"));
const GestaoIndicadores = lazy(() => import("./pages/GestaoIndicadores"));

const GerenciamentoProjetos = lazy(() => import("./pages/GerenciamentoProjetos").then(module => ({ default: module.GerenciamentoProjetos })));

const AcoesCorretivas = lazy(() => import("./pages/AcoesCorretivas"));
const ControleDocumentos = lazy(() => import("./pages/ControleDocumentos"));
const ExtracoesDocumentos = lazy(() => import("./pages/ExtracoesDocumentos"));

// Phase 5-8: Novas páginas ESG
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const IndicadoresESG = lazy(() => import("./pages/IndicadoresESG"));
const IndicadoresRecomendados = lazy(() => import("./pages/IndicadoresRecomendados"));
const Materialidade = lazy(() => import("./pages/Materialidade"));

// Supplier Management Module
const SupplierManagementDashboard = lazy(() => import("./pages/SupplierManagementDashboard"));
const RequiredDocuments = lazy(() => import("./pages/RequiredDocuments"));
const SupplierCategoriesPage = lazy(() => import("./pages/SupplierCategoriesPage"));
const SupplierTypesPage = lazy(() => import("./pages/SupplierTypesPage"));
const SupplierTrainingMaterialsPage = lazy(() => import("./pages/SupplierTrainingMaterialsPage"));
const DocumentTypeAssociationPage = lazy(() => import("./pages/DocumentTypeAssociationPage"));
const SupplierRegistration = lazy(() => import("./pages/SupplierRegistration"));
const SupplierAssignmentPage = lazy(() => import("./pages/SupplierAssignmentPage"));
const SupplierConnections = lazy(() => import("./pages/SupplierConnections"));
const SupplierEvaluations = lazy(() => import("./pages/SupplierEvaluations"));
const SupplierMandatoryReadingsPage = lazy(() => import("./pages/SupplierMandatoryReadingsPage"));
const SupplierSurveysManagementPage = lazy(() => import("./pages/SupplierSurveysManagementPage"));
const SupplierIndicatorsPage = lazy(() => import("./pages/SupplierIndicatorsPage"));
const SupplierImportExportPage = lazy(() => import("./pages/SupplierImportExportPage"));
const SupplierEvaluationCriteriaPage = lazy(() => import("./pages/SupplierEvaluationCriteriaPage"));
const SupplierFailuresPage = lazy(() => import("./pages/SupplierFailuresPage"));
const SupplierDeliveriesPage = lazy(() => import("./pages/SupplierDeliveriesPage"));

// Supplier Portal (External)
const SupplierLogin = lazy(() => import("./pages/supplier-portal/SupplierLogin"));
const SupplierChangePassword = lazy(() => import("./pages/supplier-portal/SupplierChangePassword"));
const SupplierDashboard = lazy(() => import("./pages/supplier-portal/SupplierDashboard"));
const SupplierTrainings = lazy(() => import("./pages/supplier-portal/SupplierTrainings"));
const SupplierTrainingDetail = lazy(() => import("./pages/supplier-portal/SupplierTrainingDetail"));
const SupplierReadings = lazy(() => import("./pages/supplier-portal/SupplierReadings"));
const SupplierSurveys = lazy(() => import("./pages/supplier-portal/SupplierSurveys"));

// Lazy loading para RH modules
const EstruturaOrganizacional = lazy(() => import("./pages/EstruturaOrganizacional"));
const DescricaoCargos = lazy(() => import("./pages/DescricaoCargos"));
const GestaoFuncionarios = lazy(() => import("./pages/GestaoFuncionarios"));
const GestaoTreinamentos = lazy(() => import("./pages/GestaoTreinamentos"));
const GestaoDesempenho = lazy(() => import("./pages/GestaoDesempenho"));
const BeneficiosRemuneracao = lazy(() => import("./pages/BeneficiosRemuneracao"));
const Recrutamento = lazy(() => import("./pages/Recrutamento"));
const SeguracaTrabalho = lazy(() => import("./pages/SeguracaTrabalho"));
const PontoFrequencia = lazy(() => import("./pages/PontoFrequencia"));
const DesenvolvimentoCarreira = lazy(() => import("./pages/DesenvolvimentoCarreira"));
const OuvidoriaClientes = lazy(() => import("./pages/OuvidoriaClientes"));

// Lazy loading para páginas de configuração
const GestaoUsuarios = lazy(() => import("./pages/GestaoUsuarios"));

// Lazy loading para Intelligence Center
const IntelligenceCenter = lazy(() => import("./pages/IntelligenceCenter"));
const SDGDashboard = lazy(() => import("./pages/SDGDashboard"));
const DatabaseDocumentation = lazy(() => import("./pages/DatabaseDocumentation"));

// Lazy loading para Monitoramento ESG (FASE 1)
const MonitoramentoESG = lazy(() => import("./pages/MonitoramentoESG"));
const MonitoramentoAgua = lazy(() => import("./pages/MonitoramentoAgua"));
const MonitoramentoEnergia = lazy(() => import("./pages/MonitoramentoEnergia"));
const MonitoramentoEmissoes = lazy(() => import("./pages/MonitoramentoEmissoes"));
const MonitoramentoResiduos = lazy(() => import("./pages/MonitoramentoResiduos"));

// Páginas específicas mantidas
const EmissoesGEE = lazy(() => import("./pages/EmissoesGEE"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
const PlatformAdminDashboard = lazy(() => import("./pages/PlatformAdminDashboard"));

// Backward-compat alias
const RegistrarCreditosCarbono = RegistrarAtividadeConservacao;

// Query client otimizado com cache inteligente
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount: number, error: Error) => {
        // Não retentar em erros de autenticação
        const errorObj = error as any;
        if (errorObj?.status === 401 || errorObj?.code === 'PGRST116') return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
      onError: (error: Error) => {
        errorHandler.showUserError(error, {
          component: 'QueryClient',
          function: 'mutation'
        });
      },
    },
  },
});


const AppContent = () => {
  // Hook para notificações de processamento em tempo real
  useDocumentProcessingNotifications();
  
  return (
    <>
      <RouteValidator>
        <GlobalKeyboardShortcuts />
        <PageTransition>
                  <Routes>
            {/* Landing Page - público */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Rota de autenticação - pública */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Rota de onboarding - protegida */}
            <Route path="/onboarding" element={<OnboardingRoute />} />
            
            {/* ========================================== */}
            {/* MÓDULOS DESABILITADOS - Redirecionamentos */}
            {/* ========================================== */}
            
            {/* Financeiro - desabilitado */}
            {!ENABLED_MODULES.financial && (
              <Route path="/financeiro/*" element={<Navigate to="/dashboard" replace />} />
            )}
            
            {/* Dados e Relatórios - desabilitado */}
            {!ENABLED_MODULES.dataReports && (
              <>
                <Route path="/coleta-dados" element={<Navigate to="/dashboard" replace />} />
                <Route path="/relatorios-integrados" element={<Navigate to="/dashboard" replace />} />
                <Route path="/sdg-dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="/indicadores-recomendados" element={<Navigate to="/dashboard" replace />} />
                <Route path="/ativos" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
            
            {/* ESG Ambiental - desabilitado */}
            {!ENABLED_MODULES.esgEnvironmental && (
              <>
                <Route path="/inventario-gee" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard-ghg" element={<Navigate to="/dashboard" replace />} />
                <Route path="/projetos-carbono" element={<Navigate to="/dashboard" replace />} />
                <Route path="/monitoramento-esg" element={<Navigate to="/dashboard" replace />} />
                <Route path="/monitoramento-agua" element={<Navigate to="/dashboard" replace />} />
                <Route path="/monitoramento-energia" element={<Navigate to="/dashboard" replace />} />
                <Route path="/monitoramento-emissoes" element={<Navigate to="/dashboard" replace />} />
                <Route path="/monitoramento-residuos" element={<Navigate to="/dashboard" replace />} />
                <Route path="/residuos" element={<Navigate to="/dashboard" replace />} />
                <Route path="/metas-sustentabilidade" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
            
            {/* ESG Governança - desabilitado */}
            {!ENABLED_MODULES.esgGovernance && (
              <>
                <Route path="/governanca-esg" element={<Navigate to="/dashboard" replace />} />
                <Route path="/gestao-riscos" element={<Navigate to="/dashboard" replace />} />
                <Route path="/compliance" element={<Navigate to="/dashboard" replace />} />
                <Route path="/auditoria" element={<Navigate to="/dashboard" replace />} />
                <Route path="/gestao-stakeholders" element={<Navigate to="/dashboard" replace />} />
                <Route path="/analise-materialidade" element={<Navigate to="/dashboard" replace />} />
              </>
            )}

            {/* Páginas públicas com lazy loading */}
            <Route path="/contato" element={
              <LazyPageWrapper>
                <Contato />
              </LazyPageWrapper>
            } />
            <Route path="/funcionalidades" element={
              <LazyPageWrapper>
                <Funcionalidades />
              </LazyPageWrapper>
            } />
            <Route path="/documentacao" element={
              <LazyPageWrapper>
                <Documentacao />
              </LazyPageWrapper>
            } />
            <Route path="/faq" element={
              <LazyPageWrapper>
                <FAQ />
              </LazyPageWrapper>
            } />

            {/* Portal do Fornecedor (público) */}
            <Route path="/fornecedor/login" element={<LazyPageWrapper><SupplierLogin /></LazyPageWrapper>} />
            <Route path="/fornecedor/alterar-senha" element={<LazyPageWrapper><SupplierChangePassword /></LazyPageWrapper>} />
            <Route path="/fornecedor/dashboard" element={<LazyPageWrapper><SupplierDashboard /></LazyPageWrapper>} />
            <Route path="/fornecedor/treinamentos" element={<LazyPageWrapper><SupplierTrainings /></LazyPageWrapper>} />
            <Route path="/fornecedor/treinamento/:id" element={<LazyPageWrapper><SupplierTrainingDetail /></LazyPageWrapper>} />
            <Route path="/fornecedor/leituras" element={<LazyPageWrapper><SupplierReadings /></LazyPageWrapper>} />
            <Route path="/fornecedor/pesquisas" element={<LazyPageWrapper><SupplierSurveys /></LazyPageWrapper>} />

            {/* Rotas protegidas principais com lazy loading */}
            <Route path="/dashboard" element={
              <ProtectedLazyPageWrapper>
                <Dashboard />
              </ProtectedLazyPageWrapper>
            } />
            
            {/* Database Documentation */}
            <Route path="/documentacao-banco" element={
              <ProtectedLazyPageWrapper>
                <DatabaseDocumentation />
              </ProtectedLazyPageWrapper>
            } />
            
            {/* Inventário e GHG */}
            <Route path="/inventario-gee" element={
              <ProtectedLazyPageWrapper>
                <InventarioGEE />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/dashboard-ghg" element={
              <ProtectedLazyPageWrapper>
                <DashboardGHG />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/emissoes" element={<Navigate to="/inventario-gee" replace />} />
            
            {/* Gestão de Documentos - Hub Unificado */}
            <Route path="/documentos" element={
              <ProtectedLazyPageWrapper>
                <DocumentosHub />
              </ProtectedLazyPageWrapper>
            } />
            
            {/* Redirects antigos para o novo hub */}
            <Route path="/extracoes-documentos" element={<Navigate to="/documentos?tab=extracoes" replace />} />
            <Route path="/reconciliacao-documentos" element={<Navigate to="/documentos?tab=reconciliacao" replace />} />

            {/* Licenciamento */}
            <Route path="/licenciamento" element={
              <ProtectedLazyPageWrapper>
                <Licenciamento />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/monitoramento" element={
              <ProtectedLazyPageWrapper>
                <LicenseMonitoring />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/license-monitoring" element={
              <ProtectedLazyPageWrapper>
                <LicenseMonitoring />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/processar" element={
              <ProtectedLazyPageWrapper>
                <ProcessarLicenca />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/analise" element={<Navigate to="/licenciamento/processar" replace />} />
            <Route path="/licenciamento/nova" element={<Navigate to="/licenciamento/novo" replace />} />
            <Route path="/licenciamento/:id/analise" element={<Navigate to="/licenciamento/processar" replace />} />
            <Route path="/licenciamento/novo" element={
              <ProtectedLazyPageWrapper>
                <LicenseForm />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/:id" element={
              <ProtectedLazyPageWrapper>
                <LicenseDetails />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/:id/editar" element={
              <ProtectedLazyPageWrapper>
                <LicenseForm />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/reconciliacao" element={<Navigate to="/documentos?tab=reconciliacao" replace />} />

            {/* Legislações - Subpáginas do Licenciamento */}
            <Route path="/licenciamento/legislacoes" element={
              <ProtectedLazyPageWrapper>
                <LegislationsHub />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/legislacoes/nova" element={
              <ProtectedLazyPageWrapper>
                <LegislationForm />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/legislacoes/:id" element={
              <ProtectedLazyPageWrapper>
                <LegislationDetail />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/legislacoes/:id/editar" element={
              <ProtectedLazyPageWrapper>
                <LegislationForm />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/legislacoes/relatorios" element={
              <ProtectedLazyPageWrapper>
                <LegislationReports />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/licenciamento/legislacoes/compliance" element={
              <ProtectedLazyPageWrapper>
                <LegislationComplianceProfiles />
              </ProtectedLazyPageWrapper>
            } />

            <Route path="/residuos" element={
              <ProtectedLazyPageWrapper>
                <Residuos />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/residuos/registrar-destinacao" element={
              <ProtectedLazyPageWrapper>
                <RegistrarDestinacao />
              </ProtectedLazyPageWrapper>
            } />
            
            {/* Monitoramento ESG - FASE 1 & 2 */}
            <Route path="/monitoramento-esg" element={
              <ProtectedLazyPageWrapper>
                <MonitoramentoESG />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/monitoramento-agua" element={
              <ProtectedLazyPageWrapper>
                <MonitoramentoAgua />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/monitoramento-energia" element={
              <ProtectedLazyPageWrapper>
                <MonitoramentoEnergia />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/monitoramento-emissoes" element={
              <ProtectedLazyPageWrapper>
                <MonitoramentoEmissoes />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/monitoramento-residuos" element={
              <ProtectedLazyPageWrapper>
                <MonitoramentoResiduos />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/residuos/novo" element={<Navigate to="/residuos/registrar-destinacao" replace />} />
            <Route path="/residuos/relatorios" element={
              <ProtectedLazyPageWrapper>
                <RelatoriosPGRS />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/fornecedores-residuos" element={
              <ProtectedLazyPageWrapper>
                <FornecedoresResiduos />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/residuos/contas-a-pagar" element={
              <ProtectedLazyPageWrapper>
                <FinanceiroResiduosContasAPagar />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/residuos/contas-a-receber" element={
              <ProtectedLazyPageWrapper>
                <FinanceiroResiduosContasAReceber />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/dashboard" element={
              <ProtectedLazyPageWrapper>
                <DashboardFinanceiro />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/orcamento" element={
              <ProtectedLazyPageWrapper>
                <GestaoOrcamento />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/fluxo-caixa" element={
              <ProtectedLazyPageWrapper>
                <FluxoCaixa />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/centros-custo" element={
              <ProtectedLazyPageWrapper>
                <CentroCustos />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/relatorios" element={
              <ProtectedLazyPageWrapper>
                <RelatoriosFinanceiros />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/rentabilidade" element={
              <ProtectedLazyPageWrapper>
                <AnaliseRentabilidade />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/plano-contas" element={
              <ProtectedLazyPageWrapper>
                <PlanoContas />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/lancamentos-contabeis" element={
              <ProtectedLazyPageWrapper>
                <LancamentosContabeis />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/contas-pagar" element={
              <ProtectedLazyPageWrapper>
                <ContasAPagar />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/contas-receber" element={
              <ProtectedLazyPageWrapper>
                <ContasAReceber />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/aprovacoes" element={
              <ProtectedLazyPageWrapper>
                <AprovacoesFinanceiras />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/financeiro/esg-dashboard" element={
              <ProtectedLazyPageWrapper>
                <ESGFinancialDashboard />
              </ProtectedLazyPageWrapper>
            } />

            {/* Metas */}
            <Route path="/metas" element={
              <ProtectedLazyPageWrapper>
                <Metas />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/metas/nova" element={
              <ProtectedLazyPageWrapper>
                <CriarMeta />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/metas-sustentabilidade" element={<Navigate to="/metas" replace />} />

            {/* Relatórios - Consolidado */}
            <Route path="/relatorios" element={<Navigate to="/relatorios-integrados" replace />} />
            <Route path="/relatorios-sustentabilidade" element={<Navigate to="/relatorios-integrados" replace />} />
            <Route path="/gerador-relatorios" element={<Navigate to="/relatorios-integrados" replace />} />

            {/* Continue com outras rotas... */}
            <Route path="/biblioteca-fatores" element={
              <ProtectedLazyPageWrapper>
                <BibliotecaFatores />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/projetos-carbono" element={
              <ProtectedLazyPageWrapper>
                <ProjetosCarbono />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/projetos-carbono/registrar-atividade" element={
              <ProtectedLazyPageWrapper>
                <RegistrarAtividadeConservacao />
              </ProtectedLazyPageWrapper>
            } />
            
            {/* Supplier Management Module */}
            <Route path="/fornecedores/dashboard" element={<ProtectedLazyPageWrapper><SupplierManagementDashboard /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/documentacao" element={<ProtectedLazyPageWrapper><RequiredDocuments /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/categorias" element={<ProtectedLazyPageWrapper><SupplierCategoriesPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/tipos" element={<ProtectedLazyPageWrapper><SupplierTypesPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/treinamentos" element={<ProtectedLazyPageWrapper><SupplierTrainingMaterialsPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/associacao-documentos" element={<ProtectedLazyPageWrapper><DocumentTypeAssociationPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/cadastro" element={<ProtectedLazyPageWrapper><SupplierRegistration /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/vinculacao/:id" element={<ProtectedLazyPageWrapper><SupplierAssignmentPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/conexoes" element={<ProtectedLazyPageWrapper><SupplierConnections /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/avaliacoes" element={<ProtectedLazyPageWrapper><SupplierEvaluations /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/leituras-obrigatorias" element={<ProtectedLazyPageWrapper><SupplierMandatoryReadingsPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/pesquisas" element={<ProtectedLazyPageWrapper><SupplierSurveysManagementPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/indicadores" element={<ProtectedLazyPageWrapper><SupplierIndicatorsPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/importar-exportar" element={<ProtectedLazyPageWrapper><SupplierImportExportPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/falhas" element={<ProtectedLazyPageWrapper><SupplierFailuresPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/criterios-avaliacao" element={<ProtectedLazyPageWrapper><SupplierEvaluationCriteriaPage /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores/entregas" element={<ProtectedLazyPageWrapper><SupplierDeliveriesPage /></ProtectedLazyPageWrapper>} />
            
            {/* Demais rotas com lazy loading */}
            <Route path="/gestao-esg" element={<ProtectedLazyPageWrapper><GestaoESG /></ProtectedLazyPageWrapper>} />
            <Route path="/ativos" element={<ProtectedLazyPageWrapper><Ativos /></ProtectedLazyPageWrapper>} />
            <Route path="/desempenho" element={<ProtectedLazyPageWrapper><Desempenho /></ProtectedLazyPageWrapper>} />
            <Route path="/configuracao" element={
              <ProtectedLazyPageWrapper>
                <Configuracao />
              </ProtectedLazyPageWrapper>
            } />
            <Route path="/ia-insights" element={<ProtectedLazyPageWrapper><IAInsights /></ProtectedLazyPageWrapper>} />
            <Route path="/marketplace" element={<ProtectedLazyPageWrapper><Marketplace /></ProtectedLazyPageWrapper>} />
            <Route path="/coleta-dados" element={<ProtectedLazyPageWrapper><ColetaDados /></ProtectedLazyPageWrapper>} />
            <Route path="/formularios-customizados" element={<ProtectedLazyPageWrapper><FormulariosCustomizados /></ProtectedLazyPageWrapper>} />
            <Route path="/auditoria" element={<ProtectedLazyPageWrapper><Auditoria /></ProtectedLazyPageWrapper>} />
            <Route path="/auditoria/:id" element={<ProtectedLazyPageWrapper><AuditDetails /></ProtectedLazyPageWrapper>} />
            <Route path="/compliance" element={<ProtectedLazyPageWrapper><Compliance /></ProtectedLazyPageWrapper>} />
            
            {/* Sistema e alertas */}
            <Route path="/smart-notifications" element={<ProtectedLazyPageWrapper><SmartNotificationSystem /></ProtectedLazyPageWrapper>} />
            <Route path="/intelligent-alerts" element={<ProtectedLazyPageWrapper><IntelligentAlertsSystem /></ProtectedLazyPageWrapper>} />
            <Route path="/advanced-reports" element={<ProtectedLazyPageWrapper><AdvancedReportingSystem /></ProtectedLazyPageWrapper>} />
            
            {/* ESG e stakeholders */}
            <Route path="/gestao-stakeholders" element={<ProtectedLazyPageWrapper><GestaoStakeholders /></ProtectedLazyPageWrapper>} />
            <Route path="/analise-materialidade" element={<ProtectedLazyPageWrapper><AnaliseMaterialidade /></ProtectedLazyPageWrapper>} />
            <Route path="/materialidade" element={<ProtectedLazyPageWrapper><Materialidade /></ProtectedLazyPageWrapper>} />
            <Route path="/indicadores-esg" element={<ProtectedLazyPageWrapper><IndicadoresESG /></ProtectedLazyPageWrapper>} />
            <Route path="/indicadores-recomendados" element={<ProtectedLazyPageWrapper><IndicadoresRecomendados /></ProtectedLazyPageWrapper>} />
            <Route path="/fornecedores" element={<ProtectedLazyPageWrapper><Fornecedores /></ProtectedLazyPageWrapper>} />
            <Route path="/configuracao-organizacional" element={<ProtectedLazyPageWrapper><ConfiguracaoOrganizacional /></ProtectedLazyPageWrapper>} />
            <Route path="/social-esg" element={<ProtectedLazyPageWrapper><SocialESG /></ProtectedLazyPageWrapper>} />
            <Route path="/governanca-esg" element={<ProtectedLazyPageWrapper><GovernancaESG /></ProtectedLazyPageWrapper>} />
            <Route path="/relatorios-integrados" element={<ProtectedLazyPageWrapper><RelatoriosIntegrados /></ProtectedLazyPageWrapper>} />
            <Route path="/production-monitoring" element={<ProtectedLazyPageWrapper><ProductionMonitoring /></ProtectedLazyPageWrapper>} />
            
            {/* SGQ modules */}
            <Route path="/planejamento-estrategico" element={<ProtectedLazyPageWrapper><PlanejamentoEstrategico /></ProtectedLazyPageWrapper>} />
            <Route path="/mapeamento-processos" element={<ProtectedLazyPageWrapper><MapeamentoProcessos /></ProtectedLazyPageWrapper>} />
            <Route path="/gestao-riscos" element={<ProtectedLazyPageWrapper><GestaoRiscos /></ProtectedLazyPageWrapper>} />
            <Route path="/nao-conformidades" element={<ProtectedLazyPageWrapper><NaoConformidades /></ProtectedLazyPageWrapper>} />
            <Route path="/acoes-corretivas" element={<ProtectedLazyPageWrapper><AcoesCorretivas /></ProtectedLazyPageWrapper>} />
            <Route path="/plano-acao-5w2h" element={<ProtectedLazyPageWrapper><PlanoAcao5W2H /></ProtectedLazyPageWrapper>} />
            <Route path="/base-conhecimento" element={<ProtectedLazyPageWrapper><BaseConhecimento /></ProtectedLazyPageWrapper>} />
            <Route path="/gestao-fornecedores" element={<ProtectedLazyPageWrapper><GestaoFornecedores /></ProtectedLazyPageWrapper>} />
            <Route path="/quality-dashboard" element={<ProtectedLazyPageWrapper><QualityDashboard /></ProtectedLazyPageWrapper>} />
            <Route path="/gestao-indicadores" element={<ProtectedLazyPageWrapper><GestaoIndicadores /></ProtectedLazyPageWrapper>} />
            <Route path="/controle-documentos" element={<ProtectedLazyPageWrapper><ControleDocumentos /></ProtectedLazyPageWrapper>} />
            <Route path="/gerenciamento-projetos" element={<ProtectedLazyPageWrapper><GerenciamentoProjetos /></ProtectedLazyPageWrapper>} />
// Consolidar rotas duplicadas - removendo duplicações
            <Route path="/indicadores-qualidade" element={<Navigate to="/quality-dashboard" replace />} />
            <Route path="/qualidade" element={<Navigate to="/quality-dashboard" replace />} />
            <Route path="/sgq-dashboard" element={<Navigate to="/quality-dashboard" replace />} />
            <Route path="/dashboard-sgq" element={<Navigate to="/quality-dashboard" replace />} />
            <Route path="/auditorias-internas" element={<Navigate to="/auditoria" replace />} />
            <Route path="/avaliacao-fornecedores" element={<Navigate to="/gestao-fornecedores" replace />} />
            
            {/* RH modules */}
            <Route path="/estrutura-organizacional" element={<ProtectedLazyPageWrapper><EstruturaOrganizacional /></ProtectedLazyPageWrapper>} />
            <Route path="/descricao-cargos" element={<ProtectedLazyPageWrapper><DescricaoCargos /></ProtectedLazyPageWrapper>} />
            <Route path="/gestao-funcionarios" element={<ProtectedLazyPageWrapper><GestaoFuncionarios /></ProtectedLazyPageWrapper>} />
            <Route path="/gestao-treinamentos" element={<ProtectedLazyPageWrapper><GestaoTreinamentos /></ProtectedLazyPageWrapper>} />
            <Route path="/gestao-desempenho" element={<ProtectedLazyPageWrapper><GestaoDesempenho /></ProtectedLazyPageWrapper>} />
            <Route path="/beneficios-remuneracao" element={<ProtectedLazyPageWrapper><BeneficiosRemuneracao /></ProtectedLazyPageWrapper>} />
            <Route path="/recrutamento" element={<ProtectedLazyPageWrapper><Recrutamento /></ProtectedLazyPageWrapper>} />
            <Route path="/seguranca-trabalho" element={<ProtectedLazyPageWrapper><SeguracaTrabalho /></ProtectedLazyPageWrapper>} />
            <Route path="/ponto-frequencia" element={<ProtectedLazyPageWrapper><PontoFrequencia /></ProtectedLazyPageWrapper>} />
            <Route path="/desenvolvimento-carreira" element={<ProtectedLazyPageWrapper><DesenvolvimentoCarreira /></ProtectedLazyPageWrapper>} />
            <Route path="/ouvidoria-clientes" element={<ProtectedLazyPageWrapper><OuvidoriaClientes /></ProtectedLazyPageWrapper>} />

            {/* Gestão de Usuários */}
            <Route path="/gestao-usuarios" element={<ProtectedLazyPageWrapper><GestaoUsuarios /></ProtectedLazyPageWrapper>} />

            {/* Intelligence Center */}
            <Route path="/intelligence-center" element={<ProtectedLazyPageWrapper><IntelligenceCenter /></ProtectedLazyPageWrapper>} />

            {/* Simulador */}
            <Route path="/simulador" element={<ProtectedLazyPageWrapper><SimuladorEcoImpacto /></ProtectedLazyPageWrapper>} />

            {/* Redirects e páginas de compatibilidade com nova estrutura de navegação */}
            <Route path="/painel-principal" element={<Navigate to="/dashboard" replace />} />
            <Route path="/analise-desempenho" element={<Navigate to="/desempenho" replace />} />
            <Route path="/painel-gestao-esg" element={<Navigate to="/gestao-esg" replace />} />
            <Route path="/metas-sustentabilidade" element={<Navigate to="/metas" replace />} />
            <Route path="/emissoes-gee" element={<ProtectedLazyPageWrapper><EmissoesGEE /></ProtectedLazyPageWrapper>} />
            <Route path="/painel-social" element={<Navigate to="/social-esg" replace />} />
            <Route path="/saude-seguranca-trabalho" element={<Navigate to="/seguranca-trabalho" replace />} />
            <Route path="/treinamentos-desenvolvimento" element={<Navigate to="/gestao-treinamentos" replace />} />
            <Route path="/painel-governanca" element={<Navigate to="/governanca-esg" replace />} />
            <Route path="/compliance-politicas" element={<Navigate to="/compliance" replace />} />
            <Route path="/auditorias" element={<Navigate to="/auditoria" replace />} />
            <Route path="/gerador-relatorios" element={<Navigate to="/relatorios-integrados" replace />} />
            <Route path="/marketplace-esg" element={<Navigate to="/marketplace" replace />} />
            <Route path="/reconciliacao-ia" element={<Navigate to="/documentos?tab=reconciliacao" replace />} />
            
            {/* Formulário público */}
            <Route path="/form/:formId" element={
              <LazyPageWrapper>
                <PublicForm />
              </LazyPageWrapper>
            } />
            
            {/* System Status - Production Readiness */}
            <Route path="/system-status" element={<ProtectedLazyPageWrapper><SystemStatus /></ProtectedLazyPageWrapper>} />
            
            {/* Platform Admin Dashboard - Only accessible to platform admins */}
            <Route 
              path="/platform-admin" 
              element={
                <ProtectedRoute>
                  <RoleGuard requiredRole="platform_admin">
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <PlatformAdminDashboard />
                    </Suspense>
                  </RoleGuard>
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all deve ser sempre a última rota */}
            <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTransition>
              </RouteValidator>
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CompanyProvider>
            <TooltipProvider>
              <SmartToastProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter 
                  future={{ 
                    v7_startTransition: true, 
                    v7_relativeSplatPath: true 
                  }}
                >
                  <AppContent />
                </BrowserRouter>
              </SmartToastProvider>
            </TooltipProvider>
          </CompanyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

export default App;
