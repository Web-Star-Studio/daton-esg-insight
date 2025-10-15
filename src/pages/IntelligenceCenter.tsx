import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Upload, FileText, BarChart3, Database } from 'lucide-react';
import { DocumentAIAnalysis } from '@/components/intelligence/DocumentAIAnalysis';
import { ExtractedDataManager } from '@/components/intelligence/ExtractedDataManager';
import { UnclassifiedDataManager } from '@/components/intelligence/UnclassifiedDataManager';
import { AutomationRulesManager } from '@/components/intelligence/AutomationRulesManager';
import { DocumentAnalyticsDashboard } from '@/components/intelligence/DocumentAnalyticsDashboard';

export default function IntelligenceCenter() {
  const [activeTab, setActiveTab] = useState('analyze');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Centro de Inteligência Universal</h1>
          </div>
          <p className="text-muted-foreground">
            Sistema inteligente de análise de documentos com IA avançada
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-5">
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Analisar
          </TabsTrigger>
          <TabsTrigger value="extracted" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Extraídos
          </TabsTrigger>
          <TabsTrigger value="unclassified" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Não Classificados
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Automação
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <DocumentAIAnalysis />
        </TabsContent>

        <TabsContent value="extracted" className="space-y-6">
          <ExtractedDataManager />
        </TabsContent>

        <TabsContent value="unclassified" className="space-y-6">
          <UnclassifiedDataManager />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <AutomationRulesManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <DocumentAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}