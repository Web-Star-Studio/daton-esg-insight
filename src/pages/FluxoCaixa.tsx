import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cashFlowService, CashFlowTransaction } from '@/services/cashFlowService';
import { Plus, Edit, Trash2, Check } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDateDisplay } from '@/utils/dateUtils';

export default function FluxoCaixa() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CashFlowTransaction | null>(null);
  const queryClient = useQueryClient();

  const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
  const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['cash-flow-transactions', startDate, endDate],
    queryFn: () => cashFlowService.getTransactions(startDate, endDate),
  });

  const { data: summary } = useQuery({
    queryKey: ['cashflow-summary', selectedMonth, selectedYear],
    queryFn: () => cashFlowService.getCashFlowSummary(selectedMonth, selectedYear),
  });

  const createMutation = useMutation({
    mutationFn: cashFlowService.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-summary'] });
      setDialogOpen(false);
      setEditingTransaction(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CashFlowTransaction> }) =>
      cashFlowService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-summary'] });
      setDialogOpen(false);
      setEditingTransaction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: cashFlowService.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-summary'] });
    },
  });

  const realizeMutation = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) =>
      cashFlowService.markAsRealized(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flow-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow-summary'] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const transactionData = {
      transaction_date: formData.get('transaction_date') as string,
      due_date: formData.get('due_date') as string || undefined,
      type: formData.get('type') as 'entrada' | 'saida',
      category: formData.get('category') as string,
      description: formData.get('description') as string || undefined,
      amount: Number(formData.get('amount')),
      status: (formData.get('status') as 'previsto' | 'realizado' | 'cancelado') || 'previsto',
      payment_method: formData.get('payment_method') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: transactionData });
    } else {
      createMutation.mutate(transactionData);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      previsto: 'secondary',
      realizado: 'default',
      cancelado: 'destructive',
    } as const;
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">Controle de entradas e saídas</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={month} value={month.toString()}>
                  {new Date(2024, month - 1).toLocaleString('pt-BR', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTransaction(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Editar' : 'Criar'} Transação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                    <Select name="type" defaultValue={editingTransaction?.type || 'entrada'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select name="status" defaultValue={editingTransaction?.status || 'previsto'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="previsto">Previsto</SelectItem>
                        <SelectItem value="realizado">Realizado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Input
                    id="category"
                    name="category"
                    defaultValue={editingTransaction?.category}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={editingTransaction?.description}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={editingTransaction?.amount}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transaction_date">Data da Transação *</Label>
                    <Input
                      id="transaction_date"
                      name="transaction_date"
                      type="date"
                      defaultValue={editingTransaction?.transaction_date}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Data de Vencimento</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      defaultValue={editingTransaction?.due_date}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="payment_method">Método de Pagamento</Label>
                  <Input
                    id="payment_method"
                    name="payment_method"
                    defaultValue={editingTransaction?.payment_method}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    name="notes"
                    defaultValue={editingTransaction?.notes}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingTransaction ? 'Atualizar' : 'Criar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {summary?.monthlyInflows.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summary?.monthlyOutflows.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saldo do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.netCashFlow.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saldo Projetado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.projectedBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDateDisplay(transaction.transaction_date)}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'entrada' ? 'default' : 'secondary'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                    <TableCell className={transaction.type === 'entrada' ? 'text-success' : 'text-destructive'}>
                      {Number(transaction.amount).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {transaction.status === 'previsto' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => realizeMutation.mutate({ 
                              id: transaction.id, 
                              date: new Date().toISOString().split('T')[0] 
                            })}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTransaction(transaction);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
