import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DateRange } from "react-day-picker";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, BarChart3, TrendingUp, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  AnalysisConfig,
  AnalysisResponse,
  executePerformanceAnalysis,
  getAssetsForComparison,
  getWasteClassesForComparison,
  METRICS_OPTIONS,
  COMPARISON_DIMENSIONS,
  GRANULARITY_OPTIONS,
} from "@/services/performance";

export default function Desempenho() {
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    metric_key: '',
    time_range: { start: '', end: '' },
    granularity: 'monthly',
    comparison_dimension: undefined,
    filter_ids: []
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 12),
    to: new Date()
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Carregar ativos para comparação
  const { data: assets = [] } = useQuery({
    queryKey: ['assets-for-comparison'],
    queryFn: getAssetsForComparison,
  });

  // Carregar classes de resíduo para comparação
  const { data: wasteClasses = [] } = useQuery({
    queryKey: ['waste-classes-for-comparison'],
    queryFn: getWasteClassesForComparison,
  });

  const getComparisonOptions = () => {
    if (analysisConfig.comparison_dimension === 'asset') {
      return assets.map(asset => ({
        id: asset.id,
        label: `${asset.name} (${asset.location || 'Local não informado'})`
      }));
    }
    
    if (analysisConfig.comparison_dimension === 'scope') {
      return [
        { id: '1', label: 'Escopo 1' },
        { id: '2', label: 'Escopo 2' },
        { id: '3', label: 'Escopo 3' }
      ];
    }
    
    if (analysisConfig.comparison_dimension === 'waste_class') {
      return wasteClasses.map(wc => ({
        id: wc.id,
        label: wc.label
      }));
    }
    
    return [];
  };

  const handleExecuteAnalysis = async () => {
    if (!analysisConfig.metric_key) {
      toast.error('Selecione uma métrica para analisar');
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Selecione um período para análise');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const config: AnalysisConfig = {
        ...analysisConfig,
        time_range: {
          start: format(dateRange.from, 'yyyy-MM-dd'),
          end: format(dateRange.to, 'yyyy-MM-dd')
        }
      };

      const result = await executePerformanceAnalysis(config);
      setAnalysisResult(result);
      toast.success('Análise executada com sucesso!');
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao executar análise');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const prepareChartData = () => {
    if (!analysisResult) return [];

    const { labels, datasets } = analysisResult.chart_data;
    
    return labels.map((label, index) => {
      const dataPoint: any = { period: label };
      datasets.forEach(dataset => {
        dataPoint[dataset.id] = dataset.data[index] || 0;
      });
      return dataPoint;
    });
  };

  const getYAxisLabel = () => {
    const metric = METRICS_OPTIONS.find(m => m.value === analysisConfig.metric_key);
    return metric?.label || '';
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análise de Desempenho ESG</h1>
            <p className="text-muted-foreground">
              Construa visualizações personalizadas e analise tendências dos seus dados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Construtor de Análise */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Construtor de Análise
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros da sua análise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Seleção de Métrica */}
                <div className="space-y-2">
                  <Label>Métrica a Analisar</Label>
                  <Select 
                    value={analysisConfig.metric_key} 
                    onValueChange={(value) => setAnalysisConfig(prev => ({ ...prev, metric_key: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma métrica" />
                    </SelectTrigger>
                    <SelectContent>
                      {METRICS_OPTIONS.map(metric => (
                        <SelectItem key={metric.value} value={metric.value}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Período de Análise */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Período de Análise
                  </Label>
                  <DatePickerWithRange 
                    date={dateRange}
                    onDateChange={setDateRange}
                  />
                </div>

                {/* Granularidade */}
                <div className="space-y-2">
                  <Label>Granularidade</Label>
                  <div className="flex gap-2">
                    {GRANULARITY_OPTIONS.map(option => (
                      <Button
                        key={option.value}
                        variant={analysisConfig.granularity === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAnalysisConfig(prev => ({ ...prev, granularity: option.value as any }))}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Dimensão de Comparação */}
                <div className="space-y-2">
                  <Label>Comparar por (Opcional)</Label>
                  <Select 
                    value={analysisConfig.comparison_dimension || ''} 
                    onValueChange={(value) => setAnalysisConfig(prev => ({ 
                      ...prev, 
                      comparison_dimension: (value as 'asset' | 'waste_class' | 'scope') || undefined,
                      filter_ids: [] // Reset filter_ids when changing dimension
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhuma comparação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma comparação</SelectItem>
                      {COMPARISON_DIMENSIONS.map(dim => (
                        <SelectItem key={dim.value} value={dim.value}>
                          {dim.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtros de Comparação */}
                {analysisConfig.comparison_dimension && (
                  <div className="space-y-2">
                    <Label>Itens para Comparar</Label>
                    <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-2">
                      {getComparisonOptions().map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.id}
                            checked={analysisConfig.filter_ids?.includes(option.id) || false}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAnalysisConfig(prev => ({
                                  ...prev,
                                  filter_ids: [...(prev.filter_ids || []), option.id]
                                }));
                              } else {
                                setAnalysisConfig(prev => ({
                                  ...prev,
                                  filter_ids: prev.filter_ids?.filter(id => id !== option.id) || []
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={option.id} className="text-sm">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botão de Análise */}
                <Button 
                  onClick={handleExecuteAnalysis}
                  disabled={isAnalyzing || !analysisConfig.metric_key}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? 'Analisando...' : 'Gerar Análise'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Visualização de Resultados */}
          <div className="lg:col-span-2">
            {!analysisResult ? (
              <Card className="h-full flex items-center justify-center min-h-[500px]">
                <div className="text-center space-y-4">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Configure sua primeira análise
                    </h3>
                    <p className="text-muted-foreground">
                      Use o painel ao lado para construir uma análise personalizada dos seus dados ESG
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Identifique tendências históricas
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Compare diferentes ativos
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Header da Análise */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {analysisResult.query_details.metric_label}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(analysisResult.query_details.time_range.start), 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                      {format(new Date(analysisResult.query_details.time_range.end), 'dd/MM/yyyy', { locale: ptBR })} •{' '}
                      Visualização {analysisResult.query_details.granularity === 'monthly' ? 'Mensal' : 
                                   analysisResult.query_details.granularity === 'quarterly' ? 'Trimestral' : 'Anual'}
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Estatísticas Resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-foreground">
                        {analysisResult.chart_data.summary_stats.total.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-foreground">
                        {analysisResult.chart_data.summary_stats.average.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Média</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-foreground">
                        {analysisResult.chart_data.summary_stats.max.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Máximo</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-foreground">
                        {analysisResult.chart_data.summary_stats.min.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Mínimo</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico */}
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução ao Longo do Tempo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="period" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => value.toLocaleString('pt-BR')}
                          />
                          <Tooltip 
                            formatter={(value: any) => [value.toLocaleString('pt-BR'), getYAxisLabel()]}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px'
                            }}
                          />
                          <Legend />
                          {analysisResult.chart_data.datasets.map((dataset, index) => (
                            <Line
                              key={dataset.id}
                              type="monotone"
                              dataKey={dataset.id}
                              stroke={dataset.color}
                              strokeWidth={2}
                              name={dataset.label}
                              connectNulls={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}