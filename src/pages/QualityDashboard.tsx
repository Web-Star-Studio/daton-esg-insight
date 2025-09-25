import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QualityDashboard from '@/components/QualityDashboard';
import QualityMatrix from '@/components/QualityMatrix';
import AIQualityInsights from '@/components/AIQualityInsights';
import { EnhancedQualityDashboard } from '@/components/EnhancedQualityDashboard';
import { PredictiveQualityWidget } from '@/components/PredictiveQualityWidget';
import QualityIndicatorDashboard from '@/components/QualityIndicatorDashboard';
import QualityPerformanceWidget from '@/components/QualityPerformanceWidget';
import QualityTrendsAnalyzer from '@/components/QualityTrendsAnalyzer';

import { BarChart3, Brain, Grid3X3, Zap } from 'lucide-react';

const QualityDashboardPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sistema de Gestão da Qualidade</h1>
        <p className="text-muted-foreground">
          Visão completa com análises preditivas e inteligência artificial
        </p>
      </div>

      <PredictiveQualityWidget className="w-full" />

      <Tabs defaultValue="enhanced" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7">
          <TabsTrigger value="enhanced" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span className="hidden lg:inline">Sistema Avançado</span>
            <span className="lg:hidden">Avançado</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Performance</span>
            <span className="lg:hidden">Perf</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Tendências</span>
            <span className="lg:hidden">Trend</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Visão Geral</span>
            <span className="lg:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="indicators" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Indicadores</span>
            <span className="lg:hidden">KPIs</span>
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center space-x-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden lg:inline">Matriz de Riscos</span>
            <span className="lg:hidden">Matriz</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span className="hidden lg:inline">Insights de IA</span>
            <span className="lg:hidden">IA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced">
          <EnhancedQualityDashboard />
        </TabsContent>

        <TabsContent value="performance">
          <QualityPerformanceWidget />
        </TabsContent>

        <TabsContent value="trends">
          <QualityTrendsAnalyzer />
        </TabsContent>

        <TabsContent value="overview">
          <QualityDashboard />
        </TabsContent>

        <TabsContent value="indicators">
          <QualityIndicatorDashboard />
        </TabsContent>

        <TabsContent value="matrix">
          <QualityMatrix />
        </TabsContent>

        <TabsContent value="insights">
          <AIQualityInsights />
        </TabsContent>
        </Tabs>
    </div>
  );
};

export default QualityDashboardPage;