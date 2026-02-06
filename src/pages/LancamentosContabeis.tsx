import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { accountingEntriesService } from '@/services/accountingEntries';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { formatDateDisplay } from '@/utils/dateUtils';
import { NewEntryDialog } from '@/components/accounting/NewEntryDialog';

export default function LancamentosContabeis() {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>({});
  const [showNewDialog, setShowNewDialog] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['accounting-entries', dateFilter],
    queryFn: () => accountingEntriesService.getEntries(dateFilter.start, dateFilter.end),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => accountingEntriesService.confirmEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => accountingEntriesService.cancelEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
    },
  });

  const columns = [
    { accessorKey: 'entry_number', header: 'Nº' },
    { 
      accessorKey: 'entry_date', 
      header: 'Data Lançamento',
      cell: ({ row }: any) => formatDateDisplay(row.original.entry_date)
    },
    { accessorKey: 'description', header: 'Histórico' },
    { 
      accessorKey: 'total_debit', 
      header: 'Débito',
      cell: ({ row }: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.original.total_debit)
    },
    { 
      accessorKey: 'total_credit', 
      header: 'Crédito',
      cell: ({ row }: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.original.total_credit)
    },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        const variant = status === 'Confirmado' ? 'default' : status === 'Cancelado' ? 'destructive' : 'secondary';
        return <Badge variant={variant}>{status}</Badge>;
      }
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => {
        if (row.original.status !== 'Provisório') return null;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => confirmMutation.mutate(row.original.id)}
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cancelMutation.mutate(row.original.id)}
            >
              <XCircle className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      }
    },
  ];

  const provisionalEntries = entries.filter(e => e.status === 'Provisório');
  const confirmedEntries = entries.filter(e => e.status === 'Confirmado');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lançamentos Contábeis</h1>
          <p className="text-muted-foreground">Registro de operações contábeis</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total de Lançamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{entries.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provisórios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{provisionalEntries.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confirmados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{confirmedEntries.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={entries} />
        </CardContent>
      </Card>

      <NewEntryDialog open={showNewDialog} onOpenChange={setShowNewDialog} />
    </div>
  );
}
