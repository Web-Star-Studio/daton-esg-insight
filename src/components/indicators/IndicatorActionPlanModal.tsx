import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExtendedQualityIndicator, IndicatorPeriodData } from "@/services/indicatorManagement";

interface IndicatorActionPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  indicator: ExtendedQualityIndicator;
  criticalPeriods: IndicatorPeriodData[];
}

interface ActionItem {
  what_action: string;
  why_reason: string;
  who_responsible_user_id: string;
  where_location: string;
  when_deadline: Date | undefined;
  how_method: string;
  how_much_cost: number | undefined;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function IndicatorActionPlanModal({ open, onOpenChange, indicator, criticalPeriods }: IndicatorActionPlanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState(`Plano de Ação - ${indicator.name}`);
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState(`Atingir a meta de ${indicator.target_value} ${indicator.unit}`);
  const [actions, setActions] = useState<ActionItem[]>([{
    what_action: '',
    why_reason: `Indicador fora da meta em ${criticalPeriods.length} período(s)`,
    who_responsible_user_id: '',
    where_location: indicator.location || '',
    when_deadline: undefined,
    how_method: '',
    how_much_cost: undefined
  }]);

  // Fetch users for responsible selection
  const { data: users } = useQuery({
    queryKey: ['company-users'],
    queryFn: async () => {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) return [];

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', profile.user.id)
        .single();

      if (!userProfile?.company_id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', userProfile.company_id);

      if (error) throw error;
      return data || [];
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      // Create action plan
      const { data: plan, error: planError } = await supabase
        .from('action_plans')
        .insert({
          company_id: profile.company_id,
          created_by_user_id: user.id,
          title,
          description,
          objective,
          plan_type: 'indicator_improvement',
          status: 'Em Andamento'
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create action items
      const validActions = actions.filter(a => a.what_action.trim());
      if (validActions.length > 0) {
        const { error: itemsError } = await supabase
          .from('action_plan_items')
          .insert(validActions.map(action => ({
            action_plan_id: plan.id,
            what_action: action.what_action,
            why_reason: action.why_reason,
            who_responsible_user_id: action.who_responsible_user_id || null,
            where_location: action.where_location,
            when_deadline: action.when_deadline?.toISOString().split('T')[0],
            how_method: action.how_method,
            how_much_cost: action.how_much_cost,
            status: 'Pendente',
            progress_percentage: 0
          })));

        if (itemsError) throw itemsError;
      }

      // Link to critical periods
      for (const period of criticalPeriods) {
        await supabase
          .from('indicator_period_data')
          .update({ action_plan_id: plan.id, needs_action_plan: true })
          .eq('id', period.id);
      }

      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicator-detail'] });
      queryClient.invalidateQueries({ queryKey: ['indicators-with-data'] });
      toast({ title: "Sucesso", description: "Plano de ação criado com sucesso" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setTitle(`Plano de Ação - ${indicator.name}`);
    setDescription('');
    setObjective(`Atingir a meta de ${indicator.target_value} ${indicator.unit}`);
    setActions([{
      what_action: '',
      why_reason: `Indicador fora da meta em ${criticalPeriods.length} período(s)`,
      who_responsible_user_id: '',
      where_location: indicator.location || '',
      when_deadline: undefined,
      how_method: '',
      how_much_cost: undefined
    }]);
  };

  const addAction = () => {
    setActions([...actions, {
      what_action: '',
      why_reason: '',
      who_responsible_user_id: '',
      where_location: indicator.location || '',
      when_deadline: undefined,
      how_method: '',
      how_much_cost: undefined
    }]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof ActionItem, value: any) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Plano de Ação - 5W2H</DialogTitle>
          <DialogDescription>
            Crie um plano de ação para tratar os períodos críticos do indicador
          </DialogDescription>
        </DialogHeader>

        {/* Critical Periods Summary */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm font-medium text-destructive mb-2">Períodos Críticos:</p>
          <div className="flex flex-wrap gap-2">
            {criticalPeriods.map((period) => (
              <Badge key={period.id} variant="destructive">
                {MONTHS[period.month - 1]}/{period.year} - {period.measured_value} {indicator.unit}
              </Badge>
            ))}
          </div>
        </div>

        {/* Plan Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título do Plano</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do plano de ação"
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Input 
                value={objective} 
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Objetivo principal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição detalhada do plano"
              rows={2}
            />
          </div>
        </div>

        {/* Action Items (5W2H) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg">Ações (5W2H)</Label>
            <Button variant="outline" size="sm" onClick={addAction}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar Ação
            </Button>
          </div>

          {actions.map((action, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Ação {index + 1}</span>
                {actions.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeAction(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* What */}
                <div className="space-y-2 md:col-span-2">
                  <Label>O quê? (What) *</Label>
                  <Input
                    value={action.what_action}
                    onChange={(e) => updateAction(index, 'what_action', e.target.value)}
                    placeholder="Qual ação será realizada?"
                  />
                </div>

                {/* Why */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Por quê? (Why)</Label>
                  <Input
                    value={action.why_reason}
                    onChange={(e) => updateAction(index, 'why_reason', e.target.value)}
                    placeholder="Por que esta ação é necessária?"
                  />
                </div>

                {/* Who */}
                <div className="space-y-2">
                  <Label>Quem? (Who)</Label>
                  <Select 
                    value={action.who_responsible_user_id} 
                    onValueChange={(value) => updateAction(index, 'who_responsible_user_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
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

                {/* Where */}
                <div className="space-y-2">
                  <Label>Onde? (Where)</Label>
                  <Input
                    value={action.where_location}
                    onChange={(e) => updateAction(index, 'where_location', e.target.value)}
                    placeholder="Local de execução"
                  />
                </div>

                {/* When */}
                <div className="space-y-2">
                  <Label>Quando? (When)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {action.when_deadline ? format(action.when_deadline, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={action.when_deadline}
                        onSelect={(date) => updateAction(index, 'when_deadline', date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* How Much */}
                <div className="space-y-2">
                  <Label>Quanto? (How Much)</Label>
                  <Input
                    type="number"
                    value={action.how_much_cost || ''}
                    onChange={(e) => updateAction(index, 'how_much_cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Custo estimado (R$)"
                  />
                </div>

                {/* How */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Como? (How)</Label>
                  <Textarea
                    value={action.how_method}
                    onChange={(e) => updateAction(index, 'how_method', e.target.value)}
                    placeholder="Como a ação será executada?"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => createPlanMutation.mutate()}
            disabled={createPlanMutation.isPending || !actions.some(a => a.what_action.trim())}
          >
            {createPlanMutation.isPending ? 'Criando...' : 'Criar Plano de Ação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
