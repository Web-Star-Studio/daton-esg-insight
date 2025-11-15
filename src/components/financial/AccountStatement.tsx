import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { Download } from 'lucide-react';
import { chartOfAccountsService } from '@/services/chartOfAccounts';

interface StatementEntry {
  date: string;
  description: string;
  document: string;
  debit: number;
  credit: number;
  balance: number;
}

export function AccountStatement() {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: accounts = [] } = useQuery({
    queryKey: ['analytical-accounts'],
    queryFn: () => chartOfAccountsService.getAnalyticalAccounts(),
  });

  const { data: statement = [], isLoading } = useQuery({
    queryKey: ['account-statement', selectedAccount, startDate, endDate],
    queryFn: async () => {
      if (!selectedAccount || !startDate || !endDate) return [];
      // TODO: Implementar getAccountStatement no service
      return [] as StatementEntry[];
    },
    enabled: !!selectedAccount && !!startDate && !!endDate,
  });

  const columns = [
    {
      accessorKey: 'date',
      header: 'Data',
      cell: ({ row }: any) => new Date(row.original.date).toLocaleDateString('pt-BR'),
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
    },
    {
      accessorKey: 'document',
      header: 'Documento',
    },
    {
      accessorKey: 'debit',
      header: 'Débito',
      cell: ({ row }: any) => (
        <div className="text-right">
          {row.original.debit > 0
            ? `R$ ${row.original.debit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'credit',
      header: 'Crédito',
      cell: ({ row }: any) => (
        <div className="text-right">
          {row.original.credit > 0
            ? `R$ ${row.original.credit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'balance',
      header: 'Saldo',
      cell: ({ row }: any) => (
        <div className={`text-right font-medium ${row.original.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          R$ {Math.abs(row.original.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      ),
    },
  ];

  const selectedAccountData = accounts.find((acc) => acc.id === selectedAccount);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Extrato de Conta</CardTitle>
          <Button variant="outline" size="icon" disabled={statement.length === 0}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3 space-y-2">
            <Label>Conta Contábil</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Data Inicial</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Data Final</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button className="w-full" disabled={!selectedAccount || !startDate || !endDate}>
              Gerar Extrato
            </Button>
          </div>
        </div>

        {selectedAccountData && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Conta: </span>
                <span className="font-medium">{selectedAccountData.account_code}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo: </span>
                <span className="font-medium">{selectedAccountData.account_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Natureza: </span>
                <span className="font-medium">{selectedAccountData.account_nature}</span>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : statement.length === 0 && selectedAccount && startDate && endDate ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum lançamento encontrado para o período selecionado
          </div>
        ) : statement.length > 0 ? (
          <DataTable columns={columns} data={statement} />
        ) : null}
      </CardContent>
    </Card>
  );
}
