/**
 * Dashboard Dedicado de Reciclagem
 * Análise detalhada de economia circular com foco em materiais recicláveis
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  Recycle, 
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { RecyclingByMaterialResult } from "@/services/wasteManagement";
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

interface WasteRecyclingDashboardProps {
  recyclingData: RecyclingByMaterialResult;
  year: number;
  target?: number; // Meta de reciclagem (%) - opcional
}

export function WasteRecyclingDashboard({ 
  recyclingData, 
  year,
  target = 70 // Meta padrão para Zero Waste
}: WasteRecyclingDashboardProps) {
  
  const {
    total_recycled_tonnes,
    recycling_percentage,
    by_material,
    classification,
    zero_waste_progress,
    comparison_previous_year
  } = recyclingData;
  
  // Cores para materiais
  const materialColors: Record<string, string> = {
    'Papel/Papelão': 'hsl(var(--chart-1))',
    'Plástico': 'hsl(var(--chart-2))',
    'Metal': 'hsl(var(--chart-3))',
    'Vidro': 'hsl(var(--chart-4))',
    'Orgânico': 'hsl(var(--chart-5))',
    'Madeira': 'hsl(25, 95%, 53%)',
    'Eletrônico': 'hsl(var(--chart-1))',
    'Têxtil': 'hsl(280, 65%, 60%)',
    'Outros': 'hsl(var(--muted))'
  };
  
  // Preparar dados para gráfico de pizza
  const pieData = by_material.map(item => ({
    name: item.material,
    value: item.quantity_tonnes,
    percentage: item.percentage_of_recycling
  }));
  
  // Status para certificação Zero Waste
  const getZeroWasteStatus = () => {
    if (zero_waste_progress >= 100) return { icon: CheckCircle2, text: 'Elegível', color: 'text-green-600' };
    if (zero_waste_progress >= 80) return { icon: Target, text: 'Quase lá', color: 'text-blue-600' };
    if (zero_waste_progress >= 50) return { icon: TrendingUp, text: 'Progredindo', color: 'text-yellow-600' };
    return { icon: AlertCircle, text: 'Iniciando', color: 'text-orange-600' };
  };
  
  const zeroWasteStatus = getZeroWasteStatus();
  const ZeroWasteIcon = zeroWasteStatus.icon;
  
  return (
    <div className="space-y-6">
      {/* Hero Card - Percentual de Reciclagem */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <Recycle className="h-8 w-8 text-primary" />
                {recycling_percentage.toFixed(1)}%
              </CardTitle>
              <CardDescription className="text-base">
                Taxa de Reciclagem e Compostagem ({year})
              </CardDescription>
            </div>
            <Badge 
              variant="secondary" 
              className={`${classification.color} px-4 py-2 text-base font-semibold`}
            >
              {classification.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total reciclado */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total reciclado/compostado</span>
            <span className="font-bold text-lg">{total_recycled_tonnes.toFixed(2)} toneladas</span>
          </div>
          
          {/* Comparação com meta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso vs. Meta ({target}%)</span>
              <span className={recycling_percentage >= target ? 'text-green-600 font-semibold' : 'text-yellow-600'}>
                {recycling_percentage >= target ? '✓ Meta atingida' : `Faltam ${(target - recycling_percentage).toFixed(1)}%`}
              </span>
            </div>
            <Progress value={(recycling_percentage / target) * 100} className="h-3" />
          </div>
          
          {/* Comparação ano anterior */}
          {comparison_previous_year && (
            <div className="flex items-center gap-2 pt-2 border-t">
              {comparison_previous_year.is_improving ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-semibold">
                    +{comparison_previous_year.change_percentage.toFixed(1)}% vs. {year - 1}
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-600 font-semibold">
                    {comparison_previous_year.change_percentage.toFixed(1)}% vs. {year - 1}
                  </span>
                </>
              )}
              <span className="text-sm text-muted-foreground">
                (Anterior: {comparison_previous_year.previous_recycling_percentage.toFixed(1)}%)
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Grid de cards secundários */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Zero Waste Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Certificação Zero Waste
            </CardTitle>
            <CardDescription>
              Progresso para certificação (mínimo 70% de desvio de aterro)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ZeroWasteIcon className={`h-5 w-5 ${zeroWasteStatus.color}`} />
                <span className={`font-semibold ${zeroWasteStatus.color}`}>
                  {zeroWasteStatus.text}
                </span>
              </div>
              <span className="text-2xl font-bold">{zero_waste_progress.toFixed(0)}%</span>
            </div>
            <Progress value={zero_waste_progress} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {zero_waste_progress >= 100 
                ? '🎉 Parabéns! Sua organização atende aos critérios mínimos para certificação Zero Waste.'
                : `Faltam ${(100 - zero_waste_progress).toFixed(0)}% para atingir o critério de certificação.`
              }
            </p>
          </CardContent>
        </Card>
        
        {/* Top Material Reciclado */}
        <Card>
          <CardHeader>
            <CardTitle>Material Mais Reciclado</CardTitle>
            <CardDescription>Categoria líder em economia circular</CardDescription>
          </CardHeader>
          <CardContent>
            {by_material.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{by_material[0].icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-xl">{by_material[0].material}</p>
                    <p className="text-sm text-muted-foreground">
                      {by_material[0].quantity_tonnes.toFixed(2)} toneladas
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {by_material[0].percentage_of_recycling.toFixed(1)}%
                  </Badge>
                </div>
                
                {by_material.length > 1 && (
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-xs text-muted-foreground font-semibold">Outros materiais:</p>
                    {by_material.slice(1, 4).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span>{item.material}</span>
                        </span>
                        <span className="text-muted-foreground">
                          {item.quantity_tonnes.toFixed(1)}t ({item.percentage_of_recycling.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Alertas de desempenho */}
      {classification.level === 'low' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Taxa de reciclagem baixa (&lt;30%).</strong> Considere implementar programa de coleta seletiva e treinamento de colaboradores.
          </AlertDescription>
        </Alert>
      )}
      
      {classification.level === 'regular' && (
        <Alert className="border-yellow-600 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>Taxa de reciclagem regular (30-50%).</strong> Há potencial para melhoria através de parcerias com cooperativas e otimização de segregação.
          </AlertDescription>
        </Alert>
      )}
      
      {zero_waste_progress >= 100 && (
        <Alert className="border-green-600 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>Parabéns!</strong> Sua organização atende aos critérios para certificação Zero Waste. Considere iniciar processo de auditoria.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Barras - Quantidade por Material */}
        <Card>
          <CardHeader>
            <CardTitle>Reciclagem por Material (toneladas)</CardTitle>
            <CardDescription>Breakdown de materiais recicláveis</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                by_material.map(item => [
                  item.material,
                  { label: item.material, color: materialColors[item.material] || 'hsl(var(--chart-1))' }
                ])
              )}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={by_material}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="material" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="quantity_tonnes" radius={[8, 8, 0, 0]}>
                    {by_material.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={materialColors[entry.material] || 'hsl(var(--chart-1))'} />
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
            <CardTitle>Composição da Reciclagem</CardTitle>
            <CardDescription>Distribuição percentual por material</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                by_material.map(item => [
                  item.material,
                  { label: item.material, color: materialColors[item.material] || 'hsl(var(--chart-1))' }
                ])
              )}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={materialColors[entry.name] || 'hsl(var(--chart-1))'} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                            <p className="font-semibold">{payload[0].name}</p>
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
            <strong>Fórmula:</strong> Reciclagem (%) = (Resíduos Reciclados + Compostados) / Total Gerado × 100
          </p>
          <p>
            <strong>Classificação Automática:</strong> Materiais classificados por palavras-chave na descrição dos resíduos.
          </p>
          <p>
            <strong>Zero Waste:</strong> Certificação requer mínimo 70% de desvio de aterro (reciclagem + compostagem + recuperação energética).
          </p>
          <p>
            <strong>Compliance GRI:</strong> GRI 306-4 (Resíduos não destinados para disposição final).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
