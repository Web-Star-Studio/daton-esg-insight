import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import InventarioGEE from "./pages/InventarioGEE";
import DashboardGHG from "./pages/DashboardGHG";
import Licenciamento from "./pages/Licenciamento";
import LicenseDetails from "./pages/LicenseDetails";
import CadastrarLicenca from "./pages/CadastrarLicenca";
import EditarLicenca from "./pages/EditarLicenca";
import { LicenciamentoAnalise } from "./pages/LicenciamentoAnalise";
import Residuos from "./pages/Residuos";
import RegistrarDestinacao from "./pages/RegistrarDestinacao";
import Metas from "./pages/Metas";
import CriarMeta from "./pages/CriarMeta";
import Relatorios from "./pages/Relatorios";
import BibliotecaFatores from "./pages/BibliotecaFatores";
import ProjetosCarbono from "./pages/ProjetosCarbono";
import RegistrarCreditosCarbono from "./pages/RegistrarCreditosCarbono";
import Ativos from "./pages/Ativos";
import Desempenho from "./pages/Desempenho";
import Configuracao from "./pages/Configuracao";
import { SimuladorEcoImpacto } from "./pages/SimuladorEcoImpacto";
import IAInsights from "./pages/IAInsights";
import GestaoESG from "./pages/GestaoESG";
import ColetaDados from "./pages/ColetaDados";
import FormulariosCustomizados from "./pages/FormulariosCustomizados";
import PublicForm from "./pages/PublicForm";
import Documentos from "./pages/Documentos";
import { ReconciliacaoDocumentos } from "./pages/ReconciliacaoDocumentos";
import Auditoria from "./pages/Auditoria";
import Compliance from "./pages/Compliance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota de autenticação - pública */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Rotas protegidas */}
            <Route path="/" element={
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
            <Route path="/licenciamento/novo" element={
              <ProtectedRoute requiredRole="Editor">
                <CadastrarLicenca />
              </ProtectedRoute>
            } />
            <Route path="/licenciamento/:id" element={
              <ProtectedRoute>
                <LicenseDetails />
              </ProtectedRoute>
            } />
            <Route path="/licenciamento/:id/editar" element={
              <ProtectedRoute requiredRole="Editor">
                <EditarLicenca />
              </ProtectedRoute>
            } />
            <Route path="/licenciamento/:id/analise" element={
              <ProtectedRoute>
                <LicenciamentoAnalise />
              </ProtectedRoute>
            } />
            <Route path="/residuos" element={
              <ProtectedRoute>
                <Residuos />
              </ProtectedRoute>
            } />
            <Route path="/residuos/novo" element={
              <ProtectedRoute requiredRole="Editor">
                <RegistrarDestinacao />
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
            <Route path="/projetos-carbono/registrar-creditos" element={
              <ProtectedRoute requiredRole="Editor">
                <RegistrarCreditosCarbono />
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
            <Route path="/simulador" element={
              <ProtectedRoute>
                <SimuladorEcoImpacto />
              </ProtectedRoute>
            } />
            <Route path="/ia-insights" element={
              <ProtectedRoute>
                <IAInsights />
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
