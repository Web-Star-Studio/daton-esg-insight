import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingDown, TrendingUp, ArrowRight, Zap, Info } from "lucide-react";
import type { EnergyIntensityResult } from "@/services/operationalMetrics";

interface EnergyIntensityDashboardProps {
  intensityData: EnergyIntensityResult;
  year: number;
}

export function EnergyIntensityDashboard({ intensityData, year }: EnergyIntensityDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Intensidade Energética (GRI 302-3) - {year}
          </CardTitle>
          <CardDescription>
            Relação entre consumo de energia e produção/operação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Principal: Por Produção */}
            {intensityData.intensity_per_production && (
              <div className="text-center p-4 bg-background rounded-lg shadow-sm border-2 border-primary">
                <div className="text-3xl font-bold text-primary">
                  {intensityData.intensity_per_production.toFixed(4)}
                </div>
                <div className="text-sm text-muted-foreground">
                  kWh/{intensityData.production_unit || 'unidade'}
                </div>
                {intensityData.is_improving && (
                  <Badge variant="default" className="mt-2">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Melhorando
                  </Badge>
                )}
              </div>
            )}
            
            {/* Por Receita */}
            {intensityData.intensity_per_revenue && (
              <div className="text-center p-4 bg-background rounded-lg shadow-sm border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {intensityData.intensity_per_revenue.toFixed(4)}
                </div>
                <div className="text-sm text-muted-foreground">kWh/R$ 1.000</div>
              </div>
            )}
            
            {/* Por Km */}
            {intensityData.intensity_per_km && (
              <div className="text-center p-4 bg-background rounded-lg shadow-sm border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {intensityData.intensity_per_km.toFixed(4)}
                </div>
                <div className="text-sm text-muted-foreground">kWh/km</div>
              </div>
            )}
            
            {/* Por m² */}
            {intensityData.intensity_per_m2 && (
              <div className="text-center p-4 bg-background rounded-lg shadow-sm border border-border">
                <div className="text-2xl font-bold text-foreground">
                  {intensityData.intensity_per_m2.toFixed(4)}
                </div>
                <div className="text-sm text-muted-foreground">kWh/m²</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparação com Ano Anterior */}
      {intensityData.baseline_intensity && intensityData.intensity_variation_percent !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução da Intensidade Energética</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Ano Anterior ({year - 1})</div>
                <div className="text-2xl font-bold text-foreground">
                  {intensityData.baseline_intensity.toFixed(4)} kWh/{intensityData.production_unit}
                </div>
              </div>
              
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              
              <div>
                <div className="text-sm text-muted-foreground">Ano Atual ({year})</div>
                <div className="text-2xl font-bold text-foreground">
                  {intensityData.intensity_per_production?.toFixed(4)} kWh/{intensityData.production_unit}
                </div>
              </div>
              
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                intensityData.is_improving 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {intensityData.is_improving ? (
                  <TrendingDown className="h-5 w-5" />
                ) : (
                  <TrendingUp className="h-5 w-5" />
                )}
                <div className="text-xl font-bold">
                  {Math.abs(intensityData.intensity_variation_percent).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contexto Operacional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contexto Operacional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Consumo Total</div>
              <div className="text-lg font-semibold text-foreground">
                {intensityData.total_energy_kwh.toLocaleString()} kWh
              </div>
            </div>
            {intensityData.production_volume && (
              <div>
                <div className="text-sm text-muted-foreground">Produção</div>
                <div className="text-lg font-semibold text-foreground">
                  {intensityData.production_volume.toLocaleString()} {intensityData.production_unit}
                </div>
              </div>
            )}
            {intensityData.revenue_brl && (
              <div>
                <div className="text-sm text-muted-foreground">Receita</div>
                <div className="text-lg font-semibold text-foreground">
                  R$ {intensityData.revenue_brl.toLocaleString()}
                </div>
              </div>
            )}
            {intensityData.operational_hours && (
              <div>
                <div className="text-sm text-muted-foreground">Horas Operacionais</div>
                <div className="text-lg font-semibold text-foreground">
                  {intensityData.operational_hours.toLocaleString()} h
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Nota Metodológica */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Nota Metodológica (GRI 302-3):</strong> A intensidade energética é calculada dividindo
          o consumo total de energia pela unidade de produção ou operação. Valores menores indicam maior
          eficiência energética. Comparações são válidas apenas dentro do mesmo setor e metodologia.
        </AlertDescription>
      </Alert>
    </div>
  );
}
