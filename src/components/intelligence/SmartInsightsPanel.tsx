import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  BarChart3,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric?: {
    value: number;
    change: number;
    unit: string;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Visualization {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: any[];
}

interface SmartInsightsPanelProps {
  insights: Insight[];
  visualizations?: Visualization[];
  isLoading?: boolean;
}

export function SmartInsightsPanel({
  insights = [],
  visualizations = [],
  isLoading = false,
}: SmartInsightsPanelProps) {
  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'trend':
        return TrendingUp;
      case 'anomaly':
        return AlertTriangle;
      case 'recommendation':
        return Lightbulb;
      case 'prediction':
        return Target;
      default:
        return Activity;
    }
  };

  const getPriorityColor = (priority: Insight['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const sortedInsights = [...insights].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights">
            <Lightbulb className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="visualizations">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visualizações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {sortedInsights.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum insight disponível no momento</p>
                  <p className="text-sm mt-2">
                    Envie documentos para começar a receber análises inteligentes
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            sortedInsights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <Card key={insight.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{insight.title}</CardTitle>
                            <Badge variant={getPriorityColor(insight.priority)}>
                              {insight.priority === 'urgent' && 'Urgente'}
                              {insight.priority === 'high' && 'Alta'}
                              {insight.priority === 'medium' && 'Média'}
                              {insight.priority === 'low' && 'Baixa'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {(insight.metric || insight.action) && (
                    <CardContent>
                      <div className="flex items-center justify-between">
                        {insight.metric && (
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-2xl font-bold">
                                {insight.metric.value} {insight.metric.unit}
                              </p>
                              <div className="flex items-center gap-1 text-sm">
                                {insight.metric.change >= 0 ? (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <span
                                  className={
                                    insight.metric.change >= 0 ? 'text-green-500' : 'text-red-500'
                                  }
                                >
                                  {Math.abs(insight.metric.change)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        {insight.action && (
                          <Button onClick={insight.action.onClick} size="sm">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {insight.action.label}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="visualizations" className="space-y-4">
          {visualizations.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma visualização disponível</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            visualizations.map((viz, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{viz.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {viz.type === 'bar' ? (
                      <BarChart data={viz.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                      </BarChart>
                    ) : viz.type === 'line' ? (
                      <LineChart data={viz.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                      </LineChart>
                    ) : viz.type === 'pie' ? (
                      <PieChart>
                        <Pie
                          data={viz.data}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                          label
                        >
                          {viz.data.map((entry: any, idx: number) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    ) : null}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
