import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingDown, TrendingUp, ArrowRight, Info, Activity } from "lucide-react";

interface WaterIntensityDashboardProps {
  intensityData: {
    intensity_per_production?: number;
    intensity_per_revenue?: number;
    total_water_m3: number;
    production_volume?: number;
    production_unit?: string;
    revenue_brl?: number;
    baseline_intensity?: number;
    is_improving?: boolean;
    improvement_percent?: number;
  };
  year: number;
}

export function WaterIntensityDashboard({ intensityData, year }: WaterIntensityDashboardProps) {
  return (
    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-2 border-cyan-500/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-cyan-600" />
          <div>
            <CardTitle className="text-2xl">Intensidade Hídrica (GRI 303-5)</CardTitle>
            <CardDescription className="text-base">
              Eficiência no uso da água por unidade de produção - {year}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Intensidade por Produção */}
          {intensityData.intensity_per_production !== undefined && (
            <div className="p-6 bg-background rounded-lg shadow-sm border-2 border-cyan-500">
              <div className="text-4xl font-bold text-cyan-600">
                {intensityData.intensity_per_production.toFixed(4)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                m³/{intensityData.production_unit || 'unidade'}
              </div>
              {intensityData.is_improving !== null && intensityData.improvement_percent !== undefined && (
                <Badge 
                  variant={intensityData.is_improving ? "default" : "destructive"} 
                  className="mt-3"
                >
                  {intensityData.is_improving ? (
                    <>
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Melhorando {Math.abs(intensityData.improvement_percent).toFixed(1)}%
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Aumentou {Math.abs(intensityData.improvement_percent).toFixed(1)}%
                    </>
                  )}
                </Badge>
              )}
            </div>
          )}
          
          {/* Card 2: Intensidade por Receita */}
          {intensityData.intensity_per_revenue !== undefined && (
            <div className="p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-blue-600">
                {intensityData.intensity_per_revenue.toFixed(4)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                m³/R$ 1.000 de receita
              </div>
              {intensityData.revenue_brl && (
                <div className="text-xs text-muted-foreground mt-2">
                  Receita: R$ {intensityData.revenue_brl.toLocaleString()}
                </div>
              )}
            </div>
          )}
          
          {/* Card 3: Consumo Total */}
          <div className="p-6 bg-background rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-cyan-700">
              {intensityData.total_water_m3.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              m³ consumidos totais
            </div>
            {intensityData.production_volume && (
              <div className="text-xs text-muted-foreground mt-2">
                Produção: {intensityData.production_volume.toLocaleString()} {intensityData.production_unit}
              </div>
            )}
          </div>
        </div>
        
        {/* Comparação com Ano Anterior */}
        {intensityData.baseline_intensity && intensityData.intensity_per_production !== undefined && (
          <div className="p-6 bg-background rounded-lg border-2">
            <h4 className="text-sm font-semibold mb-4">Comparação Ano a Ano</h4>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Ano Anterior ({year - 1})</div>
                <div className="text-2xl font-bold">
                  {intensityData.baseline_intensity.toFixed(4)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  m³/{intensityData.production_unit}
                </div>
              </div>
              
              <ArrowRight className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Ano Atual ({year})</div>
                <div className="text-2xl font-bold">
                  {intensityData.intensity_per_production.toFixed(4)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  m³/{intensityData.production_unit}
                </div>
              </div>
              
              <div className={`flex-shrink-0 p-4 rounded-lg text-center min-w-[100px] ${
                intensityData.is_improving 
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
              }`}>
                {intensityData.is_improving ? (
                  <>
                    <TrendingDown className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-lg font-bold">
                      -{Math.abs(intensityData.improvement_percent || 0).toFixed(1)}%
                    </div>
                    <div className="text-xs mt-1">Melhoria</div>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-6 w-6 mx-auto mb-1" />
                    <div className="text-lg font-bold">
                      +{Math.abs(intensityData.improvement_percent || 0).toFixed(1)}%
                    </div>
                    <div className="text-xs mt-1">Aumento</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Nota Metodológica */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Metodologia (GRI 303-5):</strong> Intensidade Hídrica = Consumo Total de Água (m³) / Unidades Produzidas. 
            <strong> Consumo</strong> = Retirada - Devolução (GRI 303-5), representando a água que não retorna à fonte. 
            Quanto <strong>menor</strong> o valor, mais eficiente é o uso da água.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
