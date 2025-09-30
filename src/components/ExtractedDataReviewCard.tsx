import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Edit3,
  Calendar,
  Hash,
  Type
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  approveExtractedData, 
  rejectExtractedData,
  ExtractedDataPreview,
  getConfidenceBadgeVariant,
  formatConfidenceScore
} from '@/services/documentAI';

interface ExtractedDataReviewCardProps {
  extraction: ExtractedDataPreview;
  onUpdate: () => void;
  className?: string;
}

export const ExtractedDataReviewCard: React.FC<ExtractedDataReviewCardProps> = ({
  extraction,
  onUpdate,
  className
}) => {
  const [editedData, setEditedData] = useState<Record<string, any>>(
    extraction.extracted_fields as Record<string, any>
  );
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const confidenceScores = extraction.confidence_scores as Record<string, number>;
  const avgConfidence = Object.values(confidenceScores || {}).length > 0
    ? Object.values(confidenceScores).reduce((a, b) => a + b, 0) / Object.values(confidenceScores).length
    : 0;

  const hasLowConfidenceFields = Object.values(confidenceScores || {}).some(score => score < 0.6);

  const handleFieldChange = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApprove = async () => {
    try {
      setProcessing(true);
      await approveExtractedData(extraction.id, editedData);
      toast.success('Dados aprovados e integrados com sucesso!', {
        description: 'Os dados foram inseridos na tabela de atividades.'
      });
      onUpdate();
    } catch (error) {
      console.error('Error approving data:', error);
      toast.error('Erro ao aprovar dados', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNotes.trim()) {
      toast.error('Por favor, adicione uma justificativa para a rejeição');
      return;
    }

    try {
      setProcessing(true);
      await rejectExtractedData(extraction.id, rejectionNotes);
      toast.success('Dados rejeitados');
      onUpdate();
    } catch (error) {
      console.error('Error rejecting data:', error);
      toast.error('Erro ao rejeitar dados');
    } finally {
      setProcessing(false);
      setShowRejectForm(false);
      setRejectionNotes('');
    }
  };

  const getFieldIcon = (field: string, value: any) => {
    if (field.includes('data') || field.includes('date')) {
      return <Calendar className="h-3 w-3 text-muted-foreground" />;
    }
    if (typeof value === 'number') {
      return <Hash className="h-3 w-3 text-muted-foreground" />;
    }
    return <Type className="h-3 w-3 text-muted-foreground" />;
  };

  const renderFieldEditor = (field: string, value: any, confidence?: number) => {
    const isLowConfidence = confidence && confidence < 0.6;
    
    // Detectar tipo do campo para renderizar input apropriado
    if (typeof value === 'number') {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={field} className="flex items-center gap-2">
              {getFieldIcon(field, value)}
              <span className="capitalize">{field.replace(/_/g, ' ')}</span>
            </Label>
            {confidence && (
              <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
                {formatConfidenceScore(confidence)}
              </Badge>
            )}
          </div>
          <Input
            id={field}
            type="number"
            value={editedData[field] ?? value}
            onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
            step="any"
            className={isLowConfidence ? 'border-orange-300 bg-orange-50' : ''}
          />
          {isLowConfidence && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-orange-600">Baixa confiança - verificar valor</span>
            </div>
          )}
        </div>
      );
    }

    if (field.includes('data') || field.includes('date')) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={field} className="flex items-center gap-2">
              {getFieldIcon(field, value)}
              <span className="capitalize">{field.replace(/_/g, ' ')}</span>
            </Label>
            {confidence && (
              <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
                {formatConfidenceScore(confidence)}
              </Badge>
            )}
          </div>
          <Input
            id={field}
            type="date"
            value={editedData[field] ?? value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={isLowConfidence ? 'border-orange-300 bg-orange-50' : ''}
          />
          {isLowConfidence && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-orange-600">Baixa confiança - verificar data</span>
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'string' && value.length > 100) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={field} className="flex items-center gap-2">
              {getFieldIcon(field, value)}
              <span className="capitalize">{field.replace(/_/g, ' ')}</span>
            </Label>
            {confidence && (
              <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
                {formatConfidenceScore(confidence)}
              </Badge>
            )}
          </div>
          <Textarea
            id={field}
            value={editedData[field] ?? value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={3}
            className={isLowConfidence ? 'border-orange-300 bg-orange-50' : ''}
          />
          {isLowConfidence && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-orange-600">Baixa confiança - revisar texto</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={field} className="flex items-center gap-2">
            {getFieldIcon(field, value)}
            <span className="capitalize">{field.replace(/_/g, ' ')}</span>
          </Label>
          {confidence && (
            <Badge variant={getConfidenceBadgeVariant(confidence)} className="text-xs">
              {formatConfidenceScore(confidence)}
            </Badge>
          )}
        </div>
        <Input
          id={field}
          value={editedData[field] ?? value}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className={isLowConfidence ? 'border-orange-300 bg-orange-50' : ''}
        />
        {isLowConfidence && (
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-orange-500" />
            <span className="text-xs text-orange-600">Baixa confiança - verificar</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Documento {extraction.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {extraction.target_table === 'activity_data' ? 'Dados de Atividade' : extraction.target_table}
            </Badge>
            <Badge variant={getConfidenceBadgeVariant(avgConfidence)}>
              {formatConfidenceScore(avgConfidence)}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Criado em {new Date(extraction.created_at).toLocaleString('pt-BR')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Alertas importantes */}
        {hasLowConfidenceFields && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este documento possui campos com baixa confiança. Revise cuidadosamente os campos 
              destacados antes de aprovar.
            </AlertDescription>
          </Alert>
        )}

        {/* Campos extraídos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Dados Extraídos</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(extraction.extracted_fields as Record<string, any>).map(([field, value]) => {
              const confidence = confidenceScores?.[field];
              
              return (
                <div key={field}>
                  {renderFieldEditor(field, value, confidence)}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Formulário de rejeição */}
        {showRejectForm && (
          <div className="space-y-3">
            <Label htmlFor="rejection-notes">Motivo da rejeição</Label>
            <Textarea
              id="rejection-notes"
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              rows={3}
            />
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-3">
          {!showRejectForm ? (
            <>
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {processing ? 'Aprovando...' : 'Aprovar e Integrar'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(true)}
                disabled={processing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing || !rejectionNotes.trim()}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {processing ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionNotes('');
                }}
                disabled={processing}
              >
                Cancelar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};