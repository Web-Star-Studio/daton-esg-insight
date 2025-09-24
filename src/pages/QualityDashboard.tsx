import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QualityDashboard from '@/components/QualityDashboard';
import QualityMatrix from '@/components/QualityMatrix';
import AIQualityInsights from '@/components/AIQualityInsights';
import { EnhancedQualityDashboard } from '@/components/EnhancedQualityDashboard';
import { PredictiveQualityWidget } from '@/components/PredictiveQualityWidget';

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="enhanced" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Sistema Avançado</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="matrix" className="flex items-center space-x-2">
            <Grid3X3 className="h-4 w-4" />
            <span>Matriz de Riscos</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Insights de IA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced">
          <EnhancedQualityDashboard />
        </TabsContent>

        <TabsContent value="overview">
          <QualityDashboard />
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