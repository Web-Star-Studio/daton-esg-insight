import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsReceivableService, AccountReceivable } from '@/services/accountsReceivable';
import { unifiedToast } from '@/utils/unifiedToast';

interface AccountReceivableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivable?: AccountReceivable;
}

export function AccountReceivableDialog({ open, onOpenChange, receivable }: AccountReceivableDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customer_name: '',
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    original_amount: 0,
    category: 'Clientes',
    notes: '',
  });

  useEffect(() => {
    if (receivable) {
      setFormData({
        customer_name: receivable.customer_name,
        invoice_number: receivable.invoice_number,
        invoice_date: receivable.invoice_date,
        due_date: receivable.due_date,
        original_amount: receivable.original_amount,
        category: receivable.category,
        notes: receivable.notes || '',
      });
    } else {
      setFormData({
        customer_name: '',
        invoice_number: '',
        invoice_date: '',
        due_date: '',
        original_amount: 0,
        category: 'Clientes',
        notes: '',
      });
    }
  }, [receivable, open]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => accountsReceivableService.createReceivable({
      ...data,
      status: 'Pendente',
      received_amount: 0,
      discount_amount: 0,
      interest_amount: 0,
      fine_amount: 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      unifiedToast.success('Conta a receber criada com sucesso');
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => accountsReceivableService.updateReceivable(receivable!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      unifiedToast.success('Conta a receber atualizada com sucesso');
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name || !formData.invoice_number || !formData.original_amount) {
      unifiedToast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (receivable) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{receivable ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Cliente *</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="Nome do cliente"
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
                placeholder="Clientes"
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
              {receivable ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
