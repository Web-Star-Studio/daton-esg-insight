import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Recycle, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Flame,
  Sprout
} from "lucide-react";
import { WasteGenerationResult } from "@/services/wasteManagement";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface WasteTotalGenerationDashboardProps {
  wasteData: WasteGenerationResult;
  year: number;
  intensityData?: {
    intensity_per_production?: number;
    intensity_per_revenue?: number;
    production_unit?: string;
  };
}

const TREATMENT_COLORS = {
  recycling: '#10b981',
  landfill: '#f97316',
  incineration: '#ef4444',
  composting: '#84cc16',
  other: '#6b7280'
};

export function WasteTotalGenerationDashboard({ 
  wasteData, 
  year,
  intensityData 
}: WasteTotalGenerationDashboardProps) {
  
  // Dados para o gráfico de pizza
  const pieData = [
    { name: 'Reciclagem', value: wasteData.by_treatment.recycling, color: TREATMENT_COLORS.recycling },
    { name: 'Aterro', value: wasteData.by_treatment.landfill, color: TREATMENT_COLORS.landfill },
    { name: 'Incineração', value: wasteData.by_treatment.incineration, color: TREATMENT_COLORS.incineration },
    { name: 'Compostagem', value: wasteData.by_treatment.composting, color: TREATMENT_COLORS.composting },
    { name: 'Outros', value: wasteData.by_treatment.other, color: TREATMENT_COLORS.other }
  ].filter(item => item.value > 0);

  // Top 10 tipos de resíduos
  const topWastes = wasteData.breakdown
    .reduce((acc, item) => {
      const existing = acc.find(i => i.description === item.waste_description);
      if (existing) {
        existing.quantity += item.quantity_tonnes;
      } else {
        acc.push({ description: item.waste_description, quantity: item.quantity_tonnes });
      }
      return acc;
    }, [] as Array<{ description: string; quantity: number }>)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Determinar classificação de desempenho
  const getRecyclingBadge = () => {
    if (wasteData.recycling_percentage >= 70) {
      return <Badge className="bg-green-600"><CheckCircle2 className="h-4 w-4 mr-1" /> Excelente (≥70%)</Badge>;
    } else if (wasteData.recycling_percentage >= 50) {
      return <Badge className="bg-blue-600"><CheckCircle2 className="h-4 w-4 mr-1" /> Bom (50-70%)</Badge>;
    } else if (wasteData.recycling_percentage >= 30) {
      return <Badge variant="outline" className="border-yellow-600 text-yellow-700"><AlertTriangle className="h-4 w-4 mr-1" /> Regular (30-50%)</Badge>;
    } else {
      return <Badge variant="destructive"><AlertTriangle className="h-4 w-4 mr-1" /> Baixo (&lt;30%)</Badge>;
    }
  };

  const hazardousPercentage = wasteData.total_generated_tonnes > 0 
    ? (wasteData.hazardous_tonnes / wasteData.total_generated_tonnes) * 100 
    : 0;

  return (
    <div className="space-y-6 mt-6">
      {/* Header com título */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Recycle className="h-6 w-6 text-green-600" />
            Total de Resíduos Gerados ({year})
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            GRI 306-3, 306-4, 306-5 | Base para estratégias de economia circular
          </p>
        </div>
      </div>

      {/* Card principal - Total gerado */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="text-lg">Total de Resíduos Gerados</CardTitle>
          <CardDescription>Soma de resíduos sólidos, líquidos e perigosos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-5xl font-bold text-primary">
                {wasteData.total_generated_tonnes.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                <span className="text-2xl ml-2 text-muted-foreground">toneladas</span>
              </div>
              
              {wasteData.baseline_total && (
                <div className="flex items-center gap-2 mt-4">
                  {wasteData.is_improving ? (
                    <Badge className="bg-green-600 text-lg px-3 py-1">
                      <TrendingDown className="h-5 w-5 mr-2" />
                      Redução de {wasteData.improvement_percent?.toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-lg px-3 py-1">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Aumento vs. ano anterior
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    vs. {year - 1}: {wasteData.baseline_total.toLocaleString('pt-BR')} t
                  </span>
                </div>
              )}

              {intensityData?.intensity_per_production && (
                <div className="text-sm text-muted-foreground mt-3">
                  <strong>Intensidade:</strong> {intensityData.intensity_per_production.toFixed(4)} t/{intensityData.production_unit}
                </div>
              )}
            </div>

            <div className="text-right">
              {getRecyclingBadge()}
              <div className="text-xs text-muted-foreground mt-2">
                Taxa de Reciclagem
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas */}
      {wasteData.recycling_percentage < 30 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Taxa de reciclagem baixa ({wasteData.recycling_percentage.toFixed(1)}%).</strong> Oportunidade de melhoria significativa através de programas de segregação e parcerias com cooperativas.
          </AlertDescription>
        </Alert>
      )}

      {hazardousPercentage > 10 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Alto percentual de resíduos perigosos ({hazardousPercentage.toFixed(1)}%).</strong> Requer gestão especializada e destinação adequada conforme NBR 10004.
          </AlertDescription>
        </Alert>
      )}

      {wasteData.landfill_percentage > 50 && (
        <Alert className="border-orange-600 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Mais de 50% dos resíduos vão para aterro.</strong> Considere aumentar reciclagem e compostagem.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de breakdown - Perigosos vs Não Perigosos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Resíduos Perigosos (Classe I)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {wasteData.hazardous_tonnes.toLocaleString('pt-BR')} t
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {hazardousPercentage.toFixed(1)}% do total
            </div>
            <Progress value={hazardousPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Resíduos Não Perigosos (Classe II)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {wasteData.non_hazardous_tonnes.toLocaleString('pt-BR')} t
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {(100 - hazardousPercentage).toFixed(1)}% do total
            </div>
            <Progress value={100 - hazardousPercentage} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Destinação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Destinação por Tipo de Tratamento</CardTitle>
            <CardDescription>Distribuição GRI 306-4 e 306-5</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(2)} toneladas`}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legenda detalhada */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Recycle className="h-4 w-4 text-green-600" />
                  Reciclagem
                </span>
                <strong>{wasteData.by_treatment.recycling.toFixed(2)} t</strong>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-orange-600" />
                  Aterro
                </span>
                <strong>{wasteData.by_treatment.landfill.toFixed(2)} t</strong>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-red-600" />
                  Incineração
                </span>
                <strong>{wasteData.by_treatment.incineration.toFixed(2)} t</strong>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-lime-600" />
                  Compostagem
                </span>
                <strong>{wasteData.by_treatment.composting.toFixed(2)} t</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Top 10 tipos de resíduos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 Tipos de Resíduos</CardTitle>
            <CardDescription>Maiores volumes gerados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topWastes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="description" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)} toneladas`, 'Quantidade']}
                />
                <Bar dataKey="quantity" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Nota Metodológica */}
      <Alert>
        <AlertDescription className="text-xs">
          <strong>Metodologia:</strong> Total calculado a partir de registros em waste_logs com conversão automática de unidades (kg, litros, m³) para toneladas. 
          Classificação por tratamento baseada em MTRs e notas fiscais de destinação. 
          <strong className="ml-2">Compliance:</strong> GRI 306-3 (Resíduos Gerados), GRI 306-4 (Resíduos Não Destinados para Disposição), GRI 306-5 (Resíduos Destinados para Disposição).
          <strong className="ml-2">Fórmula:</strong> Total (t) = ∑(Resíduos sólidos + líquidos + perigosos).
        </AlertDescription>
      </Alert>
    </div>
  );
}
