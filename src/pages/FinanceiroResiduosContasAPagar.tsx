import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Clock, DollarSign, FileText, Calendar } from "lucide-react";
import { getPayableWastes, getPayablesStats, registerPayment, type PayableWaste } from "@/services/wasteFinance";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinanceiroResiduosContasAPagar() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWaste, setSelectedWaste] = useState<PayableWaste | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payables = [], isLoading: loadingPayables } = useQuery({
    queryKey: ['payable-wastes', statusFilter],
    queryFn: () => getPayableWastes({ status: statusFilter }),
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['payables-stats'],
    queryFn: getPayablesStats,
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount, date, notes }: { id: string; amount: number; date: string; notes?: string }) =>
      registerPayment(id, amount, date, notes),
    onSuccess: () => {
      toast({
        title: "Pagamento Registrado",
        description: "O pagamento foi registrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['payable-wastes'] });
      queryClient.invalidateQueries({ queryKey: ['payables-stats'] });
      setSelectedWaste(null);
      setPaymentAmount(0);
      setPaymentNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRegisterPayment = () => {
    if (!selectedWaste || paymentAmount <= 0) {
      toast({
        title: "Valor Inválido",
        description: "Informe um valor válido para o pagamento.",
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate({
      id: selectedWaste.id,
      amount: paymentAmount,
      date: paymentDate,
      notes: paymentNotes,
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Quitado':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Quitado</Badge>;
      case 'Parcial':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Parcial</Badge>;
      default:
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
  };

  const formatCurrency = (value?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const calculateDaysOverdue = (collectionDate: string) => {
    const now = new Date();
    const collection = new Date(collectionDate);
    const days = Math.floor((now.getTime() - collection.getTime()) / (1000 * 60 * 60 * 24));
    return days > 30 ? days - 30 : 0;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar - Resíduos</h1>
          <p className="text-muted-foreground mt-1">Gestão financeira de pagamentos de destinação de resíduos</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.total_to_pay)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.pending_count || 0} pendentes, {stats?.partial_count || 0} parciais
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{stats?.overdue_count || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats?.overdue_amount)} em atraso
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quitadas no Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.paid_this_month)}</div>
                <p className="text-xs text-muted-foreground mt-1">Pagamentos realizados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats?.pending_amount)}</div>
                <p className="text-xs text-muted-foreground mt-1">Aguardando pagamento</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Listagem */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Listagem de Contas a Pagar</CardTitle>
              <CardDescription>Operações de destinação de resíduos com valores a pagar</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Parcial">Parcial</SelectItem>
                <SelectItem value="Quitado">Quitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPayables ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : payables.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conta a pagar encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MTR</TableHead>
                  <TableHead>Data Coleta</TableHead>
                  <TableHead>Resíduo</TableHead>
                  <TableHead>Destinador</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables.map((waste) => {
                  const balance = (waste.total_payable || 0) - (waste.amount_paid || 0);
                  const daysOverdue = calculateDaysOverdue(waste.collection_date);

                  return (
                    <TableRow key={waste.id}>
                      <TableCell className="font-medium">{waste.mtr_number}</TableCell>
                      <TableCell>{format(new Date(waste.collection_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{waste.waste_description}</TableCell>
                      <TableCell>{waste.destination_name || '-'}</TableCell>
                      <TableCell>{formatCurrency(waste.total_payable)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(waste.amount_paid)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(balance)}</TableCell>
                      <TableCell>{getStatusBadge(waste.payment_status)}</TableCell>
                      <TableCell>
                        {daysOverdue > 0 ? (
                          <span className="text-red-600 text-xs font-medium">
                            {daysOverdue} dias em atraso
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Dentro do prazo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {waste.payment_status !== 'Quitado' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedWaste(waste);
                              setPaymentAmount(balance);
                            }}
                          >
                            Registrar Pagamento
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Registro de Pagamento */}
      <Dialog open={!!selectedWaste} onOpenChange={(open) => !open && setSelectedWaste(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              MTR: {selectedWaste?.mtr_number} | Resíduo: {selectedWaste?.waste_description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor Total a Pagar</Label>
              <Input value={formatCurrency(selectedWaste?.total_payable)} disabled />
            </div>
            <div className="space-y-2">
              <Label>Já Pago</Label>
              <Input value={formatCurrency(selectedWaste?.amount_paid)} disabled />
            </div>
            <div className="space-y-2">
              <Label>Saldo Restante</Label>
              <Input
                value={formatCurrency((selectedWaste?.total_payable || 0) - (selectedWaste?.amount_paid || 0))}
                disabled
                className="font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Valor do Pagamento *</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-date">Data do Pagamento *</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-notes">Observações</Label>
              <Input
                id="payment-notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Ex: Depósito, Transferência, Boleto..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWaste(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterPayment} disabled={paymentMutation.isPending}>
              {paymentMutation.isPending ? "Salvando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
