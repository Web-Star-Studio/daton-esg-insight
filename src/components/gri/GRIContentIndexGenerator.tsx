import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { generateGRIContentIndex } from '@/services/griContentIndex';
import { logger } from '@/utils/logger';

interface GRIContentIndexGeneratorProps {
  reportId: string;
  onGenerated?: () => void;
}

export function GRIContentIndexGenerator({ reportId, onGenerated }: GRIContentIndexGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{ identified: number; needsReview: number } | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (regenerate: boolean = false) => {
    try {
      setGenerating(true);
      setProgress(0);
      logger.info('Gerando índice GRI automaticamente', 'gri');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const items = await generateGRIContentIndex(reportId, regenerate);

      clearInterval(progressInterval);
      setProgress(100);

      const needsReview = items.filter(i => (i.ai_confidence_score || 0) < 0.7).length;
      setStats({
        identified: items.length,
        needsReview
      });

      toast({
        title: '✅ Índice GRI Gerado',
        description: `${items.length} indicadores identificados. ${needsReview > 0 ? `${needsReview} precisam de revisão.` : 'Todos verificados!'}`,
      });

      logger.info(`Índice GRI gerado: ${items.length} indicadores`, 'gri');
      onGenerated?.();

    } catch (error) {
      logger.error('Erro ao gerar índice GRI', error, 'gri');
      toast({
        title: 'Erro ao gerar índice',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Gerador de Índice GRI
        </CardTitle>
        <CardDescription>
          O índice GRI mapeia cada indicador para sua localização no relatório.
          A IA analisa automaticamente o conteúdo e identifica os indicadores atendidos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button 
            onClick={() => handleGenerate(false)}
            disabled={generating}
            size="lg"
            className="flex-1"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {generating ? 'Gerando...' : 'Gerar Automaticamente com IA'}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleGenerate(true)}
            disabled={generating}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {generating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Analisando relatório...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {stats && !generating && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  Identificados
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                {stats.identified}
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">indicadores</p>
            </div>

            {stats.needsReview > 0 && (
              <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    Precisam Revisão
                  </span>
                </div>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
                  {stats.needsReview}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Confiança IA &lt; 70%
                </p>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 mt-4">
          <p>💡 <strong>Dica:</strong> A IA analisa todas as seções do relatório e indicadores preenchidos.</p>
          <p>⚡ <strong>Rápido:</strong> Geração completa em menos de 30 segundos.</p>
          <p>✏️ <strong>Editável:</strong> Você pode revisar e ajustar os itens identificados.</p>
        </div>
      </CardContent>
    </Card>
  );
}
