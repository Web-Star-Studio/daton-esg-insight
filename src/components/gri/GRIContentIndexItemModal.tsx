import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateGRIContentIndexItem, GRIContentIndexItem } from '@/services/griContentIndex';

interface GRIContentIndexItemModalProps {
  item: GRIContentIndexItem;
  reportId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function GRIContentIndexItemModal({
  item,
  reportId,
  onClose,
  onSaved,
}: GRIContentIndexItemModalProps) {
  const [formData, setFormData] = useState({
    disclosure_status: item.disclosure_status,
    section_reference: item.section_reference || '',
    page_number: item.page_number?.toString() || '',
    direct_url: item.direct_url || '',
    related_content: item.related_content || '',
    omission_reason: item.omission_reason || '',
    verification_notes: item.verification_notes || '',
    manually_verified: true,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSaving(true);
      const dataToSave = {
        ...formData,
        page_number: formData.page_number ? parseInt(formData.page_number) : undefined,
      };
      await updateGRIContentIndexItem(item.id, dataToSave);
      toast({
        title: 'Item atualizado',
        description: 'O item do índice GRI foi atualizado com sucesso.',
      });
      onSaved();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Item do Índice GRI</DialogTitle>
          <DialogDescription>
            {item.indicator_code} - {item.indicator_title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="disclosure_status">Status de Disclosure</Label>
            <Select
              value={formData.disclosure_status}
              onValueChange={(value) =>
                setFormData({ ...formData, disclosure_status: value as any })
              }
            >
              <SelectTrigger id="disclosure_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fully_reported">✓ Totalmente Atendido</SelectItem>
                <SelectItem value="partially_reported">⚠ Parcialmente Atendido</SelectItem>
                <SelectItem value="omitted">❌ Omitido</SelectItem>
                <SelectItem value="not_applicable">⊘ Não Aplicável</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="section_reference">Referência da Seção</Label>
              <Input
                id="section_reference"
                placeholder="Ex: Seção 3.2"
                value={formData.section_reference}
                onChange={(e) =>
                  setFormData({ ...formData, section_reference: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page_number">Número da Página</Label>
              <Input
                id="page_number"
                type="number"
                placeholder="Ex: 23"
                value={formData.page_number}
                onChange={(e) =>
                  setFormData({ ...formData, page_number: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direct_url">URL Direta (opcional)</Label>
            <Input
              id="direct_url"
              type="url"
              placeholder="https://..."
              value={formData.direct_url}
              onChange={(e) =>
                setFormData({ ...formData, direct_url: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="related_content">Trecho Relacionado</Label>
            <Textarea
              id="related_content"
              placeholder="Cole o trecho do relatório que atende este indicador..."
              rows={4}
              value={formData.related_content}
              onChange={(e) =>
                setFormData({ ...formData, related_content: e.target.value })
              }
            />
          </div>

          {formData.disclosure_status === 'omitted' && (
            <div className="space-y-2">
              <Label htmlFor="omission_reason">Razão da Omissão</Label>
              <Textarea
                id="omission_reason"
                placeholder="Explique por que este indicador foi omitido..."
                rows={3}
                value={formData.omission_reason}
                onChange={(e) =>
                  setFormData({ ...formData, omission_reason: e.target.value })
                }
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="verification_notes">Notas de Verificação</Label>
            <Textarea
              id="verification_notes"
              placeholder="Adicione notas sobre a verificação deste item..."
              rows={2}
              value={formData.verification_notes}
              onChange={(e) =>
                setFormData({ ...formData, verification_notes: e.target.value })
              }
            />
          </div>

          {item.ai_confidence_score && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm">
                <strong>Confiança da IA:</strong>{' '}
                {(item.ai_confidence_score * 100).toFixed(0)}%
              </p>
              {item.ai_confidence_score < 0.7 && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Baixa confiança - recomenda-se revisão manual
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
