import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { accountingEntriesService } from '@/services/accountingEntries';
import { chartOfAccountsService } from '@/services/chartOfAccounts';
import { toast } from 'sonner';

interface NewEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EntryLine {
  account_id: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
}

export function NewEntryDialog({ open, onOpenChange }: NewEntryDialogProps) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountingDate, setAccountingDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<EntryLine[]>([
    { account_id: '', description: '', debit_amount: 0, credit_amount: 0 },
    { account_id: '', description: '', debit_amount: 0, credit_amount: 0 },
  ]);

  const { data: accounts = [] } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => chartOfAccountsService.getAccounts(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const nextNumber = await accountingEntriesService.getNextEntryNumber();
      const validLines = lines.filter(l => l.account_id);
      const totalDebitCalc = validLines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
      const totalCreditCalc = validLines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);
      
      return accountingEntriesService.createEntry(
        {
          entry_number: nextNumber,
          entry_date: entryDate,
          accounting_date: accountingDate,
          description,
          document_type: documentType || null,
          document_number: documentNumber || null,
          notes: notes || null,
          total_debit: totalDebitCalc,
          total_credit: totalCreditCalc,
          status: 'Provisório',
        },
        validLines
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
      toast.success('Lançamento criado com sucesso');
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar lançamento');
    },
  });

  const resetForm = () => {
    setDescription('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setAccountingDate(new Date().toISOString().split('T')[0]);
    setDocumentType('');
    setDocumentNumber('');
    setNotes('');
    setLines([
      { account_id: '', description: '', debit_amount: 0, credit_amount: 0 },
      { account_id: '', description: '', debit_amount: 0, credit_amount: 0 },
    ]);
  };

  const addLine = () => {
    setLines([...lines, { account_id: '', description: '', debit_amount: 0, credit_amount: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof EntryLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lançamento Contábil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data do Lançamento *</Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Data Contábil *</Label>
              <Input
                type="date"
                value={accountingDate}
                onChange={(e) => setAccountingDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Histórico *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do lançamento..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Documento</Label>
              <Input
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="Ex: NF, Recibo, etc."
              />
            </div>
            <div>
              <Label>Número do Documento</Label>
              <Input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Número"
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold">Linhas do Lançamento</h4>
              <Button size="sm" variant="outline" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Linha
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Select
                        value={line.account_id}
                        onValueChange={(value) => updateLine(index, 'account_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.account_code} - {acc.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        placeholder="Descrição da linha"
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Débito (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={line.debit_amount || ''}
                            onChange={(e) => updateLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Crédito (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={line.credit_amount || ''}
                            onChange={(e) => updateLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>

                    {lines.length > 2 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Total Débito:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDebit)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Total Crédito:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCredit)}
                </span>
              </div>
              {!isBalanced && (
                <p className="text-xs text-destructive mt-2">
                  ⚠️ Lançamento desbalanceado. Débito deve ser igual ao Crédito.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!isBalanced || !description || createMutation.isPending}
          >
            {createMutation.isPending ? 'Criando...' : 'Criar Lançamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
