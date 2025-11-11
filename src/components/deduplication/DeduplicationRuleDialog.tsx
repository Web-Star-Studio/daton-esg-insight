import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  createDeduplicationRule,
  updateDeduplicationRule,
  DeduplicationRule,
  AVAILABLE_TABLES,
  MERGE_STRATEGIES,
  TABLE_FIELD_SUGGESTIONS
} from '@/services/deduplication';

interface DeduplicationRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingRule?: DeduplicationRule | null;
}

export function DeduplicationRuleDialog({
  open,
  onClose,
  onSaved,
  editingRule
}: DeduplicationRuleDialogProps) {
  const [ruleName, setRuleName] = useState('');
  const [targetTable, setTargetTable] = useState('');
  const [uniqueFields, setUniqueFields] = useState<string[]>([]);
  const [newField, setNewField] = useState('');
  const [mergeStrategy, setMergeStrategy] = useState<'skip_if_exists' | 'update_existing' | 'merge_fields'>('skip_if_exists');
  const [priority, setPriority] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingRule) {
      setRuleName(editingRule.rule_name);
      setTargetTable(editingRule.target_table);
      setUniqueFields(editingRule.unique_fields);
      setMergeStrategy(editingRule.merge_strategy);
      setPriority(String(editingRule.priority));
    } else {
      resetForm();
    }
  }, [editingRule, open]);

  const resetForm = () => {
    setRuleName('');
    setTargetTable('');
    setUniqueFields([]);
    setNewField('');
    setMergeStrategy('skip_if_exists');
    setPriority('0');
  };

  const handleAddField = () => {
    if (newField && !uniqueFields.includes(newField)) {
      setUniqueFields([...uniqueFields, newField]);
      setNewField('');
    }
  };

  const handleRemoveField = (field: string) => {
    setUniqueFields(uniqueFields.filter(f => f !== field));
  };

  const handleAddSuggestedField = (field: string) => {
    if (!uniqueFields.includes(field)) {
      setUniqueFields([...uniqueFields, field]);
    }
  };

  const handleSave = async () => {
    // Validações
    if (!ruleName.trim()) {
      toast.error('Nome da regra é obrigatório');
      return;
    }

    if (!targetTable) {
      toast.error('Selecione uma tabela');
      return;
    }

    if (uniqueFields.length === 0) {
      toast.error('Adicione pelo menos um campo único');
      return;
    }

    setIsSaving(true);
    try {
      const ruleData = {
        target_table: targetTable,
        rule_name: ruleName,
        unique_fields: uniqueFields,
        merge_strategy: mergeStrategy,
        priority: parseInt(priority) || 0,
      };

      if (editingRule) {
        await updateDeduplicationRule(editingRule.id, ruleData);
        toast.success('Regra atualizada com sucesso!');
      } else {
        await createDeduplicationRule(ruleData);
        toast.success('Regra criada com sucesso!');
      }

      onSaved();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Erro ao salvar regra');
    } finally {
      setIsSaving(false);
    }
  };

  const suggestedFields = targetTable ? TABLE_FIELD_SUGGESTIONS[targetTable] || [] : [];
  const selectedStrategy = MERGE_STRATEGIES.find(s => s.value === mergeStrategy);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingRule ? 'Editar Regra de Deduplicação' : 'Nova Regra de Deduplicação'}
          </DialogTitle>
          <DialogDescription>
            Configure os campos que devem ser únicos para evitar inserções duplicadas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome da Regra */}
          <div className="space-y-2">
            <Label htmlFor="ruleName">Nome da Regra</Label>
            <Input
              id="ruleName"
              placeholder="Ex: Funcionário por CPF"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </div>

          {/* Tabela Alvo */}
          <div className="space-y-2">
            <Label htmlFor="targetTable">Tabela Alvo</Label>
            <Select value={targetTable} onValueChange={setTargetTable} disabled={!!editingRule}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma tabela" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TABLES.map((table) => (
                  <SelectItem key={table.value} value={table.value}>
                    {table.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campos Únicos */}
          <div className="space-y-2">
            <Label>Campos Únicos</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do campo (ex: cpf)"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddField()}
              />
              <Button type="button" onClick={handleAddField} variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {uniqueFields.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {uniqueFields.map((field) => (
                  <Badge key={field} variant="secondary" className="pl-3 pr-1">
                    {field}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-1 ml-1"
                      onClick={() => handleRemoveField(field)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {suggestedFields.length > 0 && (
              <Alert className="mt-2">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p className="text-sm mb-2">Sugestões de campos para esta tabela:</p>
                  <div className="flex flex-wrap gap-1">
                    {suggestedFields
                      .filter(field => !uniqueFields.includes(field))
                      .map((field) => (
                        <Badge
                          key={field}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => handleAddSuggestedField(field)}
                        >
                          + {field}
                        </Badge>
                      ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Estratégia de Mesclagem */}
          <div className="space-y-2">
            <Label htmlFor="mergeStrategy">Estratégia de Mesclagem</Label>
            <Select value={mergeStrategy} onValueChange={(v: any) => setMergeStrategy(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MERGE_STRATEGIES.map((strategy) => (
                  <SelectItem key={strategy.value} value={strategy.value}>
                    <div>
                      <div className="font-medium">{strategy.label}</div>
                      <div className="text-xs text-muted-foreground">{strategy.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStrategy && (
              <p className="text-sm text-muted-foreground">{selectedStrategy.description}</p>
            )}
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Input
              id="priority"
              type="number"
              min="0"
              placeholder="0"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Menor valor = maior prioridade (quando múltiplas regras existem)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : editingRule ? 'Atualizar' : 'Criar Regra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
