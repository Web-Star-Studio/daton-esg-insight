import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplets, Download, Calendar, TrendingUp } from "lucide-react";
import { WaterConsumptionForm } from "@/components/water/WaterConsumptionForm";
import { WaterConsumptionDashboard } from "@/components/water/WaterConsumptionDashboard";
import { calculateTotalWaterConsumption } from "@/services/waterManagement";
import { exportWaterData } from "@/services/dataExport";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MonitoramentoAgua() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [exporting, setExporting] = useState(false);

  const { data: waterData, isLoading, refetch } = useQuery({
    queryKey: ['water-monitoring', selectedYear],
    queryFn: () => calculateTotalWaterConsumption(selectedYear),
  });

  const { data: previousYearData } = useQuery({
    queryKey: ['water-monitoring', selectedYear - 1],
    queryFn: () => calculateTotalWaterConsumption(selectedYear - 1),
    enabled: selectedYear > 2020,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportWaterData({
        year: selectedYear,
        reportTitle: `Monitoramento de Água - ${selectedYear}`,
        companyName: 'Empresa', // Pode ser dinamicamente obtido do perfil
        includeMetadata: true
      });
      toast.success('Dados de água exportados com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar dados');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return <EnhancedLoading text="Carregando dados de água..." />;
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Droplets className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Monitoramento de Água</h1>
              <p className="text-muted-foreground">
                Gestão contínua de recursos hídricos (GRI 303)
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
            <Button variant="outline" onClick={handleExport} disabled={exporting || !waterData || waterData.total_withdrawal_m3 === 0}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exportando...' : 'Exportar'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {waterData && waterData.total_withdrawal_m3 > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Captação Total</CardDescription>
                <CardTitle className="text-2xl">{waterData.total_withdrawal_m3.toLocaleString()} m³</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">GRI 303-3</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Consumo Total</CardDescription>
                <CardTitle className="text-2xl">{waterData.total_consumption_m3.toLocaleString()} m³</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">GRI 303-5</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Água Devolvida</CardDescription>
                <CardTitle className="text-2xl">{waterData.total_discharge_m3.toLocaleString()} m³</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">GRI 303-4</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>% Reutilização</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {waterData.total_consumption_m3 > 0 
                    ? ((waterData.by_source.reuse / waterData.total_consumption_m3) * 100).toFixed(1)
                    : '0.0'}%
                  {waterData.by_source.reuse > 0 && <TrendingUp className="h-5 w-5 text-green-600" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Economia Circular</Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="register">Registrar Consumo</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {waterData && waterData.total_withdrawal_m3 > 0 ? (
              <WaterConsumptionDashboard
                waterData={waterData}
                year={selectedYear}
                previousYearData={previousYearData}
              />
            ) : (
              <Alert>
                <Droplets className="h-4 w-4" />
                <AlertDescription>
                  Nenhum dado de água registrado para {selectedYear}. 
                  Use a aba "Registrar Consumo" para adicionar dados.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <WaterConsumptionForm
              year={selectedYear}
              onSaved={() => refetch()}
            />
          </TabsContent>
        </Tabs>

        {/* Integration Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">✨ Integração Automática com Relatórios</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Todos os dados inseridos aqui são automaticamente disponibilizados no{" "}
            <strong>Wizard GRI</strong> para geração de relatórios de sustentabilidade.
            Não é necessário duplicar entrada de dados.
          </CardContent>
        </Card>
      </div>
  );
}
