import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { accountsReceivableService } from '@/services/accountsReceivable';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';

export default function ContasAReceber() {
  const { data: receivables = [] } = useQuery({
    queryKey: ['accounts-receivable'],
    queryFn: () => accountsReceivableService.getReceivables(),
  });

  const { data: overdueReceivables = [] } = useQuery({
    queryKey: ['overdue-receivables'],
    queryFn: () => accountsReceivableService.getOverdueReceivables(),
  });

  const columns = [
    { accessorKey: 'invoice_number', header: 'Nº Nota' },
    { accessorKey: 'customer_name', header: 'Cliente' },
    { accessorKey: 'category', header: 'Categoria' },
    { 
      accessorKey: 'original_amount', 
      header: 'Valor',
      cell: ({ row }: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.original.original_amount)
    },
    { accessorKey: 'due_date', header: 'Vencimento' },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }: any) => <Badge variant={row.original.status === 'Recebido' ? 'default' : 'secondary'}>{row.original.status}</Badge>
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">Gestão de recebíveis</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta a Receber
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                receivables.filter(r => r.status !== 'Recebido').reduce((sum, r) => sum + (r.final_amount || r.original_amount), 0)
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{overdueReceivables.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recebidas (Mês)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {receivables.filter(r => r.status === 'Recebido').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Receber</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={receivables} />
        </CardContent>
      </Card>
    </div>
  );
}
