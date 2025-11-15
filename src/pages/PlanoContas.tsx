import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download } from 'lucide-react';
import { chartOfAccountsService } from '@/services/chartOfAccounts';
import { DataTable } from '@/components/ui/data-table';

export default function PlanoContas() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | undefined>();
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => chartOfAccountsService.getAccounts(),
  });

  const importMutation = useMutation({
    mutationFn: () => chartOfAccountsService.importStandardChartOfAccounts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
    },
  });

  const columns = [
    { accessorKey: 'account_code', header: 'Código' },
    { accessorKey: 'account_name', header: 'Nome da Conta' },
    { accessorKey: 'account_type', header: 'Tipo' },
    { accessorKey: 'account_nature', header: 'Natureza' },
    { accessorKey: 'status', header: 'Status' },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSelectedAccount(row.original);
            setShowDialog(true);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Plano de Contas</h1>
          <p className="text-muted-foreground">Estrutura contábil da empresa</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => importMutation.mutate()} disabled={accounts.length > 0}>
            <Download className="mr-2 h-4 w-4" />
            Importar Plano Padrão
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas Contábeis</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={accounts} />
        </CardContent>
      </Card>
    </div>
  );
}
