import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, Plus, Trash2, Edit, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDeduplicationRules,
  deleteDeduplicationRule,
  toggleRuleEnabled,
  DeduplicationRule,
  MERGE_STRATEGIES
} from '@/services/deduplication';
import { DeduplicationRuleDialog } from './DeduplicationRuleDialog';

export function DeduplicationRulesManager() {
  const [rules, setRules] = useState<DeduplicationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DeduplicationRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await getDeduplicationRules();
      setRules(data);
    } catch (error) {
      console.error('Error loading rules:', error);
      toast.error('Erro ao carregar regras de deduplicação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (ruleId: string, enabled: boolean) => {
    try {
      await toggleRuleEnabled(ruleId, enabled);
      setRules(rules.map(r => r.id === ruleId ? { ...r, enabled } : r));
      toast.success(`Regra ${enabled ? 'ativada' : 'desativada'} com sucesso`);
    } catch (error) {
      toast.error('Erro ao atualizar regra');
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await deleteDeduplicationRule(ruleId);
      setRules(rules.filter(r => r.id !== ruleId));
      toast.success('Regra deletada com sucesso');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Erro ao deletar regra');
    }
  };

  const handleEdit = (rule: DeduplicationRule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
  };

  const handleRuleSaved = () => {
    loadRules();
    handleCloseDialog();
  };

  const getMergeStrategyLabel = (strategy: string) => {
    return MERGE_STRATEGIES.find(s => s.value === strategy)?.label || strategy;
  };

  const groupedRules = rules.reduce((acc, rule) => {
    if (!acc[rule.target_table]) {
      acc[rule.target_table] = [];
    }
    acc[rule.target_table].push(rule);
    return acc;
  }, {} as Record<string, DeduplicationRule[]>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Regras de Deduplicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Regras de Deduplicação
              </CardTitle>
              <CardDescription className="mt-2">
                Configure campos únicos para evitar registros duplicados ao processar documentos
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              As regras de deduplicação são aplicadas automaticamente durante o processamento de documentos 
              para evitar inserções duplicadas. Configure os campos que devem ser únicos para cada tabela.
            </AlertDescription>
          </Alert>

          {Object.keys(groupedRules).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma regra configurada</p>
              <p className="text-sm mt-2">Clique em "Nova Regra" para começar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedRules).map(([tableName, tableRules]) => (
                <div key={tableName} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Badge variant="outline">{tableName}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {tableRules.length} {tableRules.length === 1 ? 'regra' : 'regras'}
                    </span>
                  </h3>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome da Regra</TableHead>
                        <TableHead>Campos Únicos</TableHead>
                        <TableHead>Estratégia</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-medium">{rule.rule_name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {rule.unique_fields.map((field) => (
                                <Badge key={field} variant="secondary" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getMergeStrategyLabel(rule.merge_strategy)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{rule.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={(checked) => handleToggleEnabled(rule.id, checked)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(rule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(rule.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeduplicationRuleDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        onSaved={handleRuleSaved}
        editingRule={editingRule}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta regra? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
