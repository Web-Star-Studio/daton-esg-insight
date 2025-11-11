import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, Calendar, TrendingUp, TrendingDown, 
  Droplets, Zap, Cloud, Trash2, AlertCircle, CheckCircle,
  ArrowRight, Info
} from "lucide-react";
import { calculateTotalWaterConsumption } from "@/services/waterManagement";
import { calculateTotalEnergyConsumption } from "@/services/energyManagement";
import { calculateTotalGHGEmissions } from "@/services/ghgInventory";
import { calculateTotalWasteGeneration } from "@/services/wasteManagement";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";

export default function MonitoramentoESG() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Buscar dados de todas as áreas
  const { data: waterData, isLoading: waterLoading } = useQuery({
    queryKey: ['water-monitoring-esg', selectedYear],
    queryFn: () => calculateTotalWaterConsumption(selectedYear),
  });

  const { data: energyData, isLoading: energyLoading } = useQuery({
    queryKey: ['energy-monitoring-esg', selectedYear],
    queryFn: () => calculateTotalEnergyConsumption(selectedYear),
  });

  const { data: emissionsData, isLoading: emissionsLoading } = useQuery({
    queryKey: ['emissions-monitoring-esg', selectedYear],
    queryFn: () => calculateTotalGHGEmissions(selectedYear),
  });

  const { data: wasteData, isLoading: wasteLoading } = useQuery({
    queryKey: ['waste-monitoring-esg', selectedYear],
    queryFn: () => calculateTotalWasteGeneration(selectedYear),
  });

  const isLoading = waterLoading || energyLoading || emissionsLoading || wasteLoading;

  // Calcular completude de dados
  const hasWaterData = waterData && waterData.total_withdrawal_m3 > 0;
  const hasEnergyData = energyData && energyData.total_consumption_gj > 0;
  const hasEmissionsData = emissionsData && emissionsData.grand_total > 0;
  const hasWasteData = wasteData && wasteData.total_generated_tonnes > 0;

  const dataCompleteness = [
    hasWaterData,
    hasEnergyData,
    hasEmissionsData,
    hasWasteData
  ].filter(Boolean).length;

  const completenessPercent = (dataCompleteness / 4) * 100;

  if (isLoading) {
    return <EnhancedLoading text="Carregando dashboard ESG..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Monitoramento ESG Unificado</h1>
            <p className="text-muted-foreground">
              Central de dados ambientais e indicadores de sustentabilidade
            </p>
          </div>
        </div>
        
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
      </div>

      {/* Completude de Dados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Completude de Dados {selectedYear}</CardTitle>
              <CardDescription>
                {dataCompleteness} de 4 áreas com dados registrados
              </CardDescription>
            </div>
            <Badge variant={completenessPercent === 100 ? "default" : "secondary"}>
              {completenessPercent.toFixed(0)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completenessPercent} className="h-2" />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Água', hasData: hasWaterData, icon: Droplets },
              { name: 'Energia', hasData: hasEnergyData, icon: Zap },
              { name: 'Emissões', hasData: hasEmissionsData, icon: Cloud },
              { name: 'Resíduos', hasData: hasWasteData, icon: Trash2 }
            ].map((area) => (
              <div key={area.name} className="flex items-center gap-2">
                {area.hasData ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
                <span className="text-sm">{area.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Água */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/monitoramento-agua')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Droplets className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Água</CardTitle>
                  <CardDescription>GRI 303</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasWaterData ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Captação Total</span>
                    <span className="font-semibold">
                      {waterData.total_withdrawal_m3.toLocaleString('pt-BR')} m³
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Consumo</span>
                    <span className="font-semibold">
                      {waterData.total_consumption_m3.toLocaleString('pt-BR')} m³
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">% Reutilização</span>
                    <span className="font-semibold text-green-600">
                      {((waterData.by_source.reuse / waterData.total_consumption_m3) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="w-full justify-center">
                  Dados disponíveis ✓
                </Badge>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum dado registrado para {selectedYear}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Card Energia */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/monitoramento-energia')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Zap className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Energia</CardTitle>
                  <CardDescription>GRI 302</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasEnergyData ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Consumo Total</span>
                    <span className="font-semibold">
                      {energyData.total_consumption_gj.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GJ
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Em MWh</span>
                    <span className="font-semibold">
                      {(energyData.total_consumption_kwh / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} MWh
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">% Renovável</span>
                    <span className={`font-semibold ${energyData.renewable_percentage >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                      {energyData.renewable_percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="w-full justify-center">
                  Dados disponíveis ✓
                </Badge>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum dado registrado para {selectedYear}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Card Emissões */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/monitoramento-emissoes')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-500/10">
                  <Cloud className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Emissões GEE</CardTitle>
                  <CardDescription>GRI 305</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasEmissionsData ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Emissões Totais</span>
                    <span className="font-semibold">
                      {emissionsData.grand_total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tCO₂e
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Escopo 1</span>
                    <span className="font-semibold">
                      {emissionsData.scope_1.total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tCO₂e
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Escopo 2</span>
                    <span className="font-semibold">
                      {emissionsData.scope_2.total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} tCO₂e
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="w-full justify-center">
                  Dados disponíveis ✓
                </Badge>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum dado registrado para {selectedYear}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Card Resíduos */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/monitoramento-residuos')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Trash2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Resíduos</CardTitle>
                  <CardDescription>GRI 306</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasWasteData ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Gerado</span>
                    <span className="font-semibold">
                      {wasteData.total_generated_tonnes.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reciclagem</span>
                    <span className="font-semibold">
                      {wasteData.by_treatment.recycling.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aterro</span>
                    <span className="font-semibold text-amber-600">
                      {wasteData.by_treatment.landfill.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="w-full justify-center">
                  Dados disponíveis ✓
                </Badge>
              </>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum dado registrado para {selectedYear}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximas Ações */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Próximas Ações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!hasWaterData && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/monitoramento-agua')}
            >
              <Droplets className="h-4 w-4 mr-2" />
              Registrar dados de água para {selectedYear}
            </Button>
          )}
          {!hasEnergyData && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/monitoramento-energia')}
            >
              <Zap className="h-4 w-4 mr-2" />
              Registrar dados de energia para {selectedYear}
            </Button>
          )}
          {!hasEmissionsData && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/monitoramento-emissoes')}
            >
              <Cloud className="h-4 w-4 mr-2" />
              Registrar dados de emissões para {selectedYear}
            </Button>
          )}
          {!hasWasteData && (
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/monitoramento-residuos')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Registrar dados de resíduos para {selectedYear}
            </Button>
          )}
          {dataCompleteness === 4 && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                ✓ Todos os dados de {selectedYear} estão completos! Você pode gerar relatórios GRI.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Info sobre integração */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">✨ Integração Automática com Relatórios GRI</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Todos os dados visualizados aqui são automaticamente consolidados e disponibilizados no{" "}
          <strong>Wizard GRI</strong> para geração de relatórios de sustentabilidade. 
          Não é necessário duplicar entrada de dados entre os módulos de monitoramento e o wizard de relatórios.
        </CardContent>
      </Card>
    </div>
  );
}
