import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Droplets, TrendingDown, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import type { WaterConsumptionResult } from "@/services/waterManagement";

interface WaterConsumptionDashboardProps {
  waterData: WaterConsumptionResult;
  year: number;
  previousYearData?: WaterConsumptionResult;
}

const SOURCE_COLORS = {
  public_network: '#3b82f6',
  well: '#8b5cf6',
  surface_water: '#06b6d4',
  rainwater: '#0ea5e9',
  reuse: '#22c55e',
  third_party: '#f59e0b',
  other: '#6b7280'
};

export function WaterConsumptionDashboard({ 
  waterData, 
  year,
  previousYearData 
}: WaterConsumptionDashboardProps) {
  
  const calculateVariation = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };
  
  const withdrawalVariation = calculateVariation(
    waterData.total_withdrawal_m3,
    previousYearData?.total_withdrawal_m3
  );
  
  const sourceData = [
    { name: 'Rede Pública', value: waterData.by_source.public_network, color: SOURCE_COLORS.public_network },
    { name: 'Poços', value: waterData.by_source.well, color: SOURCE_COLORS.well },
    { name: 'Rios/Lagos', value: waterData.by_source.surface_water, color: SOURCE_COLORS.surface_water },
    { name: 'Água de Chuva', value: waterData.by_source.rainwater, color: SOURCE_COLORS.rainwater },
    { name: 'Água de Reuso', value: waterData.by_source.reuse, color: SOURCE_COLORS.reuse },
    { name: 'Terceiros', value: waterData.by_source.third_party, color: SOURCE_COLORS.third_party },
    { name: 'Outras', value: waterData.by_source.other, color: SOURCE_COLORS.other }
  ].filter(item => item.value > 0);
  
  const detailedBreakdown = waterData.breakdown
    .sort((a, b) => b.withdrawal_m3 - a.withdrawal_m3)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">Consumo Total de Água</CardTitle>
                <CardDescription className="text-base">
                  Gestão de Recursos Hídricos - {year} (GRI 303)
                </CardDescription>
              </div>
            </div>
            {waterData.water_stressed_areas_m3 > 0 && (
              <Badge variant="outline" className="text-base px-4 py-2 border-2 border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/20">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Área com Estresse Hídrico
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-6 bg-background rounded-lg shadow-sm border-2 border-blue-500">
              <div className="text-4xl font-bold text-blue-600">
                {waterData.total_withdrawal_m3.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                m³ Captados (GRI 303-3)
              </div>
              {withdrawalVariation !== null && (
                <div className={`flex items-center justify-center gap-1 mt-2 ${
                  withdrawalVariation < 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {withdrawalVariation < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  <span className="text-sm font-semibold">{Math.abs(withdrawalVariation).toFixed(1)}%</span>
                </div>
              )}
            </div>
            
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-cyan-600">
                {waterData.total_consumption_m3.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                m³ Consumidos (GRI 303-5)
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {waterData.total_withdrawal_m3 > 0 
                  ? `${Math.round((waterData.total_consumption_m3 / waterData.total_withdrawal_m3) * 100)}% da captação`
                  : '0% da captação'
                }
              </div>
            </div>
            
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-green-600">
                {waterData.total_discharge_m3.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                m³ Devolvidos (GRI 303-4)
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {waterData.total_withdrawal_m3 > 0
                  ? `${Math.round((waterData.total_discharge_m3 / waterData.total_withdrawal_m3) * 100)}% da captação`
                  : '0% da captação'
                }
              </div>
            </div>
            
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-blue-500">
                {waterData.by_quality.freshwater.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                m³ Água Doce
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                ≤1.000 mg/L TDS
              </div>
            </div>
          </div>
          
          {waterData.water_stressed_areas_m3 > 0 && (
            <Alert className="mt-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm">
                <strong>Atenção:</strong> {waterData.water_stressed_areas_m3.toLocaleString()} m³ 
                ({Math.round((waterData.water_stressed_areas_m3 / waterData.total_withdrawal_m3) * 100)}%) 
                foram captados de áreas com estresse hídrico. Considere ações de conservação e uso eficiente.
              </AlertDescription>
            </Alert>
          )}

          {/* Card de Destaque - Água Reutilizada (Economia Circular) */}
          {waterData.by_source.reuse > 0 && (
            <Card className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-emerald-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white">
                    <Droplets className="h-4 w-4" />
                  </div>
                  Água Reutilizada (Economia Circular)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                      {((waterData.by_source.reuse / waterData.total_consumption_m3) * 100).toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      do consumo total
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {waterData.by_source.reuse.toLocaleString()} m³ reutilizados
                    </div>
                  </div>
                  
                  {((waterData.by_source.reuse / waterData.total_consumption_m3) * 100) >= 15 ? (
                    <Badge className="text-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-700">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Boa Prática
                    </Badge>
                  ) : ((waterData.by_source.reuse / waterData.total_consumption_m3) * 100) >= 10 ? (
                    <Badge variant="outline" className="text-lg px-4 py-2 border-2 border-yellow-500 text-yellow-700 dark:text-yellow-400">
                      Oportunidade de Melhoria
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-lg px-4 py-2 border-2 border-orange-500 text-orange-700 dark:text-orange-400">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Baixo Reuso
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sourceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Fonte (GRI 303-3)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} m³`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        
        {detailedBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Principais Fontes de Água</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={detailedBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="source_name" type="category" width={120} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} m³`} />
                  <Bar dataKey="withdrawal_m3" fill="#3b82f6" name="Captação (m³)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breakdown por Fonte de Água</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(waterData.by_source)
              .filter(([_, value]) => value > 0)
              .map(([source, value]) => (
                <div key={source} className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground capitalize">
                    {source.replace('_', ' ')}
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {(value as number).toLocaleString()} m³
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {waterData.total_withdrawal_m3 > 0
                      ? `${Math.round(((value as number) / waterData.total_withdrawal_m3) * 100)}% do total`
                      : '0% do total'
                    }
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Metodologia (GRI 303):</strong> Captação total (GRI 303-3) = soma de água retirada de todas as fontes. 
          Consumo (GRI 303-5) = captação - devolução. Água doce = ≤1.000 mg/L de sólidos dissolvidos totais (TDS).
        </AlertDescription>
      </Alert>
    </div>
  );
}
