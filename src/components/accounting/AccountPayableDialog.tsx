import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsPayableService, AccountPayable } from '@/services/accountsPayable';
import { unifiedToast } from '@/utils/unifiedToast';

interface AccountPayableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payable?: AccountPayable;
}

export function AccountPayableDialog({ open, onOpenChange, payable }: AccountPayableDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    supplier_name: '',
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    original_amount: 0,
    category: 'Fornecedores',
    notes: '',
  });

  useEffect(() => {
    if (payable) {
      setFormData({
        supplier_name: payable.supplier_name || '',
        invoice_number: payable.invoice_number,
        invoice_date: payable.invoice_date,
        due_date: payable.due_date,
        original_amount: payable.original_amount,
        category: payable.category,
        notes: payable.notes || '',
      });
    } else {
      setFormData({
        supplier_name: '',
        invoice_number: '',
        invoice_date: '',
        due_date: '',
        original_amount: 0,
        category: 'Fornecedores',
        notes: '',
      });
    }
  }, [payable, open]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => accountsPayableService.createPayable({
      ...data,
      status: 'Pendente',
      approval_status: 'Pendente',
      paid_amount: 0,
      discount_amount: 0,
      interest_amount: 0,
      fine_amount: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      unifiedToast.success('Conta a pagar criada com sucesso');
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => accountsPayableService.updatePayable(payable!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      unifiedToast.success('Conta a pagar atualizada com sucesso');
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_name || !formData.invoice_number || !formData.original_amount) {
      unifiedToast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (payable) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{payable ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier_name">Fornecedor *</Label>
            <Input
              id="supplier_name"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              placeholder="Nome do fornecedor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Número da Nota *</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="NF-000123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Fornecedores"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Data da Nota *</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Vencimento *</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="original_amount">Valor *</Label>
              <Input
                id="original_amount"
                type="number"
                step="0.01"
                value={formData.original_amount}
                onChange={(e) => setFormData({ ...formData, original_amount: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {payable ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
