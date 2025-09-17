import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Download, FileSpreadsheet, FileImage, Target, Award, AlertCircle } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { getAdvancedEmissionAnalytics, exportEmissionsReport, getBenchmarkData } from "@/services/advancedAnalytics";

interface AdvancedAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export function AdvancedAnalyticsModal({ isOpen, onClose }: AdvancedAnalyticsModalProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedMetric, setSelectedMetric] = useState('total');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
      loadBenchmarkData();
    }
  }, [isOpen, selectedPeriod]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdvancedEmissionAnalytics(selectedPeriod);
      setAnalyticsData(data);
      console.log('Analytics data loaded:', data);
    } catch (error: any) {
      console.error('Erro ao carregar analytics:', error);
      setError(error.message || 'Erro ao carregar dados analíticos');
      toast.error("Erro ao carregar dados analíticos");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBenchmarkData = async () => {
    try {
      const data = await getBenchmarkData();
      setBenchmarkData(data);
    } catch (error) {
      console.error('Erro ao carregar benchmarks:', error);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true);
    try {
      const blob = await exportEmissionsReport(format, selectedPeriod);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv';
      a.download = `relatorio-emissoes-${format}-${new Date().toISOString().split('T')[0]}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Relatório ${format.toUpperCase()} exportado com sucesso`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando Analytics...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Erro ao Carregar Analytics</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Não foi possível carregar os dados</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
            <Button onClick={loadAnalyticsData} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analyticsData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nenhum Dado Disponível</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Nenhum dado de emissões encontrado</h3>
              <p className="text-muted-foreground mt-2">Adicione algumas fontes de emissão e dados de atividade para visualizar as análises.</p>
            </div>
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderExecutiveSummary = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{(analyticsData.summary.total_emissions / 1000).toFixed(1)} tCO₂e</div>
              <div className="text-sm text-muted-foreground">Total de Emissões</div>
              {analyticsData.summary.trend > 0 ? (
                <div className="flex items-center justify-center gap-1 text-red-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">+{analyticsData.summary.trend.toFixed(1)}%</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1 text-green-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm">{analyticsData.summary.trend.toFixed(1)}%</span>
                </div>
              )}
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analyticsData.summary.scope1_percentage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Participação Escopo 1</div>
              <div className="text-xs text-muted-foreground">Emissões diretas</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{(analyticsData.summary.intensity / 1000).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Intensidade de Carbono</div>
              <div className="text-xs text-muted-foreground">tCO₂e por fonte</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Principais Insights:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {analyticsData.insights.map((insight: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          {analyticsData.recommendations?.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Recomendações:
              </h4>
              <ul className="space-y-1 text-sm">
                {analyticsData.recommendations.map((rec: any, index: number) => (
                  <li key={index} className="flex items-start gap-2 p-2 border rounded">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{rec.title}</div>
                      <div className="text-muted-foreground text-xs">{rec.description}</div>
                      {rec.potential_reduction && (
                        <Badge variant="outline" className="mt-1">
                          Potencial: -{rec.potential_reduction}% CO₂e
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTrendAnalysis = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Evolução das Emissões por Escopo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={analyticsData.monthly_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [`${(Number(value) / 1000).toFixed(2)} tCO₂e`, name]}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="scope1" 
                stackId="1"
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
                name="Escopo 1"
              />
              <Area 
                type="monotone" 
                dataKey="scope2" 
                stackId="1"
                stroke="hsl(var(--secondary))" 
                fill="hsl(var(--secondary))"
                fillOpacity={0.6}
                name="Escopo 2"
              />
              <Area 
                type="monotone" 
                dataKey="scope3" 
                stackId="1"
                stroke="hsl(var(--accent))" 
                fill="hsl(var(--accent))"
                fillOpacity={0.6}
                name="Escopo 3"
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#ff7c7c" 
                strokeWidth={3}
                name="Total"
                dot={{ fill: '#ff7c7c', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.category_breakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="emissions"
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                >
                  {analyticsData.category_breakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${(Number(value) / 1000).toFixed(2)} tCO₂e`, 'Emissões']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Fontes de Emissão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.top_sources.map((source: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{source.name}</div>
                    <div className="text-xs text-muted-foreground">{source.category}</div>
                    <Progress value={(source.emissions / analyticsData.top_sources[0].emissions) * 100} className="h-2 mt-1" />
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold">{(source.emissions / 1000).toFixed(1)} tCO₂e</div>
                    <div className="text-xs text-muted-foreground">{source.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderBenchmarks = () => (
    <div className="space-y-6">
      {benchmarkData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Comparação Setorial</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={benchmarkData.sector_comparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="your_company" fill="hsl(var(--primary))" name="Sua Empresa" />
                  <Bar dataKey="sector_average" fill="hsl(var(--secondary))" name="Média do Setor" />
                  <Bar dataKey="best_practice" fill="hsl(var(--accent))" name="Melhores Práticas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {benchmarkData.performance_indicators.map((indicator: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">{indicator.score}/10</div>
                    <div className="font-medium">{indicator.name}</div>
                    <div className="text-sm text-muted-foreground mb-3">{indicator.description}</div>
                    <Progress value={indicator.score * 10} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-2">
                      {indicator.status}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Analytics Avançado de Emissões
            </DialogTitle>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="12months">Últimos 12 meses</SelectItem>
                  <SelectItem value="24months">Últimos 24 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-3 lg:w-fit">
              <TabsTrigger value="summary">Resumo Executivo</TabsTrigger>
              <TabsTrigger value="trends">Análise de Tendências</TabsTrigger>
              <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport('excel')}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                <FileImage className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          <TabsContent value="summary" className="space-y-4">
            {renderExecutiveSummary()}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {renderTrendAnalysis()}
          </TabsContent>

          <TabsContent value="benchmarks" className="space-y-4">
            {renderBenchmarks()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}