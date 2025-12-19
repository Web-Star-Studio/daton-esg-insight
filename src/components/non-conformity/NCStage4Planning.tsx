import { useState } from "react";
import { Plus, Trash2, Check, Clock, User, Calendar, GripVertical } from "lucide-react";
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
  useActionPlans, 
  useCreateActionPlan, 
  useUpdateActionPlan, 
  useDeleteActionPlan,
  useCompanyUsers 
} from "@/hooks/useNonConformity";
import { NCActionPlan } from "@/services/nonConformityService";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface NCStage4PlanningProps {
  ncId: string;
  onComplete?: () => void;
}

export function NCStage4Planning({ ncId, onComplete }: NCStage4PlanningProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NCActionPlan | null>(null);
  const [formData, setFormData] = useState({
    what_action: "",
    why_reason: "",
    how_method: "",
    where_location: "",
    who_responsible_id: "",
    when_deadline: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    how_much_cost: "",
  });

  const { data: plans, isLoading } = useActionPlans(ncId);
  const { data: users } = useCompanyUsers();
  const createMutation = useCreateActionPlan();
  const updateMutation = useUpdateActionPlan();
  const deleteMutation = useDeleteActionPlan();

  const resetForm = () => {
    setFormData({
      what_action: "",
      why_reason: "",
      how_method: "",
      where_location: "",
      who_responsible_id: "",
      when_deadline: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      how_much_cost: "",
    });
    setEditingPlan(null);
  };

  const handleSubmit = () => {
    if (!formData.what_action.trim()) {
      toast.error("Descreva o que deve ser feito");
      return;
    }
    if (!formData.when_deadline) {
      toast.error("Defina um prazo");
      return;
    }

    if (editingPlan) {
      updateMutation.mutate({
        id: editingPlan.id,
        updates: {
          what_action: formData.what_action,
          why_reason: formData.why_reason,
          how_method: formData.how_method,
          where_location: formData.where_location,
          who_responsible_id: formData.who_responsible_id || undefined,
          when_deadline: formData.when_deadline,
          how_much_cost: formData.how_much_cost,
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
        what_action: formData.what_action,
        why_reason: formData.why_reason,
        how_method: formData.how_method,
        where_location: formData.where_location,
        who_responsible_id: formData.who_responsible_id || undefined,
        when_deadline: formData.when_deadline,
        how_much_cost: formData.how_much_cost,
        status: "Planejada",
        attachments: [],
        order_index: plans?.length || 0,
      } as any, {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleEdit = (plan: NCActionPlan) => {
    setEditingPlan(plan);
    setFormData({
      what_action: plan.what_action,
      why_reason: plan.why_reason || "",
      how_method: plan.how_method || "",
      where_location: plan.where_location || "",
      who_responsible_id: plan.who_responsible_id || "",
      when_deadline: plan.when_deadline,
      how_much_cost: plan.how_much_cost || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta ação?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluída":
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case "Em Execução":
        return <Badge className="bg-blue-100 text-blue-800">Em Execução</Badge>;
      case "Cancelada":
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Planejada</Badge>;
    }
  };

  const hasPlans = plans && plans.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">4</span>
            Planejamento de Ações (5W2H)
          </CardTitle>
          <CardDescription>
            Defina as ações corretivas e preventivas para eliminar a causa raiz
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Editar Ação" : "Nova Ação (5W2H)"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
              {/* What */}
              <div className="p-4 border rounded-lg bg-blue-50/50">
                <Label htmlFor="what" className="text-blue-800 font-medium">
                  O QUÊ? (What) *
                </Label>
                <Textarea
                  id="what"
                  value={formData.what_action}
                  onChange={(e) => setFormData({ ...formData, what_action: e.target.value })}
                  placeholder="O que deve ser feito para corrigir o problema?"
                  rows={2}
                  className="mt-2"
                />
              </div>

              {/* Why */}
              <div className="p-4 border rounded-lg bg-green-50/50">
                <Label htmlFor="why" className="text-green-800 font-medium">
                  POR QUÊ? (Why)
                </Label>
                <Textarea
                  id="why"
                  value={formData.why_reason}
                  onChange={(e) => setFormData({ ...formData, why_reason: e.target.value })}
                  placeholder="Por que esta ação é necessária?"
                  rows={2}
                  className="mt-2"
                />
              </div>

              {/* How */}
              <div className="p-4 border rounded-lg bg-yellow-50/50">
                <Label htmlFor="how" className="text-yellow-800 font-medium">
                  COMO? (How)
                </Label>
                <Textarea
                  id="how"
                  value={formData.how_method}
                  onChange={(e) => setFormData({ ...formData, how_method: e.target.value })}
                  placeholder="Como a ação será executada?"
                  rows={2}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Where */}
                <div className="p-4 border rounded-lg bg-purple-50/50">
                  <Label htmlFor="where" className="text-purple-800 font-medium">
                    ONDE? (Where)
                  </Label>
                  <Input
                    id="where"
                    value={formData.where_location}
                    onChange={(e) => setFormData({ ...formData, where_location: e.target.value })}
                    placeholder="Local da execução"
                    className="mt-2"
                  />
                </div>

                {/* Who */}
                <div className="p-4 border rounded-lg bg-orange-50/50">
                  <Label htmlFor="who" className="text-orange-800 font-medium">
                    QUEM? (Who)
                  </Label>
                  <Select
                    value={formData.who_responsible_id}
                    onValueChange={(value) => setFormData({ ...formData, who_responsible_id: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Responsável..." />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* When */}
                <div className="p-4 border rounded-lg bg-red-50/50">
                  <Label htmlFor="when" className="text-red-800 font-medium">
                    QUANDO? (When) *
                  </Label>
                  <Input
                    id="when"
                    type="date"
                    value={formData.when_deadline}
                    onChange={(e) => setFormData({ ...formData, when_deadline: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {/* How Much */}
                <div className="p-4 border rounded-lg bg-teal-50/50">
                  <Label htmlFor="howmuch" className="text-teal-800 font-medium">
                    QUANTO? (How Much)
                  </Label>
                  <Input
                    id="howmuch"
                    value={formData.how_much_cost}
                    onChange={(e) => setFormData({ ...formData, how_much_cost: e.target.value })}
                    placeholder="Custo estimado"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingPlan ? "Salvar" : "Adicionar"}
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
        ) : hasPlans ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>O que fazer</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan, index) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="max-w-[250px]">
                    <p className="truncate font-medium">{plan.what_action}</p>
                    {plan.why_reason && (
                      <p className="text-xs text-muted-foreground truncate">
                        Por quê: {plan.why_reason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {plan.responsible?.full_name || "Não definido"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(plan.when_deadline), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(plan.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(plan)}
                      >
                        ✏️
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDelete(plan.id)}
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
            <p>Nenhuma ação planejada.</p>
            <p className="text-sm">Adicione ações corretivas e preventivas usando a metodologia 5W2H.</p>
          </div>
        )}

        {hasPlans && onComplete && (
          <div className="mt-4 pt-4 border-t flex justify-end">
            <Button onClick={onComplete}>
              <Check className="h-4 w-4 mr-2" />
              Concluir Planejamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
