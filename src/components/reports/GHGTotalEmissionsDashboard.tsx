import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wind, TrendingUp, TrendingDown, 
  Award, Info, Leaf
} from "lucide-react";
import { 
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { EmissionsByScope } from "@/services/ghgInventory";

interface GHGTotalEmissionsDashboardProps {
  emissionsData: EmissionsByScope;
  year: number;
  previousYearData?: EmissionsByScope;
  inventorySummary?: any;
}

const SCOPE_COLORS = {
  scope_1: '#ef4444',
  scope_2: '#f97316',
  scope_3: '#eab308',
  biogenic: '#22c55e'
};

export function GHGTotalEmissionsDashboard({ 
  emissionsData, 
  year, 
  previousYearData,
  inventorySummary
}: GHGTotalEmissionsDashboardProps) {
  
  const calculateVariation = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };
  
  const scope1Variation = calculateVariation(
    emissionsData.scope_1.total, 
    previousYearData?.scope_1.total
  );
  
  const scope2Variation = calculateVariation(
    emissionsData.scope_2.total, 
    previousYearData?.scope_2.total
  );
  
  const totalVariation = calculateVariation(
    emissionsData.grand_total,
    previousYearData?.grand_total
  );
  
  const scopePieData = [
    { name: 'Escopo 1', value: emissionsData.scope_1.total, color: SCOPE_COLORS.scope_1 },
    { name: 'Escopo 2', value: emissionsData.scope_2.total, color: SCOPE_COLORS.scope_2 },
    { name: 'Escopo 3', value: emissionsData.scope_3.total, color: SCOPE_COLORS.scope_3 },
  ].filter(item => item.value > 0);
  
  const scope1BreakdownData = [
    { name: 'Combustão Estacionária', value: emissionsData.scope_1.stationary_combustion },
    { name: 'Combustão Móvel', value: emissionsData.scope_1.mobile_combustion },
    { name: 'Emissões Fugitivas', value: emissionsData.scope_1.fugitive_emissions },
    { name: 'Processos Industriais', value: emissionsData.scope_1.industrial_processes },
    { name: 'Agricultura', value: emissionsData.scope_1.agriculture },
  ].filter(item => item.value > 0);
  
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wind className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Emissões de GEE Totais</CardTitle>
                <CardDescription className="text-base">
                  Inventário de Gases de Efeito Estufa - {year}
                </CardDescription>
              </div>
            </div>
            {inventorySummary?.ghg_protocol_seal && (
              <Badge variant="outline" className="text-lg px-4 py-2 border-2 border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                <Award className="h-5 w-5 mr-2" />
                Selo {inventorySummary.ghg_protocol_seal}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 text-center p-6 bg-background rounded-lg shadow-sm border-2 border-primary">
              <div className="text-4xl font-bold text-primary">
                {emissionsData.grand_total.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                tCO₂e Total
              </div>
              {totalVariation !== null && (
                <div className={`flex items-center justify-center gap-1 mt-2 ${totalVariation < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalVariation < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  <span className="text-sm font-semibold">{Math.abs(totalVariation).toFixed(1)}%</span>
                </div>
              )}
            </div>
            
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold" style={{ color: SCOPE_COLORS.scope_1 }}>
                {emissionsData.scope_1.total.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Escopo 1 (Diretas)
              </div>
              {scope1Variation !== null && (
                <div className={`flex items-center justify-center gap-1 mt-2 ${scope1Variation < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scope1Variation < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  <span className="text-xs font-semibold">{Math.abs(scope1Variation).toFixed(1)}%</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                {emissionsData.grand_total > 0 ? Math.round((emissionsData.scope_1.total / emissionsData.grand_total) * 100) : 0}% do total
              </div>
            </div>
            
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold" style={{ color: SCOPE_COLORS.scope_2 }}>
                {emissionsData.scope_2.total.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Escopo 2 (Energia)
              </div>
              {scope2Variation !== null && (
                <div className={`flex items-center justify-center gap-1 mt-2 ${scope2Variation < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scope2Variation < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                  <span className="text-xs font-semibold">{Math.abs(scope2Variation).toFixed(1)}%</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                {emissionsData.grand_total > 0 ? Math.round((emissionsData.scope_2.total / emissionsData.grand_total) * 100) : 0}% do total
              </div>
            </div>
            
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold" style={{ color: SCOPE_COLORS.scope_3 }}>
                {emissionsData.scope_3.total.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Escopo 3 (Outras)
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {emissionsData.grand_total > 0 ? Math.round((emissionsData.scope_3.total / emissionsData.grand_total) * 100) : 0}% do total
              </div>
            </div>
          </div>
          
          {emissionsData.biogenic.total > 0 && (
            <Alert className="mt-4 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-sm">
                <strong>Emissões Biogênicas:</strong> {emissionsData.biogenic.total.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} tCO₂e 
                (reportadas separadamente conforme GHG Protocol)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Escopo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scopePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scopePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString('pt-BR')} tCO₂e`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {scope1BreakdownData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhamento Escopo 1</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scope1BreakdownData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString('pt-BR')} tCO₂e`} />
                  <Bar dataKey="value" fill={SCOPE_COLORS.scope_1} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Escopo 1', sources: emissionsData.scope_1.sources, color: SCOPE_COLORS.scope_1 },
          { title: 'Escopo 2', sources: emissionsData.scope_2.sources, color: SCOPE_COLORS.scope_2 },
          { title: 'Escopo 3', sources: emissionsData.scope_3.sources, color: SCOPE_COLORS.scope_3 }
        ].map((scope, idx) => (
          scope.sources.length > 0 && (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: scope.color }}>
                  Top Fontes - {scope.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scope.sources
                    .sort((a, b) => b.emissions - a.emissions)
                    .slice(0, 5)
                    .map((source, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="truncate flex-1 text-muted-foreground">{source.name}</span>
                        <span className="font-semibold ml-2">{source.emissions.toLocaleString('pt-BR')} tCO₂e</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Metodologia:</strong> Inventário calculado segundo {inventorySummary?.methodology || 'GHG Protocol'}. 
          Emissões diretas (Escopo 1), indiretas de energia (Escopo 2) e outras indiretas (Escopo 3). 
          Emissões biogênicas reportadas separadamente. 
          {inventorySummary?.base_year && ` Ano base: ${inventorySummary.base_year}.`}
        </AlertDescription>
      </Alert>
    </div>
  );
}
