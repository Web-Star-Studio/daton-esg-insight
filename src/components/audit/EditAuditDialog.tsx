import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EditAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: any;
}

export function EditAuditDialog({ open, onOpenChange, audit }: EditAuditDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: audit?.title || "",
    audit_type: audit?.audit_type || "internal",
    auditor: audit?.auditor || "",
    start_date: audit?.start_date || "",
    end_date: audit?.end_date || "",
    scope: audit?.scope || "",
    status: audit?.status || "planned",
  });

  useEffect(() => {
    if (audit) {
      setFormData({
        title: audit.title || "",
        audit_type: audit.audit_type || "internal",
        auditor: audit.auditor || "",
        start_date: audit.start_date || "",
        end_date: audit.end_date || "",
        scope: audit.scope || "",
        status: audit.status || "planned",
      });
    }
  }, [audit]);

  const updateAuditMutation = useMutation({
    mutationFn: async (auditData: any) => {
      const { data, error } = await supabase
        .from('audits')
        .update(auditData)
        .eq('id', audit.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit', audit.id] });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast({
        title: "Auditoria atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar auditoria",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAuditMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Auditoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Auditoria Interna ISO 9001:2015"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audit_type">Tipo de Auditoria *</Label>
              <Select value={formData.audit_type} onValueChange={(value) => setFormData({ ...formData, audit_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interna</SelectItem>
                  <SelectItem value="external">Externa</SelectItem>
                  <SelectItem value="certification">Certificação</SelectItem>
                  <SelectItem value="surveillance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planejada</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auditor">Auditor Responsável</Label>
            <Input
              id="auditor"
              value={formData.auditor}
              onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
              placeholder="Nome do auditor líder"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope">Escopo</Label>
            <Textarea
              id="scope"
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              placeholder="Descreva o escopo da auditoria..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateAuditMutation.isPending}>
              {updateAuditMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
