import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { accountsPayableService } from '@/services/accountsPayable';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';

export default function ContasAPagar() {
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: payables = [], isLoading } = useQuery({
    queryKey: ['accounts-payable', statusFilter],
    queryFn: () => accountsPayableService.getPayables({ status: statusFilter || undefined }),
  });

  const { data: overduePayables = [] } = useQuery({
    queryKey: ['overdue-payables'],
    queryFn: () => accountsPayableService.getOverduePayables(),
  });

  const columns = [
    { accessorKey: 'invoice_number', header: 'Nº Nota' },
    { accessorKey: 'supplier_name', header: 'Fornecedor' },
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
      cell: ({ row }: any) => <Badge variant={row.original.status === 'Pago' ? 'default' : 'destructive'}>{row.original.status}</Badge>
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gestão de obrigações financeiras</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta a Pagar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                payables.filter(p => p.status !== 'Pago').reduce((sum, p) => sum + (p.final_amount || p.original_amount), 0)
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{overduePayables.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pendentes Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {payables.filter(p => p.approval_status === 'Pendente').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={payables} />
        </CardContent>
      </Card>
    </div>
  );
}
