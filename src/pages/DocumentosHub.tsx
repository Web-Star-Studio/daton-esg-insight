import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, GitCompare, Shield } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Documentos from './Documentos';
import ExtracoesDocumentos from './ExtracoesDocumentos';
import { ReconciliacaoDocumentos } from './ReconciliacaoDocumentos';
import { DeduplicationRulesManager } from '@/components/deduplication/DeduplicationRulesManager';
import { getPendingExtractions } from '@/services/documentAI';

export default function DocumentosHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingCount, setPendingCount] = useState(0);
  const activeTab = searchParams.get('tab') || 'biblioteca';

  // SEO
  useEffect(() => {
    document.title = 'Gestão de Documentos | Hub Centralizado com IA';
    const desc = 'Centralize toda gestão documental: biblioteca, aprovações de extrações IA e reconciliação inteligente de dados.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', desc);
    else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }
  }, []);

  // Load pending extractions count
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const extractions = await getPendingExtractions();
        setPendingCount(extractions.length);
      } catch (error) {
        console.error('Error loading pending count:', error);
      }
    };
    loadPendingCount();
  }, [activeTab]);

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
              Central unificada para gerenciar documentos, extrações IA e reconciliação
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="animate-fade-in">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="biblioteca" className="flex items-center gap-2 transition-all duration-200 hover-scale">
            <FileText className="h-4 w-4" />
            <span>Biblioteca</span>
          </TabsTrigger>
          <TabsTrigger value="extracoes" className="flex items-center gap-2 transition-all duration-200 hover-scale">
            <Brain className="h-4 w-4" />
            <span>Aprovações</span>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 animate-scale-in">
                {pendingCount}
              </Badge>
            )}
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

        <TabsContent value="extracoes" className="mt-6 animate-fade-in">
          <ExtracoesDocumentos />
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
