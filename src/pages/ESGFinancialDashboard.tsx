import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaf, Users, Shield, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { esgFinancialService, type ESGFinancialStats } from '@/services/esgFinancial';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ESG_COLORS = {
  Environmental: 'hsl(var(--chart-1))',
  Social: 'hsl(var(--chart-2))',
  Governance: 'hsl(var(--chart-3))',
};

export default function ESGFinancialDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<ESGFinancialStats | null>(null);

  useEffect(() => {
    loadStats();
  }, [selectedYear]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await esgFinancialService.getESGFinancialStats(selectedYear);
      setStats(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar estatísticas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const chartData = stats ? [
    { name: 'Ambiental', value: stats.environmental_costs, fill: ESG_COLORS.Environmental },
    { name: 'Social', value: stats.social_costs, fill: ESG_COLORS.Social },
    { name: 'Governança', value: stats.governance_costs, fill: ESG_COLORS.Governance },
  ] : [];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro-ESG</h1>
          <p className="text-muted-foreground">
            Visualize o impacto financeiro das suas iniciativas ESG
          </p>
        </div>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investimento ESG Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_esg_costs || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.esg_percentage.toFixed(1)}% do total de despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ambiental (E)</CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.environmental_costs || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_carbon_impact?.toFixed(2) || 0} tCO2e impacto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social (S)</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.social_costs || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Treinamentos, projetos sociais, benefícios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Governança (G)</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.governance_costs || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Compliance, auditorias, gestão de riscos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Distribuição ESG</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="roi">ROI por Projeto</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Investimento por Pilar ESG</CardTitle>
                <CardDescription>Distribuição dos investimentos em {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparativo de Investimentos</CardTitle>
                <CardDescription>Valores absolutos por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendências Mensais</CardTitle>
              <CardDescription>Em desenvolvimento - dados históricos mensais</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
              <div className="text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Dados de tendências serão exibidos aqui</p>
                <p className="text-sm">Requer histórico de pelo menos 3 meses</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ROI por Projeto ESG</CardTitle>
              <CardDescription>Retorno sobre investimento de iniciativas específicas</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Análise de ROI por projeto será exibida aqui</p>
                <p className="text-sm">Vincule projetos ESG às transações financeiras para ver o ROI</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats && stats.esg_percentage > 0 ? (
              <>
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <Leaf className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Investimento ESG Ativo</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.esg_percentage.toFixed(1)}% das suas despesas estão vinculadas a iniciativas ESG.
                      {stats.esg_percentage < 10 && ' Considere aumentar este percentual para melhorar seu score ESG.'}
                    </p>
                  </div>
                </div>

                {stats.environmental_costs === 0 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <Leaf className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Oportunidade: Investimento Ambiental</p>
                      <p className="text-sm text-muted-foreground">
                        Nenhum investimento ambiental registrado em {selectedYear}. Considere vincular despesas
                        relacionadas a energia, resíduos ou emissões à categoria Environmental.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Comece a Rastrear Investimentos ESG</p>
                  <p className="text-sm text-muted-foreground">
                    Ao categorizar suas transações financeiras como ESG, você poderá medir o retorno sobre investimento
                    de suas iniciativas de sustentabilidade e melhorar seus relatórios integrados.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
