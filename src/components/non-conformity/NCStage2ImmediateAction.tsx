import { useState } from "react";
import { Plus, Trash2, Check, Clock, AlertTriangle, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  useImmediateActions, 
  useCreateImmediateAction, 
  useUpdateImmediateAction, 
  useDeleteImmediateAction,
  useCompanyUsers 
} from "@/hooks/useNonConformity";
import { NCImmediateAction } from "@/services/nonConformityService";
import { format, isPast, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface NCStage2ImmediateActionProps {
  ncId: string;
  onComplete?: () => void;
}

export function NCStage2ImmediateAction({ ncId, onComplete }: NCStage2ImmediateActionProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<NCImmediateAction | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    responsible_user_id: "",
    due_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    evidence: "",
  });

  const { data: actions, isLoading } = useImmediateActions(ncId);
  const { data: users } = useCompanyUsers();
  const createMutation = useCreateImmediateAction();
  const updateMutation = useUpdateImmediateAction();
  const deleteMutation = useDeleteImmediateAction();

  const resetForm = () => {
    setFormData({
      description: "",
      responsible_user_id: "",
      due_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      evidence: "",
    });
    setEditingAction(null);
  };

  const handleSubmit = () => {
    if (!formData.description.trim()) {
      toast.error("Descreva a ação imediata");
      return;
    }
    if (!formData.due_date) {
      toast.error("Defina um prazo");
      return;
    }

    if (editingAction) {
      updateMutation.mutate({
        id: editingAction.id,
        updates: {
          description: formData.description,
          responsible_user_id: formData.responsible_user_id || undefined,
          due_date: formData.due_date,
          evidence: formData.evidence,
        },
      }, {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          resetForm();
        },
      });
    } else {
      createMutation.mutate({
        non_conformity_id: ncId,
        description: formData.description,
        responsible_user_id: formData.responsible_user_id || undefined,
        due_date: formData.due_date,
        evidence: formData.evidence,
        attachments: [],
        status: "Pendente",
      } as any, {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleEdit = (action: NCImmediateAction) => {
    setEditingAction(action);
    setFormData({
      description: action.description,
      responsible_user_id: action.responsible_user_id || "",
      due_date: action.due_date,
      evidence: action.evidence || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleComplete = (action: NCImmediateAction) => {
    updateMutation.mutate({
      id: action.id,
      updates: {
        status: "Concluída",
        completion_date: format(new Date(), "yyyy-MM-dd"),
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta ação?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (action: NCImmediateAction) => {
    const dueDate = new Date(action.due_date);
    
    if (action.status === "Concluída") {
      return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Concluída</Badge>;
    }
    if (isPast(dueDate) && !isToday(dueDate)) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Atrasada</Badge>;
    }
    if (isToday(dueDate)) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Vence Hoje</Badge>;
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pendente</Badge>;
  };

  const allActionsCompleted = actions?.every(a => a.status === "Concluída") && (actions?.length || 0) > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</span>
            Ações Imediatas
          </CardTitle>
          <CardDescription>
            Defina ações de contenção para minimizar o impacto da não conformidade
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Ação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAction ? "Editar Ação Imediata" : "Nova Ação Imediata"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="description">O que deve ser feito? *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a ação de contenção..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsible">Responsável</Label>
                  <Select
                    value={formData.responsible_user_id}
                    onValueChange={(value) => setFormData({ ...formData, responsible_user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
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
                
                <div>
                  <Label htmlFor="due_date">Prazo *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="evidence">Evidência</Label>
                <Textarea
                  id="evidence"
                  value={formData.evidence}
                  onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                  placeholder="Descreva as evidências de conclusão..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingAction ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : actions && actions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ação</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell className="max-w-[300px]">
                    <p className="truncate">{action.description}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {action.responsible?.full_name || "Não definido"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(action.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(action)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {action.status !== "Concluída" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600"
                            onClick={() => handleComplete(action)}
                            title="Marcar como concluída"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(action)}
                          >
                            ✏️
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDelete(action.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma ação imediata registrada.</p>
            <p className="text-sm">Adicione ações para conter o problema.</p>
          </div>
        )}

        {allActionsCompleted && onComplete && (
          <div className="mt-4 pt-4 border-t flex justify-end">
            <Button onClick={onComplete}>
              <Check className="h-4 w-4 mr-2" />
              Concluir Etapa e Avançar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
