import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import {
  Brain,
  TrendingUp,
  Zap,
  FileText,
  Download,
  Calendar,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  Clock,
  Target,
  Sparkles,
  Bot,
  CheckCircle2
} from 'lucide-react';
import { intelligentReportingService, type SmartReportTemplate, type ReportInsight, type ReportGenerationJob } from '@/services/intelligentReporting';

interface IntelligentReportingDashboardProps {
  className?: string;
}

export const IntelligentReportingDashboard: React.FC<IntelligentReportingDashboardProps> = ({ className }) => {
  const { toast } = useToast();
  const { triggerDocumentUploaded } = useNotificationTriggers();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generationJob, setGenerationJob] = useState<ReportGenerationJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: templates, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ['smart-report-templates'],
    queryFn: () => intelligentReportingService.getSmartReportTemplates(),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['reporting-analytics'],
    queryFn: () => intelligentReportingService.getReportingAnalytics(),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: insights } = useQuery({
    queryKey: ['report-insights'],
    queryFn: () => intelligentReportingService.generateReportInsights('esg', {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }),
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const handleGenerateReport = async (templateId: string) => {
    try {
      setIsGenerating(true);
      setSelectedTemplate(templateId);
      
      const job = await intelligentReportingService.queueReportGeneration(templateId, {
        dateRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }
      });
      
      setGenerationJob(job);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationJob(prev => {
          if (!prev || prev.progress >= 100) {
            clearInterval(progressInterval);
            setIsGenerating(false);
            return prev;
          }
          return { ...prev, progress: Math.min(prev.progress + 10, 100) };
        });
      }, 2000);

      toast({
        title: "Relatório em Processamento",
        description: "Sua solicitação foi enviada para processamento com IA",
      });

      // Trigger notification after completion
      setTimeout(async () => {
        if (job.status === 'completed') {
          const template = templates?.find(t => t.id === templateId);
          await triggerDocumentUploaded(
            job.id,
            `Relatório ${template?.name || 'Inteligente'}`,
            'PDF'
          );
        }
      }, 12000);

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'esg': return <Sparkles className="h-4 w-4" />;
      case 'quality': return <Target className="h-4 w-4" />;
      case 'emissions': return <TrendingUp className="h-4 w-4" />;
      case 'governance': return <BarChart3 className="h-4 w-4" />;
      case 'compliance': return <CheckCircle2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-primary" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'opportunity': return <Zap className="h-4 w-4 text-success" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-warning" />;
      default: return <Brain className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (isTemplatesLoading || isAnalyticsLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Central de Relatórios Inteligentes</h2>
            <p className="text-muted-foreground">
              Powered by AI • Relatórios automáticos com insights em tempo real
            </p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          IA Ativa
        </Badge>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Gerados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_reports_generated}</div>
            <p className="text-xs text-muted-foreground">+15% este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precisão da IA</CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.ai_accuracy_average}%</div>
            <p className="text-xs text-muted-foreground">+3% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights Gerados</CardTitle>
            <Lightbulb className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.insights_generated}</div>
            <p className="text-xs text-muted-foreground">Baseados em dados reais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Economizado</CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.time_saved_hours}h</div>
            <p className="text-xs text-muted-foreground">Automação inteligente</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Templates Inteligentes</TabsTrigger>
          <TabsTrigger value="insights">Insights em Tempo Real</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates?.map((template) => (
              <Card key={template.id} className="relative overflow-hidden">
                {template.ai_enhanced && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      IA
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start space-x-3">
                    {getCategoryIcon(template.category)}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Precisão IA:</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={template.accuracy_score} className="w-16 h-2" />
                      <span className="font-medium">{template.accuracy_score}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Insights:</span>
                    <Badge variant="outline">{template.insights_count}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Próxima geração:</span>
                    <span className="text-xs">
                      {template.next_generation.toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleGenerateReport(template.id)}
                      disabled={isGenerating && selectedTemplate === template.id}
                    >
                      {isGenerating && selectedTemplate === template.id ? (
                        <>
                          <Clock className="h-3 w-3 mr-1 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Zap className="h-3 w-3 mr-1" />
                          Gerar
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="outline">
                      Agendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Generation Progress */}
          {generationJob && isGenerating && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary animate-pulse" />
                  Processando com IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{generationJob.progress}%</span>
                  </div>
                  <Progress value={generationJob.progress} className="h-2" />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Estimativa de conclusão: {generationJob.estimated_completion.toLocaleTimeString('pt-BR')}</p>
                  <p>Insights gerados: {generationJob.insights.length}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights && insights.length > 0 ? (
            <div className="space-y-4">
              {insights.map((insight) => (
                <Card key={insight.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getInsightIcon(insight.type)}
                        <div>
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <CardDescription>
                            Fonte: {insight.data_source} • Confiança: {insight.confidence}%
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getPriorityColor(insight.priority) as any}>
                          {insight.priority === 'high' ? 'Alta' : 
                           insight.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="outline">Acionável</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.actionable && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  Analisando dados para gerar insights...
                </p>
                <p className="text-sm text-muted-foreground">
                  A IA está processando seus dados em tempo real
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Categorias Mais Populares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.top_categories.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <span className="text-sm">{category.name}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={(category.count / 35) * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{category.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendência Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics?.monthly_trend.map((month) => (
                    <div key={month.month} className="flex items-center justify-between text-sm">
                      <span>{month.month}</span>
                      <div className="flex items-center space-x-4">
                        <span>{month.reports} relatórios</span>
                        <span className="text-muted-foreground">{month.insights} insights</span>
                      </div>
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

export default IntelligentReportingDashboard;