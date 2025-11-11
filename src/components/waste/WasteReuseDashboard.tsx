/**
 * Dashboard Dedicado de Reuso
 * 2º nível da hierarquia de resíduos (mais prioritário que reciclagem)
 * GRI 306-4: Preparation for reuse
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  Package,
  Target,
  AlertCircle,
  CheckCircle2,
  Lightbulb
} from "lucide-react";
import { WasteReuseResult } from "@/services/wasteReuse";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface WasteReuseDashboardProps {
  reuseData: WasteReuseResult;
  year: number;
}

export function WasteReuseDashboard({ reuseData, year }: WasteReuseDashboardProps) {
  
  const {
    reuse_percentage,
    reuse_volume_tonnes,
    reuse_by_category,
    performance_classification,
    baseline_reuse_percentage,
    is_improving,
    improvement_percent
  } = reuseData;
  
  // Cores para categorias
  const categoryColors: Record<string, string> = {
    'Embalagens Retornáveis': 'hsl(142, 71%, 45%)',
    'Pallets Reutilizados': 'hsl(25, 95%, 53%)',
    'Containers/Tambores': 'hsl(221, 83%, 53%)',
    'Peças/Componentes': 'hsl(262, 52%, 47%)',
    'Materiais de Construção': 'hsl(43, 96%, 56%)',
    'Outros': 'hsl(var(--muted))'
  };
  
  // Mapear categorias para display
  const categoryMapping: Record<keyof typeof reuse_by_category, string> = {
    packaging: 'Embalagens Retornáveis',
    pallets: 'Pallets Reutilizados',
    containers: 'Containers/Tambores',
    equipment_parts: 'Peças/Componentes',
    construction_materials: 'Materiais de Construção',
    other: 'Outros'
  };
  
  // Preparar dados para gráficos
  const categoryData = Object.entries(reuse_by_category)
    .map(([key, value]) => ({
      category: categoryMapping[key as keyof typeof reuse_by_category],
      quantity: Math.round(value * 1000) / 1000,
      percentage: reuse_volume_tonnes > 0 ? (value / reuse_volume_tonnes) * 100 : 0
    }))
    .filter(item => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);
  
  // Badge de performance
  const getPerformanceBadge = () => {
    const colors = {
      'Excelente': 'bg-green-600 text-white',
      'Bom': 'bg-blue-600 text-white',
      'Regular': 'bg-yellow-600 text-white',
      'Baixo': 'bg-red-600 text-white'
    };
    
    return (
      <Badge className={`${colors[performance_classification]} px-4 py-2 text-base font-semibold`}>
        {performance_classification} (≥{
          performance_classification === 'Excelente' ? '20' :
          performance_classification === 'Bom' ? '10' :
          performance_classification === 'Regular' ? '5' : '0'
        }%)
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Hero Card - Percentual de Reuso */}
      <Card className="border-primary/20 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">2º NÍVEL</span>
                Hierarquia de Resíduos
              </div>
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <Package className="h-8 w-8 text-green-600" />
                {reuse_percentage.toFixed(1)}%
              </CardTitle>
              <CardDescription className="text-base">
                Percentual Destinado ao Reuso ({year})
              </CardDescription>
            </div>
            {getPerformanceBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total reutilizado */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total reutilizado (sem reprocessamento)</span>
            <span className="font-bold text-lg">{reuse_volume_tonnes.toFixed(2)} toneladas</span>
          </div>
          
          {/* Comparação com ano anterior */}
          {baseline_reuse_percentage !== undefined && is_improving !== undefined && (
            <div className="flex items-center gap-2 pt-2 border-t">
              {is_improving ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-semibold">
                    +{improvement_percent?.toFixed(1)}% vs. {year - 1}
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-600 font-semibold">
                    {improvement_percent?.toFixed(1)}% vs. {year - 1}
                  </span>
                </>
              )}
              <span className="text-sm text-muted-foreground">
                (Anterior: {baseline_reuse_percentage.toFixed(1)}%)
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Alertas de performance */}
      {reuse_percentage < 5 && (
        <Alert className="border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900 dark:text-yellow-200">
            <strong>Taxa de reuso baixa (&lt;5%).</strong> Oportunidade: implementar sistema de logística reversa para embalagens e pallets retornáveis.
          </AlertDescription>
        </Alert>
      )}
      
      {reuse_percentage >= 20 && (
        <Alert className="border-green-600 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-200">
            <strong>Excelente desempenho em reuso!</strong> Sua organização está no topo da hierarquia de resíduos, priorizando economia circular.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Grid de informações */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card - Categoria Líder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Categoria Líder em Reuso
            </CardTitle>
            <CardDescription>Material mais reutilizado no período</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-xl">{categoryData[0].category}</p>
                    <p className="text-sm text-muted-foreground">
                      {categoryData[0].quantity.toFixed(2)} toneladas
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {categoryData[0].percentage.toFixed(1)}%
                  </Badge>
                </div>
                
                {categoryData.length > 1 && (
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold">Outras categorias:</p>
                    {categoryData.slice(1, 4).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{item.category}</span>
                        <span className="text-muted-foreground">
                          {item.quantity.toFixed(1)}t ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum dado de reuso disponível</p>
            )}
          </CardContent>
        </Card>
        
        {/* Card - Hierarquia Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Hierarquia de Resíduos
            </CardTitle>
            <CardDescription>Ordem de prioridade (melhor → pior)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-purple-600 text-white px-2 py-1 rounded font-bold">1º</span>
                <span>Não geração (prevenção)</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold bg-green-100 dark:bg-green-950 p-2 rounded">
                <span className="bg-green-600 text-white px-2 py-1 rounded font-bold">2º</span>
                <span>Reuso ⭐ VOCÊ ESTÁ AQUI</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-blue-600 text-white px-2 py-1 rounded font-bold">3º</span>
                <span>Redução</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-cyan-600 text-white px-2 py-1 rounded font-bold">4º</span>
                <span>Reciclagem / Compostagem</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-orange-600 text-white px-2 py-1 rounded font-bold">5º</span>
                <span>Recuperação energética</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-red-600 text-white px-2 py-1 rounded font-bold">6º</span>
                <span>Disposição final (aterro)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Barras - Reuso por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Reuso por Categoria (toneladas)</CardTitle>
            <CardDescription>Breakdown de materiais reutilizados</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                categoryData.map(item => [
                  item.category,
                  { label: item.category, color: categoryColors[item.category] || 'hsl(var(--chart-1))' }
                ])
              )}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="quantity" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.category] || 'hsl(var(--chart-1))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        {/* Gráfico de Pizza - Composição */}
        <Card>
          <CardHeader>
            <CardTitle>Composição do Reuso</CardTitle>
            <CardDescription>Distribuição percentual por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                categoryData.map(item => [
                  item.category,
                  { label: item.category, color: categoryColors[item.category] || 'hsl(var(--chart-1))' }
                ])
              )}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category.split(' ')[0]}: ${percentage.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantity"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={categoryColors[entry.category] || 'hsl(var(--chart-1))'} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                            <p className="font-semibold">{payload[0].payload.category}</p>
                            <p className="text-sm text-muted-foreground">
                              {payload[0].value} toneladas ({payload[0].payload.percentage.toFixed(1)}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Nota metodológica */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">📊 Nota Metodológica</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Fórmula:</strong> Reuso (%) = Resíduos Reutilizados (t) / Total Gerado (t) × 100
          </p>
          <p>
            <strong>Diferença de Reciclagem:</strong> Reuso = limpeza/ajuste simples (sem reprocessamento industrial). Reciclagem = transformação industrial do material.
          </p>
          <p>
            <strong>Hierarquia:</strong> Reuso é o <strong>2º nível</strong> da hierarquia (mais prioritário que reciclagem - 4º nível).
          </p>
          <p>
            <strong>Compliance GRI:</strong> GRI 306-4 (Resíduos não destinados para disposição final - Preparação para reuso).
          </p>
          <p>
            <strong>Exemplos:</strong> Embalagens retornáveis, pallets de logística reversa, containers industriais, peças remanufaturadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
