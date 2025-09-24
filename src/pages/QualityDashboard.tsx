import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QualityDashboard from '@/components/QualityDashboard';
import QualityMatrix from '@/components/QualityMatrix';
import AIQualityInsights from '@/components/AIQualityInsights';
import { BarChart3, Brain, Grid3X3 } from 'lucide-react';

const QualityDashboardPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Qualidade</h1>
          <p className="text-muted-foreground">
            Visão completa do Sistema de Gestão da Qualidade
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
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