import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Upload, FileText, BarChart3, Database } from 'lucide-react';
import { DocumentAIAnalysis } from '@/components/intelligence/DocumentAIAnalysis';
import { ExtractedDataManager } from '@/components/intelligence/ExtractedDataManager';

export default function IntelligenceCenter() {
  const [activeTab, setActiveTab] = useState('analyze');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Centro de Inteligência</h1>
          </div>
          <p className="text-muted-foreground">
            Análise inteligente de documentos com IA
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Analisar Documento
          </TabsTrigger>
          <TabsTrigger value="extracted" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Dados Extraídos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <DocumentAIAnalysis />
        </TabsContent>

        <TabsContent value="extracted" className="space-y-6">
          <ExtractedDataManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}