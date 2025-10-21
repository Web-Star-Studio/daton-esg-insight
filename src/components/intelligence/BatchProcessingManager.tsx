import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Zap, Eye, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BatchResult {
  id: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
}

export function BatchProcessingManager() {
  const { selectedCompany } = useCompany();
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [autoDeduplicate, setAutoDeduplicate] = useState(true);
  const [notifyConflicts, setNotifyConflicts] = useState(true);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (selectedCompany?.id) {
      loadEligibleCount();
    }
  }, [selectedCompany?.id, confidenceThreshold]);

  const loadEligibleCount = async () => {
    if (!selectedCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('unclassified_data')
        .select('id, confidence_score')
        .eq('company_id', selectedCompany.id)
        .is('user_decision', null)
        .gte('confidence_score', confidenceThreshold);

      if (error) throw error;
      setEligibleCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading eligible count:', error);
    }
  };

  const handleBatchProcess = async () => {
    if (!selectedCompany?.id || eligibleCount === 0) return;

    try {
      setProcessing(true);
      setProgress(0);
      setCurrent(0);
      setResults([]);

      // Get eligible records
      const { data: eligibleRecords, error: fetchError } = await supabase
        .from('unclassified_data')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .is('user_decision', null)
        .gte('confidence_score', confidenceThreshold)
        .order('confidence_score', { ascending: false });

      if (fetchError) throw fetchError;

      if (!eligibleRecords || eligibleRecords.length === 0) {
        toast.info('Nenhum registro elegível para processamento');
        return;
      }

      setTotal(eligibleRecords.length);
      const batchResults: BatchResult[] = [];

      // Process in batches of 5
      const batchSize = 5;
      for (let i = 0; i < eligibleRecords.length; i += batchSize) {
        const batch = eligibleRecords.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (record) => {
          try {
            // Call intelligent-data-processor
            const { data, error } = await supabase.functions.invoke('intelligent-data-processor', {
              body: {
                extracted_data: record.extracted_data,
                company_id: selectedCompany.id,
                auto_execute: true,
                deduplication: autoDeduplicate ? {
                  enabled: true,
                  similarity_threshold: 0.85,
                  merge_strategy: 'prefer_non_empty'
                } : undefined
              }
            });

            if (error) throw error;

            // Update unclassified_data record
            await supabase
              .from('unclassified_data')
              .update({ 
                user_decision: 'inserted',
                processed_at: new Date().toISOString()
              })
              .eq('id', record.id);

            return {
              id: record.id,
              status: 'success' as const,
              message: `Processado com sucesso (${data.successful_operations?.length || 0} operações)`
            };
          } catch (error) {
            console.error(`Error processing ${record.id}:`, error);
            return {
              id: record.id,
              status: 'failed' as const,
              message: error instanceof Error ? error.message : 'Erro desconhecido'
            };
          }
        });

        const batchResults_batch = await Promise.all(batchPromises);
        batchResults.push(...batchResults_batch);

        setCurrent(Math.min(i + batchSize, eligibleRecords.length));
        setProgress((Math.min(i + batchSize, eligibleRecords.length) / eligibleRecords.length) * 100);
      }

      setResults(batchResults);
      setShowResults(true);

      const successCount = batchResults.filter(r => r.status === 'success').length;
      const failedCount = batchResults.filter(r => r.status === 'failed').length;

      toast.success(
        `Processamento concluído: ${successCount} sucesso, ${failedCount} falhas`,
        { duration: 5000 }
      );

      // Reload eligible count
      await loadEligibleCount();
    } catch (error) {
      console.error('Error in batch processing:', error);
      toast.error('Erro ao processar lote');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <AlertCircle className="h-4 w-4 text-warning" />;
    }
  };

  const autoProcessCount = Math.floor(eligibleCount * 0.9);
  const manualReviewCount = eligibleCount - autoProcessCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Processamento em Lote
        </CardTitle>
        <CardDescription>
          Processe automaticamente dados com alta confiança
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configurações */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Limite mínimo de confiança</Label>
              <Badge variant="outline">{confidenceThreshold}%</Badge>
            </div>
            <Slider
              value={[confidenceThreshold]}
              onValueChange={([value]) => setConfidenceThreshold(value)}
              min={60}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Apenas registros com confiança ≥ {confidenceThreshold}% serão processados
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-deduplicate"
              checked={autoDeduplicate}
              onCheckedChange={(checked) => setAutoDeduplicate(checked as boolean)}
            />
            <Label htmlFor="auto-deduplicate" className="text-sm cursor-pointer">
              Deduplicação automática (similaridade ≥ 85%)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify-conflicts"
              checked={notifyConflicts}
              onCheckedChange={(checked) => setNotifyConflicts(checked as boolean)}
            />
            <Label htmlFor="notify-conflicts" className="text-sm cursor-pointer">
              Notificar sobre conflitos detectados
            </Label>
          </div>
        </div>

        {/* Status */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Registros elegíveis</span>
            <Badge variant="secondary" className="text-base">
              {eligibleCount}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Processamento automático</span>
            <Badge variant="outline">{autoProcessCount}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Revisão manual</span>
            <Badge variant="outline">{manualReviewCount}</Badge>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={handleBatchProcess}
            disabled={processing || eligibleCount === 0}
            className="flex-1"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Processar Lote ({eligibleCount})
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => toast.info('Preview em desenvolvimento')}
            disabled={processing || eligibleCount === 0}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>

        {/* Progress */}
        {processing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Processando {current} de {total} registros...
            </p>
          </div>
        )}

        {/* Results */}
        {showResults && results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Resultados</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(false)}
              >
                Ocultar
              </Button>
            </div>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-card text-xs"
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <p className="font-medium">Registro #{index + 1}</p>
                      <p className="text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}