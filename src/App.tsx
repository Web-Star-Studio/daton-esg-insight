import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import InventarioGEE from "./pages/InventarioGEE";
import DashboardGHG from "./pages/DashboardGHG";
import Licenciamento from "./pages/Licenciamento";
import CadastrarLicenca from "./pages/CadastrarLicenca";
import Residuos from "./pages/Residuos";
import RegistrarDestinacao from "./pages/RegistrarDestinacao";
import Metas from "./pages/Metas";
import CriarMeta from "./pages/CriarMeta";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inventario-gee" element={<InventarioGEE />} />
          <Route path="/dashboard-ghg" element={<DashboardGHG />} />
          <Route path="/licenciamento" element={<Licenciamento />} />
          <Route path="/licenciamento/novo" element={<CadastrarLicenca />} />
          <Route path="/residuos" element={<Residuos />} />
          <Route path="/residuos/novo" element={<RegistrarDestinacao />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/metas/nova" element={<CriarMeta />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
