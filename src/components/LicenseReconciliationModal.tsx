import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  Save, 
  X,
  FileText,
  Calendar,
  MapPin,
  Building,
  Hash,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface LicenseData {
  id: string;
  license_number?: string;
  license_type?: string;
  process_number?: string;
  issue_date?: string;
  expiration_date?: string;
  company_name?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  activity?: string;
  ai_confidence_score?: number;
  ai_extracted_data?: any;
}

interface LicenseReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (data: any) => Promise<void>;
  licenseData: LicenseData | null;
  documentFileName?: string;
}

interface EditableField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'textarea';
  icon: React.ElementType;
  required?: boolean;
}

const fields: EditableField[] = [
  { key: 'name', label: 'Número da Licença', type: 'text', icon: Hash, required: true },
  { key: 'type', label: 'Tipo da Licença', type: 'text', icon: FileText, required: true },
  { key: 'process_number', label: 'Número do Processo', type: 'text', icon: Hash },
  { key: 'issue_date', label: 'Data de Emissão', type: 'date', icon: Calendar },
  { key: 'expiration_date', label: 'Data de Vencimento', type: 'date', icon: Calendar, required: true },
  { key: 'issuing_body', label: 'Órgão Emissor', type: 'text', icon: Building, required: true },
  { key: 'conditions', label: 'Condicionantes', type: 'textarea', icon: Activity },
];

export const LicenseReconciliationModal: React.FC<LicenseReconciliationModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  licenseData,
  documentFileName
}) => {
  const [editedData, setEditedData] = useState<any>({});
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (licenseData) {
      setEditedData({ ...licenseData });
      setEditingFields(new Set());
    }
  }, [licenseData]);

  const handleFieldEdit = (fieldKey: string) => {
    const newEditing = new Set(editingFields);
    newEditing.add(fieldKey);
    setEditingFields(newEditing);
  };

  const handleFieldSave = (fieldKey: string) => {
    const newEditing = new Set(editingFields);
    newEditing.delete(fieldKey);
    setEditingFields(newEditing);
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null;
    
    const variant = confidence >= 80 ? 'default' : confidence >= 60 ? 'secondary' : 'destructive';
    const icon = confidence >= 80 ? CheckCircle : AlertTriangle;
    const IconComponent = icon;
    
    return (
      <Badge variant={variant} className="gap-1">
        <IconComponent className="h-3 w-3" />
        {confidence}% confiança
      </Badge>
    );
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      const requiredFields = fields.filter(f => f.required);
      const missingFields = requiredFields.filter(field => !editedData[field.key]);
      
      if (missingFields.length > 0) {
        toast.error(`Campos obrigatórios: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }

      await onApprove(editedData);
      toast.success('Licença aprovada e salva com sucesso!');
      onClose();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Erro ao aprovar licença');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!licenseData) return null;

  const renderField = (field: EditableField) => {
    const value = editedData[field.key] || '';
    const isEditing = editingFields.has(field.key);
    const IconComponent = field.icon;

    return (
      <div key={field.key} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <IconComponent className="h-4 w-4 text-muted-foreground" />
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFieldEdit(field.key)}
              className="h-6 w-6 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <div className="flex gap-2">
            {field.type === 'textarea' ? (
              <Textarea
                value={value}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={`Digite ${field.label.toLowerCase()}`}
                rows={3}
                className="text-sm"
              />
            ) : (
              <Input
                type={field.type}
                value={value}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={`Digite ${field.label.toLowerCase()}`}
                className="text-sm"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFieldSave(field.key)}
              className="px-2"
            >
              <Save className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="min-h-[36px] p-2 border rounded-md bg-muted/30 text-sm flex items-center">
            {value || (
              <span className="text-muted-foreground italic">
                {field.required ? 'Campo obrigatório' : 'Não informado'}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Revisão e Aprovação de Dados Extraídos
            </DialogTitle>
            {documentFileName && (
              <p className="text-sm text-muted-foreground">
                Documento: {documentFileName}
              </p>
            )}
            <div className="flex items-center gap-2">
              {getConfidenceBadge(licenseData.ai_confidence_score)}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-6 pr-4">
            {/* Confidence Alert */}
            {licenseData.ai_confidence_score && licenseData.ai_confidence_score < 80 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  A confiança da IA está abaixo de 80%. Revise cuidadosamente os dados extraídos.
                </AlertDescription>
              </Alert>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map(field => (
                <div key={field.key}>
                  {renderField(field)}
                </div>
              ))}
            </div>

            <Separator />

            {/* Instructions */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Revise todos os campos extraídos pela IA. Clique no ícone de edição para corrigir informações incorretas. 
                Campos marcados com * são obrigatórios.
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              'Aprovando...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprovar e Salvar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};