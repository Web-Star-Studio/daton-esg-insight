import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, GitCompare } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Documentos from './Documentos';
import ExtracoesDocumentos from './ExtracoesDocumentos';
import { ReconciliacaoDocumentos } from './ReconciliacaoDocumentos';
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
    <div className="space-y-6">
      {/* Header */}
      <header>
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Documentos</h1>
            <p className="text-muted-foreground">
              Central unificada para gerenciar documentos, extrações IA e reconciliação
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="biblioteca" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Biblioteca</span>
          </TabsTrigger>
          <TabsTrigger value="extracoes" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span>Aprovações Pendentes</span>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reconciliacao" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            <span>Reconciliação IA</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="biblioteca" className="mt-6">
          <Documentos />
        </TabsContent>

        <TabsContent value="extracoes" className="mt-6">
          <ExtracoesDocumentos />
        </TabsContent>

        <TabsContent value="reconciliacao" className="mt-6">
          <ReconciliacaoDocumentos />
        </TabsContent>
      </Tabs>
    </div>
  );
}
