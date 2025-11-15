import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DRETable } from '@/components/financial/DRETable';
import { financialReports } from '@/services/financialReports';
import { FileText, Download } from 'lucide-react';

export default function RelatoriosFinanceiros() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(currentMonth);

  const { data: dreData, isLoading: dreLoading } = useQuery({
    queryKey: ['dre', selectedYear, selectedMonth],
    queryFn: () => financialReports.getDRE(selectedYear, selectedMonth),
  });

  const { data: indicators, isLoading: indicatorsLoading } = useQuery({
    queryKey: ['financial-indicators', selectedYear],
    queryFn: () => financialReports.getFinancialIndicators(selectedYear),
  });

  const { data: monthlyComparison } = useQuery({
    queryKey: ['monthly-comparison', selectedYear],
    queryFn: () => financialReports.getMonthlyComparison(selectedYear),
  });

  const months = [
    { value: undefined, label: 'Ano Completo' },
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Relatórios Financeiros
          </h1>
          <p className="text-muted-foreground mt-2">
            DRE, indicadores e análises gerenciais
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={selectedMonth?.toString() || 'all'} 
          onValueChange={(value) => setSelectedMonth(value === 'all' ? undefined : Number(value))}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.label} value={month.value?.toString() || 'all'}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Indicadores Financeiros */}
      {indicators && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Margem Bruta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicators.margemBruta.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Margem EBITDA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicators.margemEbitda.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Margem Líquida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicators.margemLiquida.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Liquidez Corrente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{indicators.liquidezCorrente.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DRE */}
      {dreData && <DRETable data={dreData} />}

      {dreLoading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Carregando relatórios...
          </CardContent>
        </Card>
      )}
    </div>
  );
}
