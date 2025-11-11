import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Download, Calendar, TrendingUp, Leaf } from "lucide-react";
import { EnergyConsumptionForm } from "@/components/energy/EnergyConsumptionForm";
import { EnergyConsumptionDashboard } from "@/components/energy/EnergyConsumptionDashboard";
import { calculateTotalEnergyConsumption } from "@/services/energyManagement";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { exportEnergyData } from "@/services/dataExport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";

export default function MonitoramentoEnergia() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: energyData, isLoading, refetch } = useQuery({
    queryKey: ['energy-monitoring', selectedYear],
    queryFn: () => calculateTotalEnergyConsumption(selectedYear),
  });

  const { data: previousYearData } = useQuery({
    queryKey: ['energy-monitoring', selectedYear - 1],
    queryFn: () => calculateTotalEnergyConsumption(selectedYear - 1),
    enabled: selectedYear > 2020,
  });

  const handleExport = async () => {
    try {
      await exportEnergyData({
        year: selectedYear,
        companyName: 'Empresa',
        reportTitle: `Relatório de Energia ${selectedYear}`,
        includeMetadata: true
      });
      
      toast.success('Dados exportados com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar dados');
    }
  };

  if (isLoading) {
    return <EnhancedLoading text="Carregando dados de energia..." />;
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <Zap className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Monitoramento de Energia</h1>
              <p className="text-muted-foreground">
                Gestão contínua de consumo energético (GRI 302)
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
        {energyData && energyData.total_consumption_gj > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Consumo Total</CardDescription>
                <CardTitle className="text-2xl">
                  {energyData.total_consumption_gj.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GJ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">GRI 302-1</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Equivalente em kWh</CardDescription>
                <CardTitle className="text-2xl">
                  {(energyData.total_consumption_kwh / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} MWh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{energyData.total_consumption_kwh.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>% Renovável</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {energyData.renewable_percentage.toFixed(1)}%
                  {energyData.renewable_percentage >= 50 && <Leaf className="h-5 w-5 text-green-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={energyData.renewable_percentage >= 50 ? "default" : "secondary"}>
                  {energyData.by_type.renewable.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GJ
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Custo Total</CardDescription>
                <CardTitle className="text-2xl">
                  R$ {energyData.total_cost_brl.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {energyData.total_consumption_kwh > 0 && (
                  <Badge variant="secondary">
                    R$ {(energyData.total_cost_brl / energyData.total_consumption_kwh).toFixed(4)}/kWh
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Intelligent Alerts */}
        <AlertsPanel />

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="register">Registrar Consumo</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {energyData && energyData.total_consumption_gj > 0 ? (
              <EnergyConsumptionDashboard
                energyData={energyData}
                year={selectedYear}
                previousYearData={previousYearData}
              />
            ) : (
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Nenhum dado de energia registrado para {selectedYear}. 
                  Use a aba "Registrar Consumo" para adicionar dados.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <EnergyConsumptionForm
              year={selectedYear}
              onSaved={() => refetch()}
            />
          </TabsContent>
        </Tabs>

        {/* Integration Info */}
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200">
          <CardHeader>
            <CardTitle className="text-base">✨ Integração Automática com Relatórios</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Todos os dados inseridos aqui são automaticamente disponibilizados no{" "}
            <strong>Wizard GRI</strong> para geração de relatórios de sustentabilidade (GRI 302-1: Consumo de energia dentro da organização).
            Não é necessário duplicar entrada de dados.
          </CardContent>
        </Card>
      </div>
  );
}
