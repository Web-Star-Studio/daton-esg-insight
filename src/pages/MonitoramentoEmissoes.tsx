import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud, Download, Calendar, AlertCircle, TrendingDown } from "lucide-react";
import { GHGTotalEmissionsDashboard } from "@/components/reports/GHGTotalEmissionsDashboard";
import { calculateTotalGHGEmissions, generateInventorySummary } from "@/services/ghgInventory";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { exportEmissionsData } from "@/services/dataExport";
import { toast } from "sonner";

export default function MonitoramentoEmissoes() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: emissionsData, isLoading } = useQuery({
    queryKey: ['emissions-monitoring', selectedYear],
    queryFn: () => calculateTotalGHGEmissions(selectedYear),
  });

  const { data: previousYearData } = useQuery({
    queryKey: ['emissions-monitoring', selectedYear - 1],
    queryFn: () => calculateTotalGHGEmissions(selectedYear - 1),
    enabled: selectedYear > 2020,
  });

  const { data: inventorySummary } = useQuery({
    queryKey: ['inventory-summary', selectedYear],
    queryFn: () => generateInventorySummary(selectedYear),
    enabled: !!emissionsData && emissionsData.grand_total > 0,
  });

  const handleExport = async () => {
    try {
      await exportEmissionsData({
        year: selectedYear,
        companyName: 'Empresa',
        reportTitle: `Relatório de Emissões GEE ${selectedYear}`,
        includeMetadata: true
      });
      
      toast.success('Dados exportados com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar dados');
    }
  };

  if (isLoading) {
    return <EnhancedLoading text="Carregando dados de emissões..." />;
  }

  const scope1 = emissionsData?.scope_1?.total || 0;
  const scope2 = emissionsData?.scope_2?.total || 0;
  const scope3 = emissionsData?.scope_3?.total || 0;
  const totalEmissions = scope1 + scope2 + scope3;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-slate-500/10">
              <Cloud className="h-8 w-8 text-slate-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Monitoramento de Emissões GEE</h1>
              <p className="text-muted-foreground">
                Inventário contínuo de gases de efeito estufa (GRI 305)
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
        {totalEmissions > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Emissões Totais</CardDescription>
                <CardTitle className="text-2xl">
                  {totalEmissions.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tCO₂e
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">GRI 305-1, 305-2, 305-3</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Escopo 1 (Diretas)</CardDescription>
                <CardTitle className="text-2xl">
                  {scope1.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tCO₂e
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">
                  {totalEmissions > 0 ? ((scope1 / totalEmissions) * 100).toFixed(1) : '0'}%
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Escopo 2 (Energia)</CardDescription>
                <CardTitle className="text-2xl">
                  {scope2.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tCO₂e
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">
                  {totalEmissions > 0 ? ((scope2 / totalEmissions) * 100).toFixed(1) : '0'}%
                </Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Escopo 3 (Cadeia)</CardDescription>
                <CardTitle className="text-2xl">
                  {scope3.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tCO₂e
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">
                  {totalEmissions > 0 ? ((scope3 / totalEmissions) * 100).toFixed(1) : '0'}%
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="register">Registrar Emissões</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {emissionsData && totalEmissions > 0 ? (
              <GHGTotalEmissionsDashboard
                emissionsData={emissionsData}
                year={selectedYear}
                previousYearData={previousYearData}
                inventorySummary={inventorySummary}
              />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum dado de emissões registrado para {selectedYear}. 
                  Use o <strong>Inventário GEE</strong> para adicionar dados de atividades emissoras.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Dados de Emissões</CardTitle>
                <CardDescription>
                  Para registrar emissões, você precisa cadastrar atividades emissoras no módulo de Inventário GEE
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col items-start p-4"
                    onClick={() => navigate('/inventario-gee')}
                  >
                    <div className="font-semibold mb-1">Escopo 1</div>
                    <div className="text-xs text-muted-foreground text-left">
                      Combustão estacionária, transporte próprio, emissões fugitivas
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col items-start p-4"
                    onClick={() => navigate('/inventario-gee')}
                  >
                    <div className="font-semibold mb-1">Escopo 2</div>
                    <div className="text-xs text-muted-foreground text-left">
                      Energia elétrica comprada
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col items-start p-4"
                    onClick={() => navigate('/inventario-gee')}
                  >
                    <div className="font-semibold mb-1">Escopo 3</div>
                    <div className="text-xs text-muted-foreground text-left">
                      Transporte de terceiros, resíduos, viagens, cadeia de suprimentos
                    </div>
                  </Button>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate('/inventario-gee')}
                >
                  Ir para Inventário GEE
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Integration Info */}
        <Card className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">✨ Integração Automática com Relatórios</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Todos os dados de emissões calculados no <strong>Inventário GEE</strong> são automaticamente 
            consolidados aqui e disponibilizados no <strong>Wizard GRI</strong> para geração de relatórios 
            de sustentabilidade (GRI 305-1, 305-2, 305-3).
          </CardContent>
        </Card>
      </div>
  );
}
