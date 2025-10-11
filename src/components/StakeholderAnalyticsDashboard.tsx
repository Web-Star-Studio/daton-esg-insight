import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStakeholderAnalytics } from '@/hooks/data/useStakeholderAnalytics';

const StakeholderAnalyticsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: analyticsData, isLoading } = useStakeholderAnalytics(selectedPeriod);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-800';
      case 'Média': return 'bg-yellow-100 text-yellow-800';
      case 'Baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics de Stakeholders</h2>
          <p className="text-muted-foreground">
            Análises detalhadas de engajamento e relacionamento com stakeholders
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="investors">Investidores</SelectItem>
              <SelectItem value="customers">Clientes</SelectItem>
              <SelectItem value="employees">Funcionários</SelectItem>
              <SelectItem value="community">Comunidade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.summary.totalStakeholders}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{analyticsData?.summary.trending.stakeholders}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.summary.activeEngagement}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((analyticsData?.summary.activeEngagement / analyticsData?.summary.totalStakeholders) * 100)}% do total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.summary.averageScore}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              {analyticsData?.summary.trending.engagement}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.summary.totalInteractions}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{analyticsData?.summary.trending.interactions}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.summary.scheduledMeetings}</div>
            <div className="text-xs text-muted-foreground">próximos 30 dias</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analyticsData?.summary.overdueFollowups}</div>
            <div className="text-xs text-muted-foreground">follow-ups</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="maturity">Maturidade</TabsTrigger>
          <TabsTrigger value="risks">Riscos</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Engajamento por Categoria</CardTitle>
                <CardDescription>Score médio e número de interações</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.engagementByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#3B82F6" name="Score Médio" />
                    <Bar dataKey="interactions" fill="#10B981" name="Interações" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Engajamento</CardTitle>
                <CardDescription>Evolução do score ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.engagementTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} name="Score" />
                    <Line type="monotone" dataKey="interactions" stroke="#10B981" strokeWidth={2} name="Interações" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Category Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.engagementByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="font-medium">{category.category}</div>
                      <Badge variant="outline">{category.count} stakeholders</Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Score Médio</div>
                        <div className="font-bold">{category.avgScore}%</div>
                      </div>
                      <div className="w-24">
                        <Progress value={category.avgScore} />
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Interações</div>
                        <div className="font-bold">{category.interactions}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Influence Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Influência</CardTitle>
                <CardDescription>Classificação dos stakeholders por nível de influência</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.influenceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData?.influenceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Interest Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Interesse</CardTitle>
                <CardDescription>Classificação dos stakeholders por nível de interesse</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.interestDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData?.interestDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maturity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maturidade do Processo</CardTitle>
              <CardDescription>Avaliação dos diferentes aspectos da gestão de stakeholders</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={analyticsData?.maturityRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Riscos Identificados</CardTitle>
                <CardDescription>Principais riscos no relacionamento com stakeholders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.riskMetrics.map((risk, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTrendIcon(risk.trend)}
                        <div>
                          <div className="font-medium">{risk.risk}</div>
                          <div className="text-sm text-muted-foreground">
                            {risk.stakeholders} stakeholders afetados
                          </div>
                        </div>
                      </div>
                      <Badge variant={risk.stakeholders > 5 ? 'destructive' : risk.stakeholders > 2 ? 'default' : 'secondary'}>
                        {risk.stakeholders > 5 ? 'Alto' : risk.stakeholders > 2 ? 'Médio' : 'Baixo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Próximas Ações</CardTitle>
                <CardDescription>Atividades agendadas com stakeholders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.upcomingActions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{action.stakeholder}</div>
                        <div className="text-sm text-muted-foreground">{action.action}</div>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(action.date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Badge className={getPriorityColor(action.priority)}>
                        {action.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StakeholderAnalyticsDashboard;