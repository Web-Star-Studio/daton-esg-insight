import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingFallback } from "@/components/LoadingFallback";
import { errorHandler } from "@/utils/errorHandler";

// Páginas críticas carregadas sincronamente
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import { OnboardingRoute } from "./routes/onboarding";

// Lazy loading para todas as outras páginas
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Contato = lazy(() => import("./pages/Contato"));
const Funcionalidades = lazy(() => import("./pages/Funcionalidades"));
const Documentacao = lazy(() => import("./pages/Documentacao"));
const InventarioGEE = lazy(() => import("./pages/InventarioGEE"));
const DashboardGHG = lazy(() => import("./pages/DashboardGHG"));
const Licenciamento = lazy(() => import("./pages/Licenciamento"));
const LicenseDetails = lazy(() => import("./pages/LicenseDetails"));
const LicenseForm = lazy(() => import("./pages/LicenseForm"));
const ProcessarLicenca = lazy(() => import("./pages/ProcessarLicenca"));
const Residuos = lazy(() => import("./pages/Residuos"));
const RegistrarDestinacao = lazy(() => import("./pages/RegistrarDestinacao"));
const Metas = lazy(() => import("./pages/Metas"));
const CriarMeta = lazy(() => import("./pages/CriarMeta"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const BibliotecaFatores = lazy(() => import("./pages/BibliotecaFatores"));
const ProjetosCarbono = lazy(() => import("./pages/ProjetosCarbono"));
const RegistrarAtividadeConservacao = lazy(() => import("./pages/RegistrarAtividadeConservacao"));
const FornecedoresResiduos = lazy(() => import("./pages/FornecedoresResiduos"));
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
const Documentos = lazy(() => import("./pages/Documentos"));
const ReconciliacaoDocumentos = lazy(() => import("./pages/ReconciliacaoDocumentos").then(module => ({ default: module.ReconciliacaoDocumentos })));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const Compliance = lazy(() => import("./pages/Compliance"));
const ComplianceNew = lazy(() => import("./pages/ComplianceNew"));

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
const RelatoriosSustentabilidade = lazy(() => import("./pages/RelatoriosSustentabilidade"));

// Lazy loading para SGQ modules
const PlanejamentoEstrategico = lazy(() => import("./pages/PlanejamentoEstrategico"));
const MapeamentoProcessos = lazy(() => import("./pages/MapeamentoProcessos"));
const GestaoRiscos = lazy(() => import("./pages/GestaoRiscos"));
const NaoConformidades = lazy(() => import("./pages/NaoConformidades"));
const PlanoAcao5W2H = lazy(() => import("./pages/PlanoAcao5W2H"));
const BaseConhecimento = lazy(() => import("./pages/BaseConhecimento"));
const GestaoFornecedores = lazy(() => import("./pages/GestaoFornecedores"));
const QualityDashboard = lazy(() => import("./pages/QualityDashboard"));
const GerenciamentoProjetos = lazy(() => import("./pages/GerenciamentoProjetos").then(module => ({ default: module.GerenciamentoProjetos })));

// Lazy loading para RH modules
const EstruturaOrganizacional = lazy(() => import("./pages/EstruturaOrganizacional"));
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

// Lazy loading para páginas de compatibilidade/redirect
const PainelPrincipal = lazy(() => import("./pages/PainelPrincipal"));
const EmissoesGEE = lazy(() => import("./pages/EmissoesGEE"));
const PainelSocial = lazy(() => import("./pages/PainelSocial"));
const PainelGovernanca = lazy(() => import("./pages/PainelGovernanca"));

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

// Componente otimizado para wrapping de páginas lazy
const LazyPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback message="Carregando página..." />}>
    <ProtectedRoute>{children}</ProtectedRoute>
  </Suspense>
);

const LazyPublicPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback message="Carregando..." />}>
    {children}
  </Suspense>
);

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
            
            {/* Rota de onboarding - protegida */}
            <Route path="/onboarding" element={<OnboardingRoute />} />
            
            {/* Páginas públicas com lazy loading */}
            <Route path="/contato" element={
              <LazyPublicPageWrapper>
                <Contato />
              </LazyPublicPageWrapper>
            } />
            <Route path="/funcionalidades" element={
              <LazyPublicPageWrapper>
                <Funcionalidades />
              </LazyPublicPageWrapper>
            } />
            <Route path="/documentacao" element={
              <LazyPublicPageWrapper>
                <Documentacao />
              </LazyPublicPageWrapper>
            } />

            {/* Rotas protegidas principais com lazy loading */}
            <Route path="/dashboard" element={
              <LazyPageWrapper>
                <Dashboard />
              </LazyPageWrapper>
            } />
            
            {/* Inventário e GHG */}
            <Route path="/inventario-gee" element={
              <LazyPageWrapper>
                <InventarioGEE />
              </LazyPageWrapper>
            } />
            <Route path="/dashboard-ghg" element={
              <LazyPageWrapper>
                <DashboardGHG />
              </LazyPageWrapper>
            } />

            {/* Licenciamento */}
            <Route path="/licenciamento" element={
              <LazyPageWrapper>
                <Licenciamento />
              </LazyPageWrapper>
            } />
            <Route path="/licenciamento/processar" element={
              <LazyPageWrapper>
                <ProcessarLicenca />
              </LazyPageWrapper>
            } />
            <Route path="/licenciamento/analise" element={<Navigate to="/licenciamento/processar" replace />} />
            <Route path="/licenciamento/nova" element={<Navigate to="/licenciamento/novo" replace />} />
            <Route path="/licenciamento/:id/analise" element={<Navigate to="/licenciamento/processar" replace />} />
            <Route path="/licenciamento/novo" element={
              <Suspense fallback={<LoadingFallback />}>
                <ProtectedRoute requiredRole="Editor">
                  <LicenseForm />
                </ProtectedRoute>
              </Suspense>
            } />
            <Route path="/licenciamento/:id" element={
              <LazyPageWrapper>
                <LicenseDetails />
              </LazyPageWrapper>
            } />
            <Route path="/licenciamento/:id/editar" element={
              <Suspense fallback={<LoadingFallback />}>
                <ProtectedRoute requiredRole="Editor">
                  <LicenseForm />
                </ProtectedRoute>
              </Suspense>
            } />

            {/* Resíduos */}
            <Route path="/residuos" element={
              <LazyPageWrapper>
                <Residuos />
              </LazyPageWrapper>
            } />
            <Route path="/fornecedores-residuos" element={
              <Suspense fallback={<LoadingFallback />}>
                <ProtectedRoute requiredRole="Editor">
                  <FornecedoresResiduos />
                </ProtectedRoute>
              </Suspense>
            } />

            {/* Metas */}
            <Route path="/metas" element={
              <LazyPageWrapper>
                <Metas />
              </LazyPageWrapper>
            } />
            <Route path="/metas/nova" element={
              <Suspense fallback={<LoadingFallback />}>
                <ProtectedRoute requiredRole="Editor">
                  <CriarMeta />
                </ProtectedRoute>
              </Suspense>
            } />

            {/* Relatórios */}
            <Route path="/relatorios" element={
              <LazyPageWrapper>
                <Relatorios />
              </LazyPageWrapper>
            } />
            <Route path="/relatorios-sustentabilidade" element={
              <LazyPageWrapper>
                <RelatoriosSustentabilidade />
              </LazyPageWrapper>
            } />

            {/* Continue com outras rotas... */}
            <Route path="/biblioteca-fatores" element={
              <LazyPageWrapper>
                <BibliotecaFatores />
              </LazyPageWrapper>
            } />
            <Route path="/projetos-carbono" element={
              <LazyPageWrapper>
                <ProjetosCarbono />
              </LazyPageWrapper>
            } />
            <Route path="/projetos-carbono/registrar-atividade" element={
              <Suspense fallback={<LoadingFallback />}>
                <ProtectedRoute requiredRole="Editor">
                  <RegistrarAtividadeConservacao />
                </ProtectedRoute>
              </Suspense>
            } />
            
            {/* Demais rotas com lazy loading */}
            <Route path="/gestao-esg" element={<LazyPageWrapper><GestaoESG /></LazyPageWrapper>} />
            <Route path="/ativos" element={<LazyPageWrapper><Ativos /></LazyPageWrapper>} />
            <Route path="/desempenho" element={<LazyPageWrapper><Desempenho /></LazyPageWrapper>} />
            <Route path="/configuracao" element={
              <Suspense fallback={<LoadingFallback />}>
                <ProtectedRoute requiredRole="Admin">
                  <Configuracao />
                </ProtectedRoute>
              </Suspense>
            } />
            <Route path="/ia-insights" element={<LazyPageWrapper><IAInsights /></LazyPageWrapper>} />
            <Route path="/marketplace" element={<LazyPageWrapper><Marketplace /></LazyPageWrapper>} />
            <Route path="/coleta-dados" element={<LazyPageWrapper><ColetaDados /></LazyPageWrapper>} />
            <Route path="/formularios-customizados" element={<LazyPageWrapper><FormulariosCustomizados /></LazyPageWrapper>} />
            <Route path="/documentos" element={<LazyPageWrapper><Documentos /></LazyPageWrapper>} />
            <Route path="/reconciliacao-documentos" element={<LazyPageWrapper><ReconciliacaoDocumentos /></LazyPageWrapper>} />
            <Route path="/auditoria" element={<LazyPageWrapper><Auditoria /></LazyPageWrapper>} />
            <Route path="/compliance" element={<LazyPageWrapper><ComplianceNew /></LazyPageWrapper>} />
            <Route path="/compliance-old" element={<LazyPageWrapper><Compliance /></LazyPageWrapper>} />
            
            {/* Sistema e alertas */}
            <Route path="/smart-notifications" element={<LazyPageWrapper><SmartNotificationSystem /></LazyPageWrapper>} />
            <Route path="/intelligent-alerts" element={<LazyPageWrapper><IntelligentAlertsSystem /></LazyPageWrapper>} />
            <Route path="/advanced-reports" element={<LazyPageWrapper><AdvancedReportingSystem /></LazyPageWrapper>} />
            
            {/* ESG e stakeholders */}
            <Route path="/gestao-stakeholders" element={<LazyPageWrapper><GestaoStakeholders /></LazyPageWrapper>} />
            <Route path="/analise-materialidade" element={<LazyPageWrapper><AnaliseMaterialidade /></LazyPageWrapper>} />
            <Route path="/configuracao-organizacional" element={<LazyPageWrapper><ConfiguracaoOrganizacional /></LazyPageWrapper>} />
            <Route path="/social-esg" element={<LazyPageWrapper><SocialESG /></LazyPageWrapper>} />
            <Route path="/governanca-esg" element={<LazyPageWrapper><GovernancaESG /></LazyPageWrapper>} />
            <Route path="/relatorios-integrados" element={<LazyPageWrapper><RelatoriosIntegrados /></LazyPageWrapper>} />
            
            {/* SGQ modules */}
            <Route path="/planejamento-estrategico" element={<LazyPageWrapper><PlanejamentoEstrategico /></LazyPageWrapper>} />
            <Route path="/mapeamento-processos" element={<LazyPageWrapper><MapeamentoProcessos /></LazyPageWrapper>} />
            <Route path="/gestao-riscos" element={<LazyPageWrapper><GestaoRiscos /></LazyPageWrapper>} />
            <Route path="/nao-conformidades" element={<LazyPageWrapper><NaoConformidades /></LazyPageWrapper>} />
            <Route path="/plano-acao-5w2h" element={<LazyPageWrapper><PlanoAcao5W2H /></LazyPageWrapper>} />
            <Route path="/base-conhecimento" element={<LazyPageWrapper><BaseConhecimento /></LazyPageWrapper>} />
            <Route path="/gestao-fornecedores" element={<LazyPageWrapper><GestaoFornecedores /></LazyPageWrapper>} />
            <Route path="/quality-dashboard" element={<LazyPageWrapper><QualityDashboard /></LazyPageWrapper>} />
            <Route path="/gerenciamento-projetos" element={<LazyPageWrapper><GerenciamentoProjetos /></LazyPageWrapper>} />
            
            {/* RH modules */}
            <Route path="/estrutura-organizacional" element={<LazyPageWrapper><EstruturaOrganizacional /></LazyPageWrapper>} />
            <Route path="/gestao-funcionarios" element={<LazyPageWrapper><GestaoFuncionarios /></LazyPageWrapper>} />
            <Route path="/gestao-treinamentos" element={<LazyPageWrapper><GestaoTreinamentos /></LazyPageWrapper>} />
            <Route path="/gestao-desempenho" element={<LazyPageWrapper><GestaoDesempenho /></LazyPageWrapper>} />
            <Route path="/beneficios-remuneracao" element={<LazyPageWrapper><BeneficiosRemuneracao /></LazyPageWrapper>} />
            <Route path="/recrutamento" element={<LazyPageWrapper><Recrutamento /></LazyPageWrapper>} />
            <Route path="/seguranca-trabalho" element={<LazyPageWrapper><SeguracaTrabalho /></LazyPageWrapper>} />
            <Route path="/ponto-frequencia" element={<LazyPageWrapper><PontoFrequencia /></LazyPageWrapper>} />
            <Route path="/desenvolvimento-carreira" element={<LazyPageWrapper><DesenvolvimentoCarreira /></LazyPageWrapper>} />
            <Route path="/ouvidoria-clientes" element={<LazyPageWrapper><OuvidoriaClientes /></LazyPageWrapper>} />

            {/* Gestão de Usuários */}
            <Route path="/gestao-usuarios" element={<LazyPageWrapper><GestaoUsuarios /></LazyPageWrapper>} />

            {/* Intelligence Center */}
            <Route path="/intelligence-center" element={<LazyPageWrapper><IntelligenceCenter /></LazyPageWrapper>} />

            {/* Simulador */}
            <Route path="/simulador" element={<LazyPageWrapper><SimuladorEcoImpacto /></LazyPageWrapper>} />

            {/* Redirects e páginas de compatibilidade com nova estrutura de navegação */}
            <Route path="/painel-principal" element={<LazyPageWrapper><PainelPrincipal /></LazyPageWrapper>} />
            <Route path="/analise-desempenho" element={<Navigate to="/desempenho" replace />} />
            <Route path="/painel-gestao-esg" element={<Navigate to="/gestao-esg" replace />} />
            <Route path="/metas-sustentabilidade" element={<Navigate to="/metas" replace />} />
            <Route path="/emissoes-gee" element={<LazyPageWrapper><EmissoesGEE /></LazyPageWrapper>} />
            <Route path="/painel-social" element={<LazyPageWrapper><PainelSocial /></LazyPageWrapper>} />
            <Route path="/saude-seguranca-trabalho" element={<Navigate to="/seguranca-trabalho" replace />} />
            <Route path="/treinamentos-desenvolvimento" element={<Navigate to="/gestao-treinamentos" replace />} />
            <Route path="/painel-governanca" element={<LazyPageWrapper><PainelGovernanca /></LazyPageWrapper>} />
            <Route path="/compliance-politicas" element={<Navigate to="/compliance" replace />} />
            <Route path="/auditorias" element={<Navigate to="/auditoria" replace />} />
            <Route path="/dashboard-sgq" element={<Navigate to="/quality-dashboard" replace />} />
            <Route path="/gerador-relatorios" element={<Navigate to="/relatorios" replace />} />
            <Route path="/marketplace-esg" element={<Navigate to="/marketplace" replace />} />
            <Route path="/reconciliacao-ia" element={<Navigate to="/reconciliacao-documentos" replace />} />
            
            {/* Formulário público */}
            <Route path="/form/:formId" element={
              <Suspense fallback={<LoadingFallback />}>
                <PublicForm />
              </Suspense>
            } />
            
            {/* Catch-all deve ser sempre a última rota */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
