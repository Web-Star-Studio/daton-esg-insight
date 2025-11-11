import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Recycle, TrendingUp, TrendingDown, Info, AlertTriangle, Award, Droplets } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WaterReusePercentageDashboardProps {
  reuseData: {
    reuse_percentage: number;
    reuse_volume_m3: number;
    total_consumption_m3: number;
    baseline_reuse_percentage?: number;
    is_improving?: boolean;
    improvement_percent?: number;
    reuse_by_type: {
      industrial_process: number;
      cooling: number;
      irrigation: number;
      sanitation: number;
      other: number;
    };
  };
  year: number;
}

const REUSE_TYPE_LABELS: Record<string, string> = {
  industrial_process: 'Processo Industrial',
  cooling: 'Resfriamento',
  irrigation: 'Irrigação',
  sanitation: 'Uso Sanitário',
  other: 'Outros'
};

const REUSE_TYPE_COLORS: Record<string, string> = {
  industrial_process: 'hsl(var(--primary))',
  cooling: 'hsl(var(--chart-2))',
  irrigation: 'hsl(var(--chart-3))',
  sanitation: 'hsl(var(--chart-4))',
  other: 'hsl(var(--muted-foreground))'
};

export function WaterReusePercentageDashboard({ reuseData, year }: WaterReusePercentageDashboardProps) {
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 30) return { level: 'Excelente', color: 'bg-green-600', icon: Award };
    if (percentage >= 15) return { level: 'Bom', color: 'bg-blue-600', icon: TrendingUp };
    if (percentage >= 10) return { level: 'Regular', color: 'bg-yellow-600', icon: AlertTriangle };
    return { level: 'Baixo', color: 'bg-red-600', icon: AlertTriangle };
  };

  const performance = getPerformanceLevel(reuseData.reuse_percentage);
  const PerformanceIcon = performance.icon;

  // Preparar dados para o gráfico de breakdown
  const breakdownData = Object.entries(reuseData.reuse_by_type)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: REUSE_TYPE_LABELS[key],
      value: Math.round(value * 1000) / 1000,
      percentage: reuseData.reuse_volume_m3 > 0 ? (value / reuseData.reuse_volume_m3) * 100 : 0,
      color: REUSE_TYPE_COLORS[key]
    }))
    .sort((a, b) => b.value - a.value);

  // Benchmarks setoriais
  const benchmarks = [
    { sector: 'Papel e Celulose', range: '60-85%' },
    { sector: 'Mineração', range: '70-90%' },
    { sector: 'Indústria Química', range: '20-35%' },
    { sector: 'Têxtil', range: '15-30%' },
    { sector: 'Alimentos e Bebidas', range: '10-20%' }
  ];

  return (
    <Card className="bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 dark:from-emerald-950/20 dark:via-cyan-950/20 dark:to-blue-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-background/80 backdrop-blur-sm border-2 border-emerald-500">
              <Recycle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Percentual de Água Reutilizada</CardTitle>
              <CardDescription>Economia Circular e Gestão Sustentável - {year}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-sm px-3 py-1">
            GRI 303-3
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Card Principal - Percentual de Reuso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Percentual Principal */}
          <Card className={`border-2 border-emerald-500 ${performance.color} text-white shadow-lg`}>
            <CardContent className="pt-6 text-center">
              <PerformanceIcon className="h-8 w-8 mx-auto mb-3 opacity-90" />
              <div className="text-5xl font-bold mb-2">
                {reuseData.reuse_percentage.toFixed(2)}%
              </div>
              <div className="text-sm font-medium opacity-90 mb-1">
                {performance.level}
              </div>
              <div className="text-xs opacity-80">
                de reuso de água
              </div>
              
              {reuseData.baseline_reuse_percentage !== undefined && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-center gap-2">
                    {reuseData.is_improving ? (
                      <>
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          +{reuseData.improvement_percent?.toFixed(2)}pp vs. {year - 1}
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-sm font-semibold">
                          {reuseData.improvement_percent?.toFixed(2)}pp vs. {year - 1}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volume Reutilizado */}
          <Card className="border bg-background/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <Droplets className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                <Badge variant="secondary" className="text-xs">Volume</Badge>
              </div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                {reuseData.reuse_volume_m3.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-muted-foreground">
                m³ reutilizados
              </div>
              <Progress 
                value={(reuseData.reuse_volume_m3 / reuseData.total_consumption_m3) * 100} 
                className="mt-3 h-2"
              />
            </CardContent>
          </Card>

          {/* Consumo Total */}
          <Card className="border bg-background/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <Badge variant="secondary" className="text-xs">Total</Badge>
              </div>
              <div className="text-3xl font-bold mb-1">
                {reuseData.total_consumption_m3.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-muted-foreground">
                m³ consumidos totais
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Base para cálculo GRI 303-5
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta se reuso for baixo */}
        {reuseData.reuse_percentage < 10 && (
          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>Oportunidade de Melhoria:</strong> O percentual de reuso está abaixo de 10%. 
              Considere implementar sistemas de tratamento de efluentes, captação de água de chuva 
              ou circuitos fechados em processos industriais para aumentar a circularidade hídrica.
            </AlertDescription>
          </Alert>
        )}

        {/* Comparação com Ano Anterior */}
        {reuseData.baseline_reuse_percentage !== undefined && (
          <Card className="border bg-background/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base">Evolução do Reuso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Ano Anterior ({year - 1})</div>
                  <div className="text-2xl font-bold">
                    {reuseData.baseline_reuse_percentage.toFixed(2)}%
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {reuseData.is_improving ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Ano Atual ({year})</div>
                  <div className="text-2xl font-bold">
                    {reuseData.reuse_percentage.toFixed(2)}%
                  </div>
                </div>
                
                <div className={`p-3 rounded-lg ${
                  reuseData.is_improving 
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                }`}>
                  <div className="text-sm font-medium">
                    {reuseData.is_improving ? 'Melhoria' : 'Redução'}
                  </div>
                  <div className="text-xl font-bold">
                    {reuseData.is_improving ? '+' : ''}{reuseData.improvement_percent?.toFixed(2)}pp
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Breakdown por Tipo de Reuso */}
        {breakdownData.length > 0 && (
          <Card className="border bg-background/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base">Breakdown por Tipo de Reuso</CardTitle>
              <CardDescription>
                Distribuição do volume de água reutilizada por aplicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={breakdownData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" unit=" m³" stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={150} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold mb-1">{payload[0].payload.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Volume: {payload[0].value?.toLocaleString('pt-BR')} m³
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payload[0].payload.percentage.toFixed(1)}% do reuso total
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                {breakdownData.map((item) => (
                  <div key={item.name} className="p-3 border rounded-lg bg-background/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                    <div className="text-lg font-bold">
                      {item.value.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.percentage.toFixed(1)}% do reuso
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benchmarks Setoriais */}
        <Card className="border bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Benchmarks Setoriais</CardTitle>
            <CardDescription>
              Referências de percentuais de reuso por setor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {benchmarks.map((benchmark) => (
                <div 
                  key={benchmark.sector} 
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium">{benchmark.sector}</span>
                  <Badge variant="outline">{benchmark.range}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Classificação de Desempenho */}
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Classificação:</strong>{' '}
            <span className="text-green-600 dark:text-green-400">🟢 Excelente ≥30%</span> |{' '}
            <span className="text-blue-600 dark:text-blue-400">🟡 Bom 15-30%</span> |{' '}
            <span className="text-yellow-600 dark:text-yellow-400">🟠 Regular 10-15%</span> |{' '}
            <span className="text-red-600 dark:text-red-400">🔴 Baixo &lt;10%</span>
          </AlertDescription>
        </Alert>

        {/* Nota Metodológica */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Metodologia (GRI 303-3):</strong> Reuso (%) = (Volume de Água Reutilizada / Consumo Total de Água) × 100. 
            O cálculo usa <strong>Consumo</strong> (GRI 303-5 = Retirada - Devolução) como denominador, 
            promovendo práticas de economia circular e redução de dependência de fontes externas.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
