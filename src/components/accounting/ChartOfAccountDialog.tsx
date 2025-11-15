import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chartOfAccountsService, ChartOfAccount } from '@/services/chartOfAccounts';
import { unifiedToast } from '@/utils/unifiedToast';

interface ChartOfAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: ChartOfAccount;
  parentAccounts?: ChartOfAccount[];
}

export function ChartOfAccountDialog({ open, onOpenChange, account, parentAccounts = [] }: ChartOfAccountDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: 'Ativo',
    account_nature: 'Devedora',
    parent_account_id: '',
    level: 1,
    is_analytical: true,
    accepts_cost_center: true,
    accepts_project: true,
    status: 'Ativa',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        account_nature: account.account_nature,
        parent_account_id: account.parent_account_id || '',
        level: account.level,
        is_analytical: account.is_analytical,
        accepts_cost_center: account.accepts_cost_center,
        accepts_project: account.accepts_project,
        status: account.status,
      });
    } else {
      setFormData({
        account_code: '',
        account_name: '',
        account_type: 'Ativo',
        account_nature: 'Devedora',
        parent_account_id: '',
        level: 1,
        is_analytical: true,
        accepts_cost_center: true,
        accepts_project: true,
        status: 'Ativa',
      });
    }
  }, [account, open]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => chartOfAccountsService.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      unifiedToast.success('Conta criada com sucesso');
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => chartOfAccountsService.updateAccount(account!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      unifiedToast.success('Conta atualizada com sucesso');
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_code || !formData.account_name) {
      unifiedToast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (account) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{account ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_code">Código *</Label>
              <Input
                id="account_code"
                value={formData.account_code}
                onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                placeholder="1.1.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">Tipo *</Label>
              <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Passivo">Passivo</SelectItem>
                  <SelectItem value="Patrimônio Líquido">Patrimônio Líquido</SelectItem>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                  <SelectItem value="Custos">Custos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name">Nome da Conta *</Label>
            <Input
              id="account_name"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              placeholder="Caixa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_account_id">Conta Superior</Label>
            <Select value={formData.parent_account_id} onValueChange={(value) => setFormData({ ...formData, parent_account_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhuma (conta raiz)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma (conta raiz)</SelectItem>
                {parentAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.account_code} - {acc.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_nature">Natureza *</Label>
            <Select value={formData.account_nature} onValueChange={(value) => setFormData({ ...formData, account_nature: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Devedora">Devedora</SelectItem>
                <SelectItem value="Credora">Credora</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_analytical"
                checked={formData.is_analytical}
                onCheckedChange={(checked) => setFormData({ ...formData, is_analytical: checked })}
              />
              <Label htmlFor="is_analytical">Analítica</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="accepts_cost_center"
                checked={formData.accepts_cost_center}
                onCheckedChange={(checked) => setFormData({ ...formData, accepts_cost_center: checked })}
              />
              <Label htmlFor="accepts_cost_center">Centro de Custo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="accepts_project"
                checked={formData.accepts_project}
                onCheckedChange={(checked) => setFormData({ ...formData, accepts_project: checked })}
              />
              <Label htmlFor="accepts_project">Projeto</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {account ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
