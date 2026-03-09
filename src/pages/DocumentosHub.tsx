import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, GitCompare, Shield } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Documentos from './Documentos';
import { ReconciliacaoDocumentos } from './ReconciliacaoDocumentos';
import { DeduplicationRulesManager } from '@/components/deduplication/DeduplicationRulesManager';

export default function DocumentosHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'biblioteca';

  // SEO
  useEffect(() => {
    document.title = 'Gestão de Documentos | Hub Centralizado';
    const desc = 'Centralize toda gestão documental: biblioteca, reconciliação e deduplicação de dados.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', desc);
    else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary transition-all duration-300 hover-scale" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Documentos</h1>
            <p className="text-muted-foreground">
              Central unificada para gerenciar documentos, reconciliação e deduplicação
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="animate-fade-in">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="biblioteca" className="flex items-center gap-2 transition-all duration-200 hover-scale">
            <FileText className="h-4 w-4" />
            <span>Biblioteca</span>
          </TabsTrigger>
          <TabsTrigger value="reconciliacao" className="flex items-center gap-2 transition-all duration-200 hover-scale">
            <GitCompare className="h-4 w-4" />
            <span>Reconciliação</span>
          </TabsTrigger>
          <TabsTrigger value="deduplicacao" className="flex items-center gap-2 transition-all duration-200 hover-scale">
            <Shield className="h-4 w-4" />
            <span>Deduplicação</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="biblioteca" className="mt-6 animate-fade-in">
          <Documentos />
        </TabsContent>

        <TabsContent value="reconciliacao" className="mt-6 animate-fade-in">
          <ReconciliacaoDocumentos />
        </TabsContent>

        <TabsContent value="deduplicacao" className="mt-6 animate-fade-in">
          <DeduplicationRulesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
