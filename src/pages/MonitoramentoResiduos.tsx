import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Download, Calendar, Recycle, TrendingUp } from "lucide-react";
import { WasteTotalGenerationDashboard } from "@/components/waste/WasteTotalGenerationDashboard";
import { WasteRecyclingDashboard } from "@/components/waste/WasteRecyclingDashboard";
import { WasteReuseDashboard } from "@/components/waste/WasteReuseDashboard";
import { WasteDisposalDashboard } from "@/components/waste/WasteDisposalDashboard";
import { 
  calculateTotalWasteGeneration, 
  calculateRecyclingByMaterial 
} from "@/services/wasteManagement";
import { calculateWasteReusePercentage } from "@/services/wasteReuse";
import { calculateWasteDisposalPercentage } from "@/services/wasteDisposal";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { exportWasteData } from "@/services/dataExport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function MonitoramentoResiduos() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: wasteData, isLoading } = useQuery({
    queryKey: ['waste-monitoring', selectedYear],
    queryFn: () => calculateTotalWasteGeneration(selectedYear),
  });

  const { data: recyclingData } = useQuery({
    queryKey: ['waste-recycling', selectedYear],
    queryFn: () => calculateRecyclingByMaterial(selectedYear),
    enabled: !!wasteData && wasteData.total_generated_tonnes > 0,
  });

  const { data: reuseData } = useQuery({
    queryKey: ['waste-reuse', selectedYear],
    queryFn: () => calculateWasteReusePercentage(selectedYear),
    enabled: !!wasteData && wasteData.total_generated_tonnes > 0,
  });

  const { data: disposalData } = useQuery({
    queryKey: ['waste-disposal', selectedYear],
    queryFn: () => calculateWasteDisposalPercentage(selectedYear),
    enabled: !!wasteData && wasteData.total_generated_tonnes > 0,
  });

  const handleExport = async () => {
    try {
      await exportWasteData({
        year: selectedYear,
        companyName: 'Empresa',
        reportTitle: `Relatório de Resíduos ${selectedYear}`,
        includeMetadata: true
      });
      
      toast.success('Dados exportados com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar dados');
    }
  };

  if (isLoading) {
    return <EnhancedLoading text="Carregando dados de resíduos..." />;
  }

  const totalWaste = wasteData?.total_generated_tonnes || 0;
  const recyclingPercent = recyclingData?.recycling_percentage || 0;
  const reusePercent = reuseData?.reuse_percentage || 0;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Trash2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Monitoramento de Resíduos</h1>
              <p className="text-muted-foreground">
                Gestão contínua de resíduos sólidos (GRI 306)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value) || currentYear)}
                className="w-24"
                min={2020}
                max={currentYear}
              />
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {totalWaste > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Gerado</CardDescription>
                <CardTitle className="text-2xl">
                  {totalWaste.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">GRI 306-3</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>% Reciclado</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {recyclingPercent.toFixed(1)}%
                  {recyclingPercent >= 50 && <Recycle className="h-5 w-5 text-green-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={recyclingPercent >= 50 ? "default" : "secondary"}>GRI 306-4</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>% Reutilizado</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {reusePercent.toFixed(1)}%
                  {reusePercent >= 10 && <TrendingUp className="h-5 w-5 text-blue-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Economia Circular</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Zero Waste Progress</CardDescription>
                <CardTitle className="text-2xl">
                  {((recyclingPercent + reusePercent) / 2).toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Meta: 90%</Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="register">Registrar Resíduos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {wasteData && totalWaste > 0 ? (
              <>
                <WasteTotalGenerationDashboard
                  wasteData={wasteData}
                  year={selectedYear}
                />
                
                {recyclingData && (
                  <WasteRecyclingDashboard
                    recyclingData={recyclingData}
                    year={selectedYear}
                  />
                )}
                
                {reuseData && (
                  <WasteReuseDashboard
                    reuseData={reuseData}
                    year={selectedYear}
                  />
                )}
                
                {disposalData && (
                  <WasteDisposalDashboard
                    disposalData={disposalData}
                    year={selectedYear}
                  />
                )}
              </>
            ) : (
              <Alert>
                <Trash2 className="h-4 w-4" />
                <AlertDescription>
                  Nenhum dado de resíduos registrado para {selectedYear}. 
                  Use a aba "Registrar Resíduos" ou acesse o módulo de Resíduos.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Destinação de Resíduos</CardTitle>
                <CardDescription>
                  Acesse o módulo completo de gestão de resíduos para registrar destinações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col items-start p-4"
                    onClick={() => navigate('/residuos/registrar-destinacao')}
                  >
                    <div className="font-semibold mb-1">Registrar Destinação</div>
                    <div className="text-xs text-muted-foreground text-left">
                      Adicionar novo registro de resíduo gerado e sua destinação
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col items-start p-4"
                    onClick={() => navigate('/residuos')}
                  >
                    <div className="font-semibold mb-1">Dashboard de Resíduos</div>
                    <div className="text-xs text-muted-foreground text-left">
                      Visualizar análises completas e histórico
                    </div>
                  </Button>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate('/residuos/registrar-destinacao')}
                >
                  Registrar Nova Destinação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Integration Info */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200">
          <CardHeader>
            <CardTitle className="text-base">✨ Integração Automática com Relatórios</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Todos os dados inseridos no módulo de <strong>Resíduos</strong> são automaticamente 
            consolidados aqui e disponibilizados no <strong>Wizard GRI</strong> para geração de relatórios 
            de sustentabilidade (GRI 306-3, 306-4, 306-5).
          </CardContent>
        </Card>
      </div>
  );
}
