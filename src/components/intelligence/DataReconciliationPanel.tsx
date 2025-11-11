import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, XCircle, Edit2, Save, AlertTriangle, 
  FileText, Eye, TrendingUp, TrendingDown, Minus 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedField {
  name: string;
  extracted_value: any;
  current_value?: any;
  confidence: number;
  source_text?: string;
  unit?: string;
  change_type?: 'new' | 'modified' | 'conflict' | 'unchanged';
}

interface ReconciliationData {
  id: string;
  document_name: string;
  target_table: string;
  fields: ExtractedField[];
  overall_confidence: number;
  has_conflicts: boolean;
  extraction_job_id?: string;
}

interface DataReconciliationPanelProps {
  data: ReconciliationData;
  onApprove: (editedData: Record<string, any>, notes?: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onCancel: () => void;
  showDocumentPreview?: boolean;
}

export function DataReconciliationPanel({
  data,
  onApprove,
  onReject,
  onCancel,
  showDocumentPreview = true
}: DataReconciliationPanelProps) {
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const newFields = data.fields.filter(f => f.change_type === 'new').length;
    const modifiedFields = data.fields.filter(f => f.change_type === 'modified').length;
    const conflictFields = data.fields.filter(f => f.change_type === 'conflict').length;
    const highConfidence = data.fields.filter(f => f.confidence >= 0.8).length;

    return { newFields, modifiedFields, conflictFields, highConfidence };
  }, [data.fields]);

  const handleFieldEdit = (fieldName: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const toggleEditMode = (fieldName: string) => {
    setEditMode(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleApproveAll = async () => {
    setIsSubmitting(true);
    try {
      const finalData: Record<string, any> = {};
      
      data.fields.forEach(field => {
        finalData[field.name] = editedValues[field.name] ?? field.extracted_value;
      });

      await onApprove(finalData, approvalNotes || undefined);
      toast.success('Dados aprovados com sucesso!');
    } catch (error) {
      console.error('Error approving data:', error);
      toast.error('Erro ao aprovar dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveSelected = async () => {
    setIsSubmitting(true);
    try {
      const selectedData: Record<string, any> = {};
      
      // Apenas campos sem conflitos ou editados
      data.fields
        .filter(f => f.change_type !== 'conflict' || editMode[f.name])
        .forEach(field => {
          selectedData[field.name] = editedValues[field.name] ?? field.extracted_value;
        });

      if (Object.keys(selectedData).length === 0) {
        toast.error('Nenhum campo selecionado para aprovação');
        return;
      }

      await onApprove(selectedData, approvalNotes || undefined);
      toast.success(`${Object.keys(selectedData).length} campo(s) aprovado(s)!`);
    } catch (error) {
      console.error('Error approving selected data:', error);
      toast.error('Erro ao aprovar campos selecionados');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(rejectReason);
      toast.success('Dados rejeitados');
    } catch (error) {
      console.error('Error rejecting data:', error);
      toast.error('Erro ao rejeitar dados');
    } finally {
      setIsSubmitting(false);
      setShowRejectDialog(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'new':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'modified':
        return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">{data.document_name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Destino: <Badge variant="outline">{data.target_table}</Badge>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Confiança Geral</p>
                <p className={`text-2xl font-bold ${getConfidenceColor(data.overall_confidence)}`}>
                  {(data.overall_confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.newFields}</p>
              <p className="text-xs text-muted-foreground">Novos Campos</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{stats.modifiedFields}</p>
              <p className="text-xs text-muted-foreground">Modificados</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.conflictFields}</p>
              <p className="text-xs text-muted-foreground">Conflitos</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.highConfidence}</p>
              <p className="text-xs text-muted-foreground">Alta Confiança</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {data.has_conflicts && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este documento contém {stats.conflictFields} conflito(s) que requerem atenção manual.
            Revise os campos destacados antes de aprovar.
          </AlertDescription>
        </Alert>
      )}

      {/* Fields Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.fields.map((field) => {
            const isEditing = editMode[field.name];
            const currentValue = editedValues[field.name] ?? field.extracted_value;
            const hasCurrentValue = field.current_value !== undefined && field.current_value !== null;

            return (
              <div 
                key={field.name}
                className={`p-4 rounded-lg border-2 ${
                  field.change_type === 'conflict' ? 'border-red-200 bg-red-50' :
                  field.change_type === 'modified' ? 'border-yellow-200 bg-yellow-50' :
                  field.change_type === 'new' ? 'border-green-200 bg-green-50' :
                  'border-border bg-background'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    {getChangeIcon(field.change_type)}
                    <div>
                      <Label className="text-sm font-semibold">{field.name}</Label>
                      {field.unit && (
                        <span className="text-xs text-muted-foreground ml-2">({field.unit})</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={getConfidenceBadge(field.confidence)}>
                      {(field.confidence * 100).toFixed(0)}%
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEditMode(field.name)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Valor Atual (se existir) */}
                  {hasCurrentValue && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Valor Atual</Label>
                      <div className="p-2 bg-muted rounded text-sm">
                        {String(field.current_value)}
                      </div>
                    </div>
                  )}

                  {/* Valor Extraído */}
                  <div className={`space-y-2 ${!hasCurrentValue ? 'col-span-2' : ''}`}>
                    <Label className="text-xs text-muted-foreground">
                      {isEditing ? 'Editar Valor' : 'Valor Extraído'}
                    </Label>
                    {isEditing ? (
                      <Input
                        value={String(currentValue || '')}
                        onChange={(e) => handleFieldEdit(field.name, e.target.value)}
                        className="bg-background"
                      />
                    ) : (
                      <div className="p-2 bg-background rounded text-sm font-medium">
                        {String(currentValue || '-')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Source Text */}
                {field.source_text && (
                  <div className="mt-3 pt-3 border-t">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Texto Original:
                    </Label>
                    <p className="text-xs italic text-muted-foreground line-clamp-2">
                      "{field.source_text}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Approval Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas de Aprovação (opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Adicione comentários ou observações sobre esta aprovação..."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      {!showRejectDialog ? (
        <div className="flex justify-between gap-3 p-4 bg-muted rounded-lg">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
            
            {data.has_conflicts && (
              <Button
                variant="secondary"
                onClick={handleApproveSelected}
                disabled={isSubmitting}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aprovar Selecionados
              </Button>
            )}

            <Button
              onClick={handleApproveAll}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprovar Todos
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Motivo da Rejeição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Por favor, descreva o motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="border-destructive"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={isSubmitting}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting || !rejectReason.trim()}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Rejeitando...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirmar Rejeição
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
