import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Database,
  Zap,
  Shield,
  Code,
  Users,
  BarChart3
} from 'lucide-react';
import { unifiedQualityService } from '@/services/unifiedQualityService';
import { useQuery } from '@tanstack/react-query';

interface AuditResult {
  category: 'critical' | 'high' | 'medium' | 'low';
  type: 'error' | 'duplication' | 'improvement' | 'security';
  title: string;
  description: string;
  impact: string;
  solution: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: number;
}

const SystemAudit = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  // Mock audit results - in reality these would come from actual system analysis
  const auditResults: AuditResult[] = [
    {
      category: 'critical',
      type: 'error',
      title: 'Edge Functions com Falhas',
      description: 'quality-management e esg-dashboard retornando códigos de erro',
      impact: 'Alto - Dashboards não funcionam corretamente',
      solution: 'Corrigir queries para tabelas corretas e importações de CORS',
      status: 'completed',
      priority: 1
    },
    {
      category: 'critical',
      type: 'error', 
      title: 'Relacionamento Database Quebrado',
      description: 'Tabela risk_occurrences sem foreign key para esg_risks',
      impact: 'Alto - Consultas falham e dados ficam inconsistentes',
      solution: 'Adicionar constraint de foreign key',
      status: 'completed',
      priority: 1
    },
    {
      category: 'high',
      type: 'security',
      title: 'Funções sem Search Path Seguro',
      description: 'Algumas funções database não têm SET search_path definido',
      impact: 'Médio - Possível vulnerabilidade de segurança',
      solution: 'Adicionar SET search_path = public em todas as funções',
      status: 'completed',
      priority: 2
    },
    {
      category: 'high',
      type: 'duplication',
      title: '3 Serviços de Qualidade Redundantes',
      description: 'qualityManagement.ts, enhancedQualityService.ts e qualityIndicators.ts',
      impact: 'Alto - Código difícil de manter, funcionalidades duplicadas',
      solution: 'Consolidar em unifiedQualityService.ts',
      status: 'completed',
      priority: 2
    },
    {
      category: 'medium',
      type: 'improvement',
      title: 'Inconsistências de Tipos TypeScript',
      description: 'Uso excessivo de as any e as unknown',
      impact: 'Médio - Perde type safety e pode causar bugs',
      solution: 'Implementar type assertions adequadas e interfaces corretas',
      status: 'pending',
      priority: 3
    },
    {
      category: 'medium',
      type: 'duplication',
      title: 'Componentes Dashboard Duplicados',
      description: 'Múltiplos QualityDashboard components com funcionalidades similares',
      impact: 'Médio - Confusão no desenvolvimento e manutenção',
      solution: 'Consolidar em componente principal com sub-componentes',
      status: 'completed',
      priority: 3
    },
    {
      category: 'low',
      type: 'improvement',
      title: 'Padrões de Exportação Inconsistentes',
      description: 'Alguns serviços exportam classes, outros objetos simples',
      impact: 'Baixo - Inconsistência no código',
      solution: 'Padronizar todas as exportações como singleton de classe',
      status: 'pending',
      priority: 4
    }
  ];

  const getCategoryIcon = (category: AuditResult['category']) => {
    switch (category) {
      case 'critical': return <XCircle className="w-5 h-5 text-destructive" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <Info className="w-5 h-5 text-blue-500" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getTypeIcon = (type: AuditResult['type']) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'duplication': return <Database className="w-4 h-4" />;
      case 'improvement': return <TrendingUp className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: AuditResult['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Corrigido</Badge>;
      case 'in_progress':
        return <Badge variant="outline">Em Andamento</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const criticalCount = auditResults.filter(r => r.category === 'critical').length;
  const highCount = auditResults.filter(r => r.category === 'high').length;
  const completedCount = auditResults.filter(r => r.status === 'completed').length;
  const totalCount = auditResults.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Auditoria do Sistema</h1>
        <p className="text-muted-foreground">
          Análise completa de erros, duplicidades e melhorias identificadas no sistema
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Críticos</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{highCount}</div>
            <p className="text-xs text-muted-foreground">Necessitam correção breve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{completedCount}/{totalCount}</div>
            <Progress value={completionPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            {completionPercentage > 50 ? 
              <TrendingUp className="h-4 w-4 text-green-500" /> : 
              <TrendingDown className="h-4 w-4 text-orange-500" />
            }
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(completionPercentage)}%</div>
            <p className="text-xs text-muted-foreground">Itens corrigidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="errors">Erros</TabsTrigger>
          <TabsTrigger value="duplications">Duplicidades</TabsTrigger>
          <TabsTrigger value="improvements">Melhorias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {auditResults
              .sort((a, b) => a.priority - b.priority)
              .map((result, index) => (
                <Card key={index} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(result.category)}
                        <CardTitle className="text-lg">{result.title}</CardTitle>
                        {getTypeIcon(result.type)}
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                    <CardDescription>{result.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Impacto:</h4>
                      <p className="text-sm text-muted-foreground">{result.impact}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Solução:</h4>
                      <p className="text-sm text-muted-foreground">{result.solution}</p>
                    </div>
                    {result.status === 'pending' && (
                      <Button variant="outline" size="sm">
                        Marcar como Corrigido
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erros Críticos do Sistema</AlertTitle>
            <AlertDescription>
              Estes erros afetam diretamente o funcionamento do sistema e precisam ser corrigidos imediatamente.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4">
            {auditResults
              .filter(r => r.type === 'error')
              .map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(result.category)}
                        <CardTitle>{result.title}</CardTitle>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{result.description}</p>
                    <p className="text-sm"><strong>Impacto:</strong> {result.impact}</p>
                    <p className="text-sm"><strong>Solução:</strong> {result.solution}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="duplications" className="space-y-4">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Funcionalidades Duplicadas</AlertTitle>
            <AlertDescription>
              Identificamos código e funcionalidades duplicadas que podem ser consolidadas para melhor manutenção.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {auditResults
              .filter(r => r.type === 'duplication')
              .map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(result.category)}
                        <CardTitle>{result.title}</CardTitle>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{result.description}</p>
                    <p className="text-sm"><strong>Impacto:</strong> {result.impact}</p>
                    <p className="text-sm"><strong>Solução:</strong> {result.solution}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertTitle>Oportunidades de Melhoria</AlertTitle>
            <AlertDescription>
              Sugestões para otimizar performance, segurança e experiência do usuário.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {auditResults
              .filter(r => r.type === 'improvement' || r.type === 'security')
              .map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(result.category)}
                        <CardTitle>{result.title}</CardTitle>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{result.description}</p>
                    <p className="text-sm"><strong>Impacto:</strong> {result.impact}</p>
                    <p className="text-sm"><strong>Solução:</strong> {result.solution}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Implementation Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Plano de Implementação
          </CardTitle>
          <CardDescription>
            Cronograma de execução das correções e melhorias identificadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <div>
                <h4 className="font-semibold text-destructive">Fase 1 - Correções Críticas (1-2 dias)</h4>
                <p className="text-sm text-muted-foreground">Edge functions, relacionamentos database, segurança</p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Concluída</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-300">Fase 2 - Consolidação (3-4 dias)</h4>
                <p className="text-sm text-muted-foreground">Unificar serviços, remover duplicações</p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Concluída</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">Fase 3 - Melhorias Técnicas (2-3 dias)</h4>
                <p className="text-sm text-muted-foreground">Types, error handling, performance</p>
              </div>
              <Badge variant="secondary">Pendente</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-300">Fase 4 - Funcionalidades (3-5 dias)</h4>
                <p className="text-sm text-muted-foreground">Auditoria unificada, integrações, analytics</p>
              </div>
              <Badge variant="secondary">Pendente</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAudit;