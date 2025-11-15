import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Download } from 'lucide-react';
import { accountingEntriesService } from '@/services/accountingEntries';

interface BalanceteData {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  balance: number;
}

export function BalanceteVerificacao() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));

  const { data: balancete = [], isLoading } = useQuery({
    queryKey: ['balancete', selectedYear, selectedMonth],
    queryFn: async () => {
      // TODO: Implementar getBalancete no service
      // Por enquanto retorna dados mockados
      return [] as BalanceteData[];
    },
  });

  const columns = [
    {
      accessorKey: 'account_code',
      header: 'Código',
    },
    {
      accessorKey: 'account_name',
      header: 'Conta',
    },
    {
      accessorKey: 'debit',
      header: 'Débito',
      cell: ({ row }: any) => (
        <div className="text-right">
          R$ {row.original.debit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: 'credit',
      header: 'Crédito',
      cell: ({ row }: any) => (
        <div className="text-right">
          R$ {row.original.credit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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

  const totalDebit = balancete.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = balancete.reduce((sum, item) => sum + item.credit, 0);

  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Balancete de Verificação</CardTitle>
            <div className="flex gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : balancete.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum lançamento encontrado para o período selecionado
            </div>
          ) : (
            <div className="space-y-4">
              <DataTable columns={columns} data={balancete} />

              <div className="border-t pt-4">
                <div className="flex justify-end gap-8 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Débito: </span>
                    <span className="font-bold">
                      R$ {totalDebit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Crédito: </span>
                    <span className="font-bold">
                      R$ {totalCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Diferença: </span>
                    <span className={`font-bold ${totalDebit === totalCredit ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {Math.abs(totalDebit - totalCredit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
