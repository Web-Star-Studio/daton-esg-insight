import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, TrendingDown, TrendingUp, Leaf, Info } from "lucide-react";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import type { EnergyConsumptionResult } from "@/services/energyManagement";

interface EnergyConsumptionDashboardProps {
  energyData: EnergyConsumptionResult;
  year: number;
  previousYearData?: EnergyConsumptionResult;
}

const SOURCE_COLORS = {
  grid: '#f59e0b',
  solar: '#fbbf24',
  diesel: '#ef4444',
  gasoline: '#dc2626',
  natural_gas: '#3b82f6',
  biomass: '#22c55e',
  other: '#6b7280'
};

export function EnergyConsumptionDashboard({ 
  energyData, 
  year,
  previousYearData 
}: EnergyConsumptionDashboardProps) {
  
  const calculateVariation = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };
  
  const consumptionVariation = calculateVariation(
    energyData.total_consumption_gj,
    previousYearData?.total_consumption_gj
  );
  
  const sourceData = [
    { name: 'Rede Elétrica', value: energyData.by_source.grid, color: SOURCE_COLORS.grid },
    { name: 'Solar', value: energyData.by_source.solar, color: SOURCE_COLORS.solar },
    { name: 'Diesel', value: energyData.by_source.diesel, color: SOURCE_COLORS.diesel },
    { name: 'Gasolina', value: energyData.by_source.gasoline, color: SOURCE_COLORS.gasoline },
    { name: 'Gás Natural', value: energyData.by_source.natural_gas, color: SOURCE_COLORS.natural_gas },
    { name: 'Biomassa', value: energyData.by_source.biomass, color: SOURCE_COLORS.biomass },
    { name: 'Outras', value: energyData.by_source.other, color: SOURCE_COLORS.other }
  ].filter(item => item.value > 0);
  
  const topSources = energyData.breakdown
    .sort((a, b) => b.consumption_gj - a.consumption_gj)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-2 border-amber-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-amber-600" />
              <div>
                <CardTitle className="text-2xl">Consumo Total de Energia</CardTitle>
                <CardDescription className="text-base">
                  Gestão Energética - {year} (GRI 302-1)
                </CardDescription>
              </div>
            </div>
            {energyData.renewable_percentage >= 50 && (
              <Badge variant="outline" className="text-base px-4 py-2 border-2 border-green-500 bg-green-50 text-green-700 dark:bg-green-950/20">
                <Leaf className="h-4 w-4 mr-2" />
                Alta Renovabilidade
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-6 bg-background rounded-lg shadow-sm border-2 border-amber-500">
              <div className="text-4xl font-bold text-amber-600">
                {energyData.total_consumption_gj.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                GJ Consumidos (GRI 302-1)
              </div>
              {consumptionVariation !== null && (
                <div className={`flex items-center justify-center gap-1 mt-2 ${
                  consumptionVariation < 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {consumptionVariation < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  <span className="text-sm font-semibold">{Math.abs(consumptionVariation).toFixed(1)}%</span>
                </div>
              )}
            </div>
            
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-yellow-600">
                {energyData.total_consumption_kwh.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                kWh Equivalentes
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {(energyData.total_consumption_kwh / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} MWh
              </div>
            </div>
            
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-green-600">
                {energyData.renewable_percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Energia Renovável
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {energyData.by_type.renewable.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GJ
              </div>
            </div>
            
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-blue-600">
                R$ {energyData.total_cost_brl.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Custo Total
              </div>
              {energyData.total_consumption_kwh > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  R$ {(energyData.total_cost_brl / energyData.total_consumption_kwh).toFixed(4)}/kWh
                </div>
              )}
            </div>
          </div>
          
          {energyData.renewable_percentage > 0 && (
            <Card className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-emerald-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white">
                    <Leaf className="h-4 w-4" />
                  </div>
                  Matriz Energética Renovável
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                      {energyData.renewable_percentage.toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      da energia consumida
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {energyData.by_type.renewable.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GJ renováveis
                    </div>
                  </div>
                  
                  {energyData.renewable_percentage >= 50 ? (
                    <Badge className="text-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-700">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Excelente
                    </Badge>
                  ) : energyData.renewable_percentage >= 25 ? (
                    <Badge variant="outline" className="text-lg px-4 py-2 border-2 border-green-500 text-green-700 dark:text-green-400">
                      Boa Performance
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-lg px-4 py-2 border-2 border-yellow-500 text-yellow-700 dark:text-yellow-400">
                      Oportunidade
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {energyData.energy_intensity_gj_per_revenue && (
            <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong>Intensidade Energética:</strong>{' '}
                {energyData.energy_intensity_gj_per_revenue.toFixed(4)} GJ/R$ de receita
                {energyData.energy_intensity_gj_per_unit && (
                  <> | {energyData.energy_intensity_gj_per_unit.toFixed(4)} GJ/unidade produzida</>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sourceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Fonte</CardTitle>
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
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GJ`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        
        {topSources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 Fontes de Energia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="source_type" type="category" width={120} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GJ`} />
                  <Bar dataKey="consumption_gj" fill="#f59e0b" name="Consumo (GJ)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Metodologia (GRI 302-1):</strong> Consumo total de energia dentro da organização, incluindo combustíveis e eletricidade. 
          GJ (Gigajoules) é a unidade padrão do GRI. 1 GJ = 277,78 kWh.
        </AlertDescription>
      </Alert>
    </div>
  );
}
