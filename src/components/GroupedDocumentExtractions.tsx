import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { createDocumentApprovalLog } from '@/services/documentApprovalLog';

interface ExtractedPreview {
  id: string;
  extraction_job_id: string;
  target_table: string;
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
  validation_status: string;
  created_at: string;
  document_extraction_jobs?: {
    documents?: {
      file_name: string;
      file_path: string;
    };
  };
}

interface GroupedExtraction {
  jobId: string;
  fileName: string;
  items: ExtractedPreview[];
  totalConfidence: number;
  supplierCount: number;
  wasteLogCount: number;
}

interface Props {
  previews: ExtractedPreview[];
}

export function GroupedDocumentExtractions({ previews }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Group previews by extraction_job_id
  const groupedExtractions = previews?.reduce((acc, preview) => {
    const jobId = preview.extraction_job_id;
    if (!acc[jobId]) {
      acc[jobId] = {
        jobId,
        fileName: preview.document_extraction_jobs?.documents?.file_name || 'Documento',
        items: [],
        totalConfidence: 0,
        supplierCount: 0,
        wasteLogCount: 0,
      };
    }
    acc[jobId].items.push(preview);
    
    // Count by table type
    if (preview.target_table === 'suppliers') {
      acc[jobId].supplierCount++;
    } else if (preview.target_table === 'waste_logs') {
      acc[jobId].wasteLogCount++;
    }
    
    // Sum confidence for average
    const avgConfidence = getAverageConfidence(preview.confidence_scores);
    acc[jobId].totalConfidence += avgConfidence;
    
    return acc;
  }, {} as Record<string, GroupedExtraction>);

  const groups = Object.values(groupedExtractions || {});

  // Approve all items in a group
  const approveAllMutation = useMutation({
    mutationFn: async (group: GroupedExtraction) => {
      const startTime = Date.now();
      let successCount = 0;
      let errorCount = 0;
      
      for (const preview of group.items) {
        try {
          const { error } = await supabase.functions.invoke('document-ai-processor', {
            body: {
              action: 'approve',
              preview_id: preview.id,
              batch_mode: true
            }
          });

          if (error) {
            errorCount++;
            console.error(`Error approving ${preview.id}:`, error);
          } else {
            successCount++;
            await createDocumentApprovalLog({
              preview_id: preview.id,
              job_id: preview.extraction_job_id,
              action: 'batch_approved',
              items_count: Object.keys(preview.extracted_fields).length,
            });
          }
        } catch (err) {
          errorCount++;
          console.error(`Error approving ${preview.id}:`, err);
        }
      }

      return { 
        successCount, 
        errorCount,
        processingTime: (Date.now() - startTime) / 1000 
      };
    },
    onSuccess: (data, group) => {
      queryClient.invalidateQueries({ queryKey: ['extraction-previews'] });
      
      if (data.errorCount > 0) {
        toast({
          title: 'Aprovação parcial',
          description: `${data.successCount} extrações aprovadas, ${data.errorCount} falharam.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Documento aprovado',
          description: `Todas as ${data.successCount} extrações foram aprovadas com sucesso em ${data.processingTime.toFixed(1)}s!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro na aprovação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Approve only high confidence items (≥85%)
  const approveHighConfidenceMutation = useMutation({
    mutationFn: async (group: GroupedExtraction) => {
      const startTime = Date.now();
      const highConfidenceItems = group.items.filter(
        item => getAverageConfidence(item.confidence_scores) >= 0.85
      );
      
      let successCount = 0;
      
      for (const preview of highConfidenceItems) {
        const { error } = await supabase.functions.invoke('document-ai-processor', {
          body: {
            action: 'approve',
            preview_id: preview.id,
            batch_mode: true
          }
        });

        if (!error) {
          successCount++;
          await createDocumentApprovalLog({
            preview_id: preview.id,
            job_id: preview.extraction_job_id,
            action: 'batch_approved',
            items_count: Object.keys(preview.extracted_fields).length,
            high_confidence_count: Object.values(preview.confidence_scores).filter(s => s >= 0.85).length,
          });
        }
      }

      return { 
        successCount, 
        totalHigh: highConfidenceItems.length,
        processingTime: (Date.now() - startTime) / 1000 
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extraction-previews'] });
      toast({
        title: 'Aprovação concluída',
        description: `${data.successCount} extrações de alta confiança aprovadas em ${data.processingTime.toFixed(1)}s!`,
      });
    },
  });

  const toggleGroup = (jobId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const getAverageConfidence = (scores: Record<string, number>) => {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const getGroupAverageConfidence = (group: GroupedExtraction) => {
    if (group.items.length === 0) return 0;
    return group.totalConfidence / group.items.length;
  };

  const formatTableName = (table: string) => {
    const names: Record<string, string> = {
      suppliers: 'Fornecedores',
      waste_logs: 'Gestão de Resíduos',
    };
    return names[table] || table;
  };

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.jobId);
        const avgConfidence = getGroupAverageConfidence(group);
        const highConfidenceCount = group.items.filter(
          item => getAverageConfidence(item.confidence_scores) >= 0.85
        ).length;

        return (
          <Card key={group.jobId} className="border-l-4 border-l-primary">
            <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(group.jobId)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle>{group.fileName}</CardTitle>
                    </div>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {group.items.length} extrações
                        </span>
                        {group.supplierCount > 0 && (
                          <Badge variant="outline">
                            {group.supplierCount} fornecedores
                          </Badge>
                        )}
                        {group.wasteLogCount > 0 && (
                          <Badge variant="outline">
                            {group.wasteLogCount} registros de resíduos
                          </Badge>
                        )}
                        <Badge 
                          variant={avgConfidence >= 0.8 ? 'default' : avgConfidence >= 0.6 ? 'secondary' : 'destructive'}
                        >
                          Confiança média: {Math.round(avgConfidence * 100)}%
                        </Badge>
                      </div>
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {isExpanded ? (
                          <>
                            Ocultar <ChevronUp className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Expandir <ChevronDown className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <Button
                    onClick={() => approveAllMutation.mutate(group)}
                    disabled={approveAllMutation.isPending}
                    size="sm"
                    className="gap-2"
                  >
                    {approveAllMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <CheckCircle className="h-4 w-4" />
                    Aprovar Todos ({group.items.length})
                  </Button>
                  
                  {highConfidenceCount > 0 && (
                    <Button
                      onClick={() => approveHighConfidenceMutation.mutate(group)}
                      disabled={approveHighConfidenceMutation.isPending}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      {approveHighConfidenceMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      <CheckCircle className="h-4 w-4" />
                      Aprovar Alta Confiança ({highConfidenceCount})
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const itemConfidence = getAverageConfidence(item.confidence_scores);
                      
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {formatTableName(item.target_table)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {Object.keys(item.extracted_fields).length} campos
                              {item.extracted_fields.name && ` • ${item.extracted_fields.name}`}
                              {item.extracted_fields.waste_description && ` • ${item.extracted_fields.waste_description.substring(0, 50)}...`}
                            </p>
                          </div>
                          <Badge 
                            variant={itemConfidence >= 0.85 ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {Math.round(itemConfidence * 100)}%
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
