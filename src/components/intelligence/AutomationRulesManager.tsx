import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Zap, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  rule_name: string;
  description: string | null;
  action_type: string;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
}

export function AutomationRulesManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const queryClient = useQueryClient();

  // Form state
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState('create_task');
  const [triggerField, setTriggerField] = useState('');
  const [triggerOperator, setTriggerOperator] = useState('equals');
  const [triggerValue, setTriggerValue] = useState('');

  const { data: rules, isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AutomationRule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user?.id)
        .single();

      const { error } = await supabase.from('automation_rules').insert({
        company_id: profile?.company_id,
        rule_name: ruleData.rule_name,
        description: ruleData.description,
        action_type: ruleData.action_type,
        trigger_condition: {
          field: ruleData.trigger_field,
          operator: ruleData.trigger_operator,
          value: ruleData.trigger_value,
        },
        action_parameters: ruleData.action_parameters || {},
        created_by_user_id: userData.user?.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Regra de automação criada com sucesso');
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error creating rule:', error);
      toast.error('Erro ao criar regra de automação');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('automation_rules')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Status da regra atualizado');
    },
    onError: (error) => {
      console.error('Error toggling rule:', error);
      toast.error('Erro ao atualizar status da regra');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Regra excluída com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting rule:', error);
      toast.error('Erro ao excluir regra');
    },
  });

  const resetForm = () => {
    setRuleName('');
    setDescription('');
    setActionType('create_task');
    setTriggerField('');
    setTriggerOperator('equals');
    setTriggerValue('');
    setEditingRule(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate({
      rule_name: ruleName,
      description: description || null,
      action_type: actionType,
      trigger_field: triggerField,
      trigger_operator: triggerOperator,
      trigger_value: triggerValue,
      action_parameters: {},
    });
  };

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      create_task: 'Criar Tarefa',
      notify: 'Enviar Notificação',
      auto_insert: 'Inserir Automaticamente',
      create_alert: 'Criar Alerta',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando regras de automação...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Regras de Automação</h3>
          <p className="text-sm text-muted-foreground">
            Configure ações automáticas baseadas em dados extraídos
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Editar Regra' : 'Nova Regra de Automação'}
              </DialogTitle>
              <DialogDescription>
                Configure uma regra para automatizar ações baseadas em dados extraídos de documentos
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Nome da Regra</Label>
                <Input
                  id="ruleName"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Ex: Criar tarefa para licenças vencendo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que esta regra faz..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="triggerField">Campo de Ativação</Label>
                  <Input
                    id="triggerField"
                    value={triggerField}
                    onChange={(e) => setTriggerField(e.target.value)}
                    placeholder="Ex: expire_date"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="triggerOperator">Operador</Label>
                  <Select value={triggerOperator} onValueChange={setTriggerOperator}>
                    <SelectTrigger id="triggerOperator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Igual a</SelectItem>
                      <SelectItem value="greater_than">Maior que</SelectItem>
                      <SelectItem value="less_than">Menor que</SelectItem>
                      <SelectItem value="contains">Contém</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="triggerValue">Valor</Label>
                  <Input
                    id="triggerValue"
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                    placeholder="Ex: 30 dias"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionType">Ação a Executar</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger id="actionType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create_task">Criar Tarefa</SelectItem>
                    <SelectItem value="notify">Enviar Notificação</SelectItem>
                    <SelectItem value="auto_insert">Inserir Automaticamente</SelectItem>
                    <SelectItem value="create_alert">Criar Alerta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Criar Regra
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!rules || rules.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma regra configurada</p>
            <p className="text-sm mt-2">
              Crie regras para automatizar ações quando dados específicos forem extraídos
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{rule.rule_name}</h4>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Badge variant="outline">{getActionTypeLabel(rule.action_type)}</Badge>
                  </div>

                  {rule.description && (
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Executada {rule.execution_count} vezes</span>
                    {rule.last_executed_at && (
                      <span>
                        Última execução:{' '}
                        {new Date(rule.last_executed_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={(checked) =>
                      toggleMutation.mutate({ id: rule.id, is_active: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
