import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auditService, type CreateAuditData } from "@/services/audit";

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuditModal({ isOpen, onClose, onSuccess }: AuditModalProps) {
  const { toast } = useToast();
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
      toast({
        title: "Auditoria criada com sucesso",
        description: `A auditoria "${data.title}" foi adicionada ao sistema.`
      });
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar auditoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTitle = formData.title.trim();
    const trimmedAuditor = formData.auditor.trim();
    const trimmedScope = formData.scope.trim();
    
    if (!trimmedTitle || !formData.audit_type) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e tipo da auditoria.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedTitle.length > 255) {
      toast({
        title: "Título muito longo",
        description: "O título deve ter no máximo 255 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      toast({
        title: "Datas inválidas",
        description: "A data de início deve ser anterior à data de término.",
        variant: "destructive"
      });
      return;
    }
    
    const sanitizedData = {
      ...formData,
      title: trimmedTitle,
      auditor: trimmedAuditor,
      scope: trimmedScope
    };
    
    createMutation.mutate(sanitizedData);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Planejar Nova Auditoria</DialogTitle>
          <DialogDescription>
            Crie uma nova auditoria para acompanhar achados e planos de ação.
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Auditoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}