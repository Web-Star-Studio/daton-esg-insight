import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsPayableService } from '@/services/accountsPayable';
import { unifiedToast } from '@/utils/unifiedToast';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payableId: string;
  remainingAmount: number;
}

export function PaymentDialog({ open, onOpenChange, payableId, remainingAmount }: PaymentDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    amount: remainingAmount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Transferência Bancária',
    notes: '',
  });

  const paymentMutation = useMutation({
    mutationFn: (data: typeof formData) => accountsPayableService.registerPayment(payableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      unifiedToast.success('Pagamento registrado com sucesso');
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      unifiedToast.error('O valor do pagamento deve ser maior que zero');
      return;
    }

    if (formData.amount > remainingAmount) {
      unifiedToast.error('O valor do pagamento não pode ser maior que o valor restante');
      return;
    }

    paymentMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Valor Restante</Label>
            <div className="text-2xl font-bold text-primary">
              R$ {remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Pagamento *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Data do Pagamento *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Forma de Pagamento *</Label>
            <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                <SelectItem value="Transferência Bancária">Transferência Bancária</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                <SelectItem value="Boleto">Boleto</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o pagamento"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={paymentMutation.isPending}>
              Registrar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
