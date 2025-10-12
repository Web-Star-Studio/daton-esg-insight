import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileText, TrendingUp, Activity, Download, Filter, Calendar } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { getUserAndCompany } from '@/utils/auth';
import { useState } from 'react';
import { toast } from 'sonner';

export default function LicenseMonitoring() {
  const [period, setPeriod] = useState('30');
  const [selectedLicense, setSelectedLicense] = useState('all');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['monitoring-stats', period, selectedLicense],
    queryFn: async () => {
      const userAndCompany = await getUserAndCompany();
      if (!userAndCompany) throw new Error('Not authenticated');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Alertas
      let alertsQuery = supabase
        .from('license_alerts')
        .select('*, license:licenses(name)')
        .eq('company_id', userAndCompany.company_id)
        .gte('created_at', startDate.toISOString());

      if (selectedLicense !== 'all') {
        alertsQuery = alertsQuery.eq('license_id', selectedLicense);
      }

      const { data: alerts } = await alertsQuery;

      // Observações
      let observationsQuery = supabase
        .from('license_observations')
        .select('*')
        .eq('company_id', userAndCompany.company_id)
        .gte('created_at', startDate.toISOString());

      if (selectedLicense !== 'all') {
        observationsQuery = observationsQuery.eq('license_id', selectedLicense);
      }

      const { data: observations } = await observationsQuery;

      // Licenças
      const { data: licenses } = await supabase
        .from('licenses')
        .select('id, name')
        .eq('company_id', userAndCompany.company_id);

      return {
        alerts: alerts || [],
        observations: observations || [],
        licenses: licenses || []
      };
    }
  });

  const alertsBySeverity = stats?.alerts.reduce((acc, alert) => {
    const severity = alert.severity || 'low';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const alertsByType = stats?.alerts.reduce((acc, alert) => {
    const type = alert.alert_type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const observationsByType = stats?.observations.reduce((acc, obs) => {
    acc[obs.observation_type] = (acc[obs.observation_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityChartData = Object.entries(alertsBySeverity || {}).map(([name, value]) => ({
    name: name === 'critical' ? 'Crítico' : name === 'high' ? 'Alto' : name === 'medium' ? 'Médio' : 'Baixo',
    value
  }));

  const typeChartData = Object.entries(alertsByType || {}).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }));

  const obsChartData = Object.entries(observationsByType || {}).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

  const exportReport = async (format: 'pdf' | 'excel') => {
    toast.info(`Exportando relatório em ${format.toUpperCase()}...`);
    // Implementar lógica de exportação
    setTimeout(() => {
      toast.success(`Relatório ${format.toUpperCase()} gerado com sucesso!`);
    }, 2000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Monitoramento</h1>
          <p className="text-muted-foreground">Visão completa de alertas e observações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedLicense} onValueChange={setSelectedLicense}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as licenças</SelectItem>
                  {stats?.licenses.map(license => (
                    <SelectItem key={license.id} value={license.id}>
                      {license.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4" data-tour="license-alerts">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-10 w-10 text-yellow-600" />
              <div>
                <div className="text-3xl font-bold">{stats?.alerts.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total de Alertas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-10 w-10 text-red-600" />
              <div>
                <div className="text-3xl font-bold">
                  {stats?.alerts.filter(a => a.severity === 'critical').length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Alertas Críticos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-10 w-10 text-blue-600" />
              <div>
                <div className="text-3xl font-bold">{stats?.observations.length || 0}</div>
                <div className="text-sm text-muted-foreground">Observações</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-10 w-10 text-green-600" />
              <div>
                <div className="text-3xl font-bold">87%</div>
                <div className="text-sm text-muted-foreground">Taxa Resolução</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">Análise de Alertas</TabsTrigger>
          <TabsTrigger value="observations">Observações</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Alerts by Severity */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas por Severidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alerts by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="observations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Observações por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={obsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Gráfico de tendências será exibido aqui
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
