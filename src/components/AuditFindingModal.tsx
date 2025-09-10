import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auditService, type CreateFindingData, type UpdateFindingData, type AuditFinding } from "@/services/audit";
import { supabase } from "@/integrations/supabase/client";

interface AuditFindingModalProps {
  auditId: string;
  finding?: AuditFinding | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuditFindingModal({ auditId, finding, isOpen, onClose, onSuccess }: AuditFindingModalProps) {
  const { toast } = useToast();
  const isEditing = !!finding;
  
  const [formData, setFormData] = useState<CreateFindingData & UpdateFindingData>({
    description: "",
    severity: "",
    status: "Aberta",
    responsible_user_id: "",
    due_date: "",
    action_plan: ""
  });

  // Get company users for responsible assignment
  const { data: users } = useQuery({
    queryKey: ['company-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFindingData) => auditService.createAuditFinding(auditId, data),
    onSuccess: () => {
      toast({
        title: "Achado criado com sucesso",
        description: "O novo achado foi adicionado à auditoria."
      });
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar achado",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateFindingData) => 
      auditService.updateAuditFinding(finding!.id, data),
    onSuccess: () => {
      toast({
        title: "Achado atualizado com sucesso",
        description: "As alterações foram salvas."
      });
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar achado",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (finding) {
      setFormData({
        description: finding.description,
        severity: finding.severity,
        status: finding.status,
        responsible_user_id: finding.responsible_user_id || "",
        due_date: finding.due_date || "",
        action_plan: finding.action_plan || ""
      });
    } else {
      resetForm();
    }
  }, [finding]);

  const resetForm = () => {
    setFormData({
      description: "",
      severity: "",
      status: "Aberta",
      responsible_user_id: "",
      due_date: "",
      action_plan: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.severity) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a descrição e severidade do achado.",
        variant: "destructive"
      });
      return;
    }

    const submitData = {
      ...formData,
      responsible_user_id: formData.responsible_user_id === "none" ? undefined : formData.responsible_user_id,
      due_date: formData.due_date || undefined,
      action_plan: formData.action_plan || undefined
    };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
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
            {isEditing ? "Editar Achado" : "Novo Achado de Auditoria"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do achado de auditoria."
              : "Registre uma nova não-conformidade ou oportunidade de melhoria."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição do Achado *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva detalhadamente o achado da auditoria..."
              rows={3}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="severity">Severidade *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                  <SelectItem value="Maior">Maior</SelectItem>
                  <SelectItem value="Menor">Menor</SelectItem>
                  <SelectItem value="Oportunidade">Oportunidade</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="Aberta">Aberta</SelectItem>
                  <SelectItem value="Em Tratamento">Em Tratamento</SelectItem>
                  <SelectItem value="Resolvida">Resolvida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="responsible_user_id">Responsável</Label>
              <Select
                value={formData.responsible_user_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum responsável</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="due_date">Prazo para Resolução</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="action_plan">Plano de Ação</Label>
            <Textarea
              id="action_plan"
              value={formData.action_plan}
              onChange={(e) => setFormData(prev => ({ ...prev, action_plan: e.target.value }))}
              placeholder="Descreva as ações que serão tomadas para resolver este achado..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? (isEditing ? "Atualizando..." : "Criando...") 
                : (isEditing ? "Atualizar Achado" : "Criar Achado")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}