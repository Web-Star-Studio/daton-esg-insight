import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingDown, TrendingUp, Target, CheckCircle, 
  AlertTriangle, Info 
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import type { GHGReductionTarget } from "@/services/ghgInventory";

interface GHGReductionGoalDashboardProps {
  reductionData: GHGReductionTarget;
  yearlyEmissions?: Array<{ year: number; emissions: number }>;
}

export function GHGReductionGoalDashboard({ 
  reductionData, 
  yearlyEmissions = [] 
}: GHGReductionGoalDashboardProps) {
  const progressPercent = reductionData.target_reduction_percent > 0
    ? (reductionData.current_reduction_percent / reductionData.target_reduction_percent) * 100
    : 0;
  
  const emissionsReduced = reductionData.base_year_emissions - reductionData.current_emissions;
  const emissionsToTarget = reductionData.current_emissions - reductionData.target_emissions;
  
  // Dados para gráfico temporal
  const chartData = yearlyEmissions.map(ye => ({
    year: ye.year,
    emissions: ye.emissions,
    target: ye.year <= reductionData.target_year 
      ? reductionData.base_year_emissions - 
        (reductionData.required_annual_reduction * (ye.year - reductionData.base_year) / 100 * reductionData.base_year_emissions)
      : null
  }));
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-600" />
              <div>
                <CardTitle className="text-2xl">Meta de Redução de GEE</CardTitle>
                <CardDescription className="text-base">
                  Ano Base: {reductionData.base_year} | Meta: {reductionData.target_year}
                </CardDescription>
              </div>
            </div>
            {reductionData.is_on_track ? (
              <Badge variant="default" className="text-base px-4 py-2 bg-success text-success-foreground">
                <CheckCircle className="h-4 w-4 mr-2" />
                No Caminho Certo
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-base px-4 py-2">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Atenção Necessária
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Redução Atual */}
            <div className="text-center p-6 bg-background rounded-lg shadow-sm border-2 border-green-500">
              <div className="text-4xl font-bold text-green-600">
                {reductionData.current_reduction_percent.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Redução Atual</div>
              <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs">{emissionsReduced.toFixed(0)} tCO₂e reduzidas</span>
              </div>
            </div>
            
            {/* Meta de Redução */}
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-primary">
                {reductionData.target_reduction_percent}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Meta de Redução</div>
              <div className="text-xs text-muted-foreground mt-2">
                Até {reductionData.target_year}
              </div>
            </div>
            
            {/* Progresso */}
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold">
                {Math.round(progressPercent)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">Progresso da Meta</div>
              <Progress value={Math.min(progressPercent, 100)} className="mt-2" />
            </div>
            
            {/* Emissões Atuais */}
            <div className="text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="text-3xl font-bold">
                {reductionData.current_emissions.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">tCO₂e Atuais</div>
              <div className="text-xs text-muted-foreground mt-2">
                Base: {reductionData.base_year_emissions.toFixed(0)} tCO₂e
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução de Emissões vs Meta</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis label={{ value: 'tCO₂e', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <ReferenceLine 
                  y={reductionData.target_emissions} 
                  stroke="#22c55e" 
                  strokeDasharray="3 3"
                  label="Meta Final" 
                />
                <Line 
                  type="monotone" 
                  dataKey="emissions" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Emissões Reais"
                  dot={{ r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Trajetória Meta"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Análise de Trajetória */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Redução Anual Necessária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Necessária (meta)</span>
                <span className="text-2xl font-bold text-primary">
                  {reductionData.required_annual_reduction.toFixed(2)}%/ano
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Realizada (atual)</span>
                <span className={`text-2xl font-bold ${
                  reductionData.actual_annual_reduction >= reductionData.required_annual_reduction
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {reductionData.actual_annual_reduction.toFixed(2)}%/ano
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Caminho até a Meta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Emissões a reduzir</span>
                <span className="text-2xl font-bold">
                  {Math.max(0, emissionsToTarget).toFixed(0)} tCO₂e
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Anos restantes</span>
                <span className="text-2xl font-bold">
                  {Math.max(0, reductionData.target_year - reductionData.current_year)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Status */}
      {!reductionData.is_on_track && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> A taxa de redução atual ({reductionData.actual_annual_reduction.toFixed(2)}%/ano) 
            está abaixo da necessária ({reductionData.required_annual_reduction.toFixed(2)}%/ano) 
            para atingir a meta de {reductionData.target_reduction_percent}% até {reductionData.target_year}. 
            Considere implementar ações adicionais de mitigação.
          </AlertDescription>
        </Alert>
      )}

      {/* Nota Metodológica */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Metodologia:</strong> Redução calculada pela fórmula: 
          (Emissões Ano Base - Emissões Ano Atual) / Emissões Ano Base × 100. 
          A meta está "No Caminho Certo" se a redução atual for ≥ 90% da redução esperada 
          para o período decorrido.
        </AlertDescription>
      </Alert>
    </div>
  );
}
