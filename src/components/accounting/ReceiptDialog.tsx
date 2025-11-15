import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsReceivableService } from '@/services/accountsReceivable';
import { unifiedToast } from '@/utils/unifiedToast';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receivableId: string;
  remainingAmount: number;
}

export function ReceiptDialog({ open, onOpenChange, receivableId, remainingAmount }: ReceiptDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    amount: remainingAmount,
    receipt_date: new Date().toISOString().split('T')[0],
    payment_method: 'Transferência Bancária',
    notes: '',
  });

  const receiptMutation = useMutation({
    mutationFn: (data: typeof formData) => accountsReceivableService.registerReceipt(receivableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      unifiedToast.success('Recebimento registrado com sucesso');
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      unifiedToast.error('O valor do recebimento deve ser maior que zero');
      return;
    }

    if (formData.amount > remainingAmount) {
      unifiedToast.error('O valor do recebimento não pode ser maior que o valor restante');
      return;
    }

    receiptMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Recebimento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Valor Restante</Label>
            <div className="text-2xl font-bold text-primary">
              R$ {remainingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Recebimento *</Label>
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
            <Label htmlFor="receipt_date">Data do Recebimento *</Label>
            <Input
              id="receipt_date"
              type="date"
              value={formData.receipt_date}
              onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Forma de Recebimento *</Label>
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
              placeholder="Observações sobre o recebimento"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={receiptMutation.isPending}>
              Registrar Recebimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
