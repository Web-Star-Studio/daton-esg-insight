import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { unifiedToast } from "@/utils/unifiedToast";
import { auditService, type CreateAuditData, type Audit } from "@/services/audit";

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  audit?: Audit;
}

export function AuditModal({ isOpen, onClose, onSuccess, audit }: AuditModalProps) {
  
  const [formData, setFormData] = useState<CreateAuditData>({
    title: "",
    audit_type: "",
    auditor: "",
    start_date: "",
    end_date: "",
    scope: "",
    status: "Planejada"
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAuditData) => auditService.createAudit(data),
    onSuccess: (data) => {
      unifiedToast.success("Auditoria criada com sucesso", {
        description: `A auditoria "${data.title}" foi adicionada ao sistema.`
      });
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      unifiedToast.error("Erro ao criar auditoria", {
        description: error.message || "Ocorreu um erro inesperado."
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateAuditData & { id: string }) => 
      auditService.updateAudit(data.id, data),
    onSuccess: (data) => {
      unifiedToast.success("Auditoria atualizada com sucesso", {
        description: `A auditoria "${data.title}" foi atualizada.`
      });
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      unifiedToast.error("Erro ao atualizar auditoria", {
        description: error.message || "Ocorreu um erro inesperado."
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      audit_type: "",
      auditor: "",
      start_date: "",
      end_date: "",
      scope: "",
      status: "Planejada"
    });
  };

  // Atualizar formData quando audit mudar
  useEffect(() => {
    if (audit) {
      setFormData({
        title: audit.title || '',
        audit_type: audit.audit_type || '',
        auditor: audit.auditor || '',
        start_date: audit.start_date 
          ? new Date(audit.start_date).toISOString().split('T')[0]
          : '',
        end_date: audit.end_date
          ? new Date(audit.end_date).toISOString().split('T')[0]
          : '',
        scope: audit.scope || '',
        status: audit.status || 'Planejada',
      });
    } else {
      resetForm();
    }
  }, [audit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTitle = formData.title.trim();
    const trimmedAuditor = formData.auditor.trim();
    const trimmedScope = formData.scope.trim();
    
    if (!trimmedTitle || !formData.audit_type) {
      unifiedToast.error("Campos obrigatórios", {
        description: "Preencha o título e tipo da auditoria."
      });
      return;
    }

    if (trimmedTitle.length > 255) {
      unifiedToast.error("Título muito longo", {
        description: "O título deve ter no máximo 255 caracteres."
      });
      return;
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      unifiedToast.error("Datas inválidas", {
        description: "A data de início deve ser anterior à data de término."
      });
      return;
    }
    
    const sanitizedData = {
      ...formData,
      title: trimmedTitle,
      auditor: trimmedAuditor,
      scope: trimmedScope
    };
    
    if (audit?.id) {
      updateMutation.mutate({ ...sanitizedData, id: audit.id });
    } else {
      createMutation.mutate(sanitizedData);
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {audit ? 'Editar Auditoria' : 'Planejar Nova Auditoria'}
          </DialogTitle>
          <DialogDescription>
            {audit 
              ? 'Atualize as informações da auditoria.'
              : 'Crie uma nova auditoria para acompanhar achados e planos de ação.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Título da Auditoria *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Auditoria Interna Q1 2025"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="audit_type">Tipo de Auditoria *</Label>
              <Select
                value={formData.audit_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, audit_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interna">Interna</SelectItem>
                  <SelectItem value="Externa">Externa</SelectItem>
                  <SelectItem value="Certificação">Certificação</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="auditor">Auditor Responsável</Label>
              <Input
                id="auditor"
                value={formData.auditor}
                onChange={(e) => setFormData(prev => ({ ...prev, auditor: e.target.value }))}
                placeholder="Nome do auditor"
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planejada">Planejada</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="scope">Escopo da Auditoria</Label>
            <Textarea
              id="scope"
              value={formData.scope}
              onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
              placeholder="Descreva o escopo e áreas que serão auditadas..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? (audit ? "Atualizando..." : "Criando...")
                : (audit ? "Atualizar Auditoria" : "Criar Auditoria")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}