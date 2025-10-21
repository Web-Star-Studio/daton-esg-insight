import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

interface InsertedField {
  name: string;
  aiValue: any;
  tableName: string;
}

interface FeedbackCollectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insertedFields: InsertedField[];
  documentId?: string;
  unclassifiedDataId?: string;
  aiSuggestion: any;
}

export function FeedbackCollector({
  open,
  onOpenChange,
  insertedFields,
  documentId,
  unclassifiedDataId,
  aiSuggestion
}: FeedbackCollectorProps) {
  const { selectedCompany } = useCompany();
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [feedbackType, setFeedbackType] = useState<'approval' | 'correction' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCorrection = (fieldName: string, value: string) => {
    setCorrections(prev => ({
      ...prev,
      [fieldName]: value
    }));
    if (!feedbackType) setFeedbackType('correction');
  };

  const handleApprove = async () => {
    setFeedbackType('approval');
    await submitFeedback('approval');
  };

  const submitFeedback = async (type: 'approval' | 'correction') => {
    if (!selectedCompany?.id) return;

    try {
      setSubmitting(true);

      const correctionDetails = Object.keys(corrections).length > 0
        ? corrections
        : null;

      // Note: ai_feedback_logs table needs to be created via migration
      // For now, we'll log to console until the table is available
      console.log('Feedback would be saved:', {
        company_id: selectedCompany.id,
        document_id: documentId,
        unclassified_data_id: unclassifiedDataId,
        ai_suggestion: aiSuggestion,
        user_correction: correctionDetails,
        feedback_type: type,
        correction_details: correctionDetails ? {
          fields_corrected: Object.keys(corrections),
          correction_count: Object.keys(corrections).length
        } : null,
        created_by_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      // TODO: Uncomment when ai_feedback_logs table is created
      // const { error } = await supabase.from('ai_feedback_logs').insert(feedbackData);
      // if (error) throw error;

      toast.success(
        type === 'approval' 
          ? 'Obrigado! Seu feedback ajuda a melhorar a IA' 
          : 'Correções registradas com sucesso'
      );

      onOpenChange(false);
      setCorrections({});
      setFeedbackType(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Erro ao enviar feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ✅ Dados Inseridos com Sucesso!
          </DialogTitle>
          <DialogDescription>
            Ajude a melhorar a IA corrigindo qualquer imprecisão nos dados extraídos
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {insertedFields.map((field, index) => (
              <div key={index} className="p-4 rounded-lg border bg-card space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{field.name}</Label>
                    <Badge variant="outline" className="text-xs">
                      {field.tableName}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Valor extraído pela IA:</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {formatValue(field.aiValue)}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`correction-${index}`} className="text-xs text-muted-foreground">
                      Valor correto (deixe vazio se estiver correto):
                    </Label>
                    <Input
                      id={`correction-${index}`}
                      placeholder="Digite o valor correto..."
                      value={corrections[field.name] || ''}
                      onChange={(e) => handleCorrection(field.name, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {Object.keys(corrections).length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
            <div className="text-xs text-warning">
              <p className="font-medium">Correções detectadas</p>
              <p>{Object.keys(corrections).length} campo(s) serão reportados para melhorar a IA</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setCorrections({});
              setFeedbackType(null);
            }}
            className="flex-1"
          >
            Pular
          </Button>

          {Object.keys(corrections).length === 0 ? (
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1"
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              {submitting ? 'Enviando...' : 'Tudo Correto!'}
            </Button>
          ) : (
            <Button
              onClick={() => submitFeedback('correction')}
              disabled={submitting}
              className="flex-1"
            >
              <ThumbsDown className="mr-2 h-4 w-4" />
              {submitting ? 'Enviando...' : 'Enviar Correções'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}