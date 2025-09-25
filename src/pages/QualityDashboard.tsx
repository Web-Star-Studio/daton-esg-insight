import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QualityDashboard from '@/components/QualityDashboard';
import QualityMatrix from '@/components/QualityMatrix';
import AIQualityInsights from '@/components/AIQualityInsights';
import { EnhancedQualityDashboard } from '@/components/EnhancedQualityDashboard';
import { PredictiveQualityWidget } from '@/components/PredictiveQualityWidget';
import QualityIndicatorDashboard from '@/components/QualityIndicatorDashboard';

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="enhanced" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema Avançado</span>
            <span className="sm:hidden">Avançado</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="indicators" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Indicadores</span>
            <span className="sm:hidden">KPIs</span>
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center space-x-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Matriz de Riscos</span>
            <span className="sm:hidden">Matriz</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Insights de IA</span>
            <span className="sm:hidden">IA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced">
          <EnhancedQualityDashboard />
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