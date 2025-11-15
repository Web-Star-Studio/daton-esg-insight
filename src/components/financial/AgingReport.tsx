import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { accountsPayableService } from '@/services/accountsPayable';
import { accountsReceivableService } from '@/services/accountsReceivable';
import { differenceInDays } from 'date-fns';

interface AgingItem {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  aging_bucket: string;
}

export function AgingReport() {
  const { data: payables = [] } = useQuery({
    queryKey: ['overdue-payables'],
    queryFn: () => accountsPayableService.getOverduePayables(),
  });

  const { data: receivables = [] } = useQuery({
    queryKey: ['overdue-receivables'],
    queryFn: () => accountsReceivableService.getOverdueReceivables(),
  });

  const getAgingBucket = (daysOverdue: number) => {
    if (daysOverdue <= 30) return '0-30 dias';
    if (daysOverdue <= 60) return '31-60 dias';
    if (daysOverdue <= 90) return '61-90 dias';
    return '+90 dias';
  };

  const processAgingData = (items: any[], type: 'payable' | 'receivable'): AgingItem[] => {
    return items.map((item) => {
      const daysOverdue = Math.abs(differenceInDays(new Date(), new Date(item.due_date)));
      return {
        id: item.id,
        description: type === 'payable' ? item.supplier_name || 'N/A' : item.customer_name,
        amount: item.final_amount || item.original_amount,
        due_date: item.due_date,
        days_overdue: daysOverdue,
        aging_bucket: getAgingBucket(daysOverdue),
      };
    });
  };

  const payablesAging = processAgingData(payables, 'payable');
  const receivablesAging = processAgingData(receivables, 'receivable');

  const columns = [
    {
      accessorKey: 'description',
      header: 'Descrição',
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }: any) => (
        <div className="font-medium">
          R$ {row.original.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Vencimento',
      cell: ({ row }: any) => new Date(row.original.due_date).toLocaleDateString('pt-BR'),
    },
    {
      accessorKey: 'days_overdue',
      header: 'Dias Vencidos',
      cell: ({ row }: any) => (
        <Badge variant={row.original.days_overdue > 60 ? 'destructive' : 'secondary'}>
          {row.original.days_overdue} dias
        </Badge>
      ),
    },
    {
      accessorKey: 'aging_bucket',
      header: 'Faixa',
    },
  ];

  const calculateAgingSummary = (items: AgingItem[]) => {
    const buckets = {
      '0-30 dias': 0,
      '31-60 dias': 0,
      '61-90 dias': 0,
      '+90 dias': 0,
    };

    items.forEach((item) => {
      buckets[item.aging_bucket as keyof typeof buckets] += item.amount;
    });

    return buckets;
  };

  const payablesSummary = calculateAgingSummary(payablesAging);
  const receivablesSummary = calculateAgingSummary(receivablesAging);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aging Report - Análise de Vencimentos</CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="payables">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
          </TabsList>

          <TabsContent value="payables" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(payablesSummary).map(([bucket, amount]) => (
                <Card key={bucket}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">{bucket}</div>
                    <div className="text-2xl font-bold text-destructive">
                      R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {payablesAging.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma conta a pagar vencida
              </div>
            ) : (
              <DataTable columns={columns} data={payablesAging} />
            )}
          </TabsContent>

          <TabsContent value="receivables" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(receivablesSummary).map(([bucket, amount]) => (
                <Card key={bucket}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">{bucket}</div>
                    <div className="text-2xl font-bold text-green-600">
                      R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {receivablesAging.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma conta a receber vencida
              </div>
            ) : (
              <DataTable columns={columns} data={receivablesAging} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
