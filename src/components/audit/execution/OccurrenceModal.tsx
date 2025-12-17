import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateOccurrence, useUpdateOccurrence } from "@/hooks/audit/useExecution";
import { AuditOccurrence } from "@/services/audit/execution";
import { supabase } from "@/integrations/supabase/client";

interface OccurrenceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditId: string;
  companyId: string;
  sessionId?: string;
  sessionItemId?: string;
  responseId?: string;
  occurrence?: AuditOccurrence | null;
}

export function OccurrenceModal({
  open,
  onOpenChange,
  auditId,
  companyId,
  sessionId,
  sessionItemId,
  responseId,
  occurrence,
}: OccurrenceModalProps) {
  const isEditing = !!occurrence;

  const [formData, setFormData] = useState({
    occurrence_type: occurrence?.occurrence_type || 'NC_menor' as const,
    title: occurrence?.title || '',
    description: occurrence?.description || '',
    root_cause: occurrence?.root_cause || '',
    immediate_action: occurrence?.immediate_action || '',
    corrective_action: occurrence?.corrective_action || '',
    preventive_action: occurrence?.preventive_action || '',
    priority: occurrence?.priority || 'Media' as const,
    due_date: occurrence?.due_date || '',
    responsible_user_id: occurrence?.responsible_user_id || '',
  });

  const createOccurrence = useCreateOccurrence();
  const updateOccurrence = useUpdateOccurrence();

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (isEditing && occurrence) {
      await updateOccurrence.mutateAsync({
        id: occurrence.id,
        updates: {
          ...formData,
          due_date: formData.due_date || null,
          responsible_user_id: formData.responsible_user_id || null,
        },
      });
    } else {
      await createOccurrence.mutateAsync({
        audit_id: auditId,
        company_id: companyId,
        session_id: sessionId || null,
        session_item_id: sessionItemId || null,
        response_id: responseId || null,
        occurrence_type: formData.occurrence_type,
        title: formData.title,
        description: formData.description,
        root_cause: formData.root_cause || null,
        immediate_action: formData.immediate_action || null,
        corrective_action: formData.corrective_action || null,
        preventive_action: formData.preventive_action || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        responsible_user_id: formData.responsible_user_id || null,
        status: 'Aberta',
        evidence_required: true,
        closed_at: null,
        closed_by: null,
        created_by: user?.id || null,
      });
    }

    onOpenChange(false);
  };

  const isPending = createOccurrence.isPending || updateOccurrence.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Ocorrência' : 'Nova Ocorrência'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Ocorrência</Label>
              <Select
                value={formData.occurrence_type}
                onValueChange={(value: 'NC_maior' | 'NC_menor' | 'OM' | 'Observacao') =>
                  setFormData({ ...formData, occurrence_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NC_maior">Não Conformidade Maior</SelectItem>
                  <SelectItem value="NC_menor">Não Conformidade Menor</SelectItem>
                  <SelectItem value="OM">Oportunidade de Melhoria</SelectItem>
                  <SelectItem value="Observacao">Observação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'Baixa' | 'Media' | 'Alta' | 'Critica') =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Media">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título resumido da ocorrência"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva detalhadamente a ocorrência identificada..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="root_cause">Causa Raiz</Label>
            <Textarea
              id="root_cause"
              value={formData.root_cause}
              onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
              placeholder="Análise de causa raiz..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="immediate_action">Ação Imediata</Label>
            <Textarea
              id="immediate_action"
              value={formData.immediate_action}
              onChange={(e) => setFormData({ ...formData, immediate_action: e.target.value })}
              placeholder="Ações imediatas para contenção..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="corrective_action">Ação Corretiva</Label>
            <Textarea
              id="corrective_action"
              value={formData.corrective_action}
              onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
              placeholder="Ações corretivas planejadas..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preventive_action">Ação Preventiva</Label>
            <Textarea
              id="preventive_action"
              value={formData.preventive_action}
              onChange={(e) => setFormData({ ...formData, preventive_action: e.target.value })}
              placeholder="Ações preventivas para evitar recorrência..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Prazo</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !formData.title || !formData.description}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Criar Ocorrência'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
