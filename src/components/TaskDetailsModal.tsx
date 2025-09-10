import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, User, Clock, FileText, ExternalLink, Edit, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { complianceService, type ComplianceTask } from "@/services/compliance";
import { toast } from "@/hooks/use-toast";

interface TaskDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ComplianceTask | null;
}

export function TaskDetailsModal({ open, onOpenChange, task }: TaskDetailsModalProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTask = useMutation({
    mutationFn: (data: { id: string; updateData: any }) => 
      complianceService.updateTask(data.id, data.updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-stats'] });
      toast({
        title: "Tarefa atualizada",
        description: "As informações da tarefa foram atualizadas com sucesso.",
      });
      setNotes("");
      setStatus("");
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateStatus = async () => {
    if (!task || (!status && !notes)) return;
    
    setIsUpdating(true);
    try {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (notes) updateData.notes = notes;
      
      await updateTask.mutateAsync({ id: task.id, updateData });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Concluído</Badge>;
      case 'Em Andamento':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Em Andamento</Badge>;
      case 'Em Atraso':
        return <Badge variant="destructive">Em Atraso</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {task.title}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da tarefa de compliance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center justify-between">
            {getStatusBadge(task.status)}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Criada em {format(new Date(task.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <Label className="text-sm font-medium">Descrição</Label>
              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Data de Vencimento
              </Label>
              <p className="text-sm mt-1">
                {format(new Date(task.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Frequência</Label>
              <p className="text-sm mt-1">{task.frequency}</p>
            </div>

            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                <User className="h-4 w-4" />
                Responsável
              </Label>
              <p className="text-sm mt-1">
                {task.responsible?.full_name || "Não atribuído"}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Evidência</Label>
              <p className="text-sm mt-1">
                {task.evidence_document_id ? "Documento anexado" : "Nenhuma evidência"}
              </p>
            </div>
          </div>

          {/* Regulatory Requirement */}
          {task.requirement && (
            <div>
              <Label className="text-sm font-medium">Requisito Regulatório Associado</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    {task.requirement.reference_code && (
                      <p className="text-sm font-medium">{task.requirement.reference_code}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{task.requirement.title}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Current Notes */}
          {task.notes && (
            <div>
              <Label className="text-sm font-medium">Notas Atuais</Label>
              <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-lg">
                {task.notes}
              </p>
            </div>
          )}

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Ações Rápidas</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Atualizar Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecionar novo status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={(!status && !notes) || isUpdating}
                  className="w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isUpdating ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Adicionar Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre o progresso ou atualizações da tarefa..."
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}