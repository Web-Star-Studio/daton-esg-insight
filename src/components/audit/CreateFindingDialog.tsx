import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CreateFindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditId: string;
}

export function CreateFindingDialog({ open, onOpenChange, auditId }: CreateFindingDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    description: "",
    severity: "minor",
    status: "open",
    clause_reference: "",
    corrective_action: "",
    responsible_user_id: "",
    due_date: "",
  });

  const { data: users } = useQuery({
    queryKey: ['company-users'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .single();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profile?.company_id);
      
      if (error) throw error;
      return data || [];
    },
  });

  const createFindingMutation = useMutation({
    mutationFn: async (findingData: any) => {
      const { data, error } = await supabase
        .from('audit_findings')
        .insert({
          audit_id: auditId,
          ...findingData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-findings', auditId] });
      toast({
        title: "Achado criado",
        description: "O achado foi registrado com sucesso.",
      });
      onOpenChange(false);
      setFormData({
        description: "",
        severity: "minor",
        status: "open",
        clause_reference: "",
        corrective_action: "",
        responsible_user_id: "",
        due_date: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar achado",
        description: error instanceof Error ? error.message : "Ocorreu um erro",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createFindingMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Achado de Auditoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o achado identificado..."
              required
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severidade *</Label>
              <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="observation">Observação</SelectItem>
                  <SelectItem value="minor">Menor</SelectItem>
                  <SelectItem value="major">Maior</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
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
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clause_reference">Cláusula/Requisito ISO</Label>
            <Input
              id="clause_reference"
              value={formData.clause_reference}
              onChange={(e) => setFormData({ ...formData, clause_reference: e.target.value })}
              placeholder="Ex: 8.5.1 - Controle de produção"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="corrective_action">Ação Corretiva</Label>
            <Textarea
              id="corrective_action"
              value={formData.corrective_action}
              onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
              placeholder="Descreva as ações corretivas propostas..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável</Label>
              <Select value={formData.responsible_user_id} onValueChange={(value) => setFormData({ ...formData, responsible_user_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createFindingMutation.isPending}>
              {createFindingMutation.isPending ? "Criando..." : "Criar Achado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
