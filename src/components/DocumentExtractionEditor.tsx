import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle, Edit2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExtractedPreview {
  id: string;
  extraction_job_id: string;
  target_table: string;
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
  suggested_mappings: any;
  validation_status: string;
  created_at: string;
  document_extraction_jobs?: {
    documents?: {
      file_name: string;
      file_path: string;
    };
  };
}

interface DocumentExtractionEditorProps {
  preview: ExtractedPreview;
  onApprove: (editedFields: Record<string, any>) => void;
  onReject: () => void;
  isLoading: boolean;
}

// Campos obrigatórios por tabela
const REQUIRED_FIELDS: Record<string, string[]> = {
  licenses: ['license_name', 'license_type', 'issue_date', 'expiration_date'],
  assets: ['name', 'asset_type'],
  waste_logs: ['waste_type', 'quantity', 'unit', 'log_date'],
  emission_sources: ['source_name', 'scope', 'category'],
  suppliers: ['name'],
  employees: ['full_name', 'hire_date'],
  energy_consumption: ['source_type', 'consumption_date', 'quantity_kwh'],
  water_consumption: ['consumption_date', 'quantity_m3'],
};

// Labels amigáveis para campos
const FIELD_LABELS: Record<string, string> = {
  license_name: 'Nome da Licença',
  license_type: 'Tipo de Licença',
  issue_date: 'Data de Emissão',
  expiration_date: 'Data de Validade',
  name: 'Nome',
  asset_type: 'Tipo de Ativo',
  waste_type: 'Tipo de Resíduo',
  quantity: 'Quantidade',
  unit: 'Unidade',
  log_date: 'Data do Registro',
  source_name: 'Nome da Fonte',
  scope: 'Escopo',
  category: 'Categoria',
  full_name: 'Nome Completo',
  hire_date: 'Data de Contratação',
  source_type: 'Tipo de Fonte',
  consumption_date: 'Data de Consumo',
  quantity_kwh: 'Quantidade (kWh)',
  quantity_m3: 'Quantidade (m³)',
  cost: 'Custo',
  supplier: 'Fornecedor',
  cnpj: 'CNPJ',
  cpf: 'CPF',
  email: 'E-mail',
  phone: 'Telefone',
  address: 'Endereço',
  description: 'Descrição',
  notes: 'Observações',
  status: 'Status',
};

export function DocumentExtractionEditor({
  preview,
  onApprove,
  onReject,
  isLoading,
}: DocumentExtractionEditorProps) {
  const [editedFields, setEditedFields] = useState<Record<string, any>>(preview.extracted_fields);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Extrair informações de qualidade dos suggested_mappings
  const qualityInfo = preview.suggested_mappings || {};
  const normalizedFields = qualityInfo.normalized_fields || {};
  const appliedCorrections = qualityInfo.applied_corrections || [];
  const dataQualityIssues = qualityInfo.data_quality_issues || [];
  const extractionReasoning = qualityInfo.extraction_reasoning || {};

  // Campos obrigatórios para esta tabela
  const requiredFields = REQUIRED_FIELDS[preview.target_table] || [];

  // Calcular confiança média
  const getAverageConfidence = () => {
    const values = Object.values(preview.confidence_scores);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const avgConfidence = getAverageConfidence();

  // Campos que precisam revisão (confiança < 70%)
  const fieldsNeedingReview = Object.entries(preview.confidence_scores)
    .filter(([_, score]) => score < 0.7)
    .map(([field]) => field);

  // Validar campos ao editar
  useEffect(() => {
    const errors: Record<string, string> = {};
    
    requiredFields.forEach(field => {
      if (!editedFields[field] || String(editedFields[field]).trim() === '') {
        errors[field] = 'Campo obrigatório';
      }
    });

    setValidationErrors(errors);
  }, [editedFields, requiredFields]);

  const handleFieldChange = (field: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [field]: value }));
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-success';
    if (score >= 0.6) return 'text-warning';
    return 'text-destructive';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-success text-xs">Alta</Badge>;
    if (score >= 0.6) return <Badge className="bg-warning text-xs">Média</Badge>;
    return <Badge variant="destructive" className="text-xs">Baixa</Badge>;
  };

  const handleApprove = () => {
    if (Object.keys(validationErrors).length > 0) {
      return; // Não aprovar se houver erros
    }
    onApprove(editedFields);
  };

  const allFieldsToDisplay = [
    ...new Set([
      ...Object.keys(editedFields),
      ...requiredFields,
    ])
  ];

  return (
    <div className="space-y-4">
      {/* Resumo de Qualidade */}
      <Card className={cn(
        "border-l-4",
        avgConfidence >= 0.8 ? "border-l-success" : 
        avgConfidence >= 0.6 ? "border-l-warning" : 
        "border-l-destructive"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Resumo da Qualidade</CardTitle>
            <Badge className={cn(
              avgConfidence >= 0.8 ? "bg-success" : 
              avgConfidence >= 0.6 ? "bg-warning" : 
              "bg-destructive"
            )}>
              Confiança Média: {Math.round(avgConfidence * 100)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {fieldsNeedingReview.length > 0 && (
            <Alert className="border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{fieldsNeedingReview.length} campos</strong> precisam de revisão manual (confiança &lt;70%)
              </AlertDescription>
            </Alert>
          )}

          {appliedCorrections.length > 0 && (
            <Alert className="border-primary bg-primary/5">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Correções Automáticas Aplicadas:</strong>
                <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                  {appliedCorrections.map((correction: string, i: number) => (
                    <li key={i}>{correction}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {dataQualityIssues.length > 0 && (
            <Alert className="border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Problemas de Qualidade Detectados:</strong>
                <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                  {dataQualityIssues.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Editor de Campos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Editar Campos Extraídos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allFieldsToDisplay.map(field => {
              const isRequired = requiredFields.includes(field);
              const confidence = preview.confidence_scores[field] || 0;
              const needsReview = confidence < 0.7;
              const hasError = validationErrors[field];
              const reasoning = extractionReasoning[field];

              return (
                <div key={field} className={cn(
                  "space-y-2 p-3 rounded-lg border",
                  needsReview && "border-warning bg-warning/5",
                  hasError && "border-destructive bg-destructive/5"
                )}>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {FIELD_LABELS[field] || field}
                      {isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <div className="flex items-center gap-2">
                      {getConfidenceBadge(confidence)}
                      <span className={cn("text-xs font-medium", getConfidenceColor(confidence))}>
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {field === 'description' || field === 'notes' ? (
                    <Textarea
                      value={editedFields[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className={cn(hasError && "border-destructive")}
                      rows={3}
                    />
                  ) : field === 'status' ? (
                    <Select
                      value={editedFields[field] || ''}
                      onValueChange={(value) => handleFieldChange(field, value)}
                    >
                      <SelectTrigger className={cn(hasError && "border-destructive")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.includes('date') ? 'date' : 
                            field.includes('quantity') || field.includes('cost') ? 'number' : 
                            'text'}
                      value={editedFields[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className={cn(hasError && "border-destructive")}
                      step={field.includes('quantity') || field.includes('cost') ? '0.01' : undefined}
                    />
                  )}

                  {hasError && (
                    <p className="text-xs text-destructive">{hasError}</p>
                  )}

                  {reasoning && (
                    <p className="text-xs text-muted-foreground italic">
                      💡 {reasoning}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {Object.keys(validationErrors).length > 0 && (
            <Alert className="mt-4 border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Corrija os seguintes erros antes de aprovar:</strong>
                <ul className="list-disc list-inside mt-2 text-sm">
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}>
                      <strong>{FIELD_LABELS[field] || field}:</strong> {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-3">
        <Button
          onClick={handleApprove}
          disabled={isLoading || Object.keys(validationErrors).length > 0}
          className="flex-1"
          size="lg"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          {Object.keys(validationErrors).length > 0 
            ? 'Corrija os Erros para Aprovar' 
            : 'Aprovar e Inserir no Sistema'}
        </Button>
        <Button
          variant="destructive"
          onClick={onReject}
          disabled={isLoading}
          className="flex-1"
          size="lg"
        >
          <XCircle className="h-5 w-5 mr-2" />
          Rejeitar Extração
        </Button>
      </div>
    </div>
  );
}
