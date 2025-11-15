import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DREData {
  receitaBruta: number;
  deducoes: number;
  receitaLiquida: number;
  custos: number;
  lucroBruto: number;
  despesasOperacionais: number;
  ebitda: number;
  depreciacaoAmortizacao: number;
  ebit: number;
  resultadoFinanceiro: number;
  lair: number;
  impostos: number;
  lucroLiquido: number;
}

interface DRETableProps {
  data: DREData;
  previousData?: DREData;
}

export function DRETable({ data, previousData }: DRETableProps) {
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const calculateVariation = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    const variation = ((current - previous) / Math.abs(previous)) * 100;
    return variation;
  };

  const renderRow = (label: string, value: number, previousValue?: number, isBold = false, isTotal = false) => {
    const variation = calculateVariation(value, previousValue);
    
    return (
      <TableRow className={isTotal ? 'bg-accent/50' : ''}>
        <TableCell className={isBold ? 'font-semibold' : ''}>{label}</TableCell>
        <TableCell className={`text-right ${isBold ? 'font-semibold' : ''}`}>
          {formatCurrency(value)}
        </TableCell>
        {previousData && (
          <>
            <TableCell className="text-right text-muted-foreground">
              {formatCurrency(previousValue || 0)}
            </TableCell>
            <TableCell className="text-right">
              {variation !== null && (
                <span className={variation >= 0 ? 'text-primary' : 'text-destructive'}>
                  {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                </span>
              )}
            </TableCell>
          </>
        )}
      </TableRow>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>DRE - Demonstração do Resultado do Exercício</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Período Atual</TableHead>
              {previousData && (
                <>
                  <TableHead className="text-right">Período Anterior</TableHead>
                  <TableHead className="text-right">Variação</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderRow('Receita Bruta', data.receitaBruta, previousData?.receitaBruta, true)}
            {renderRow('(-) Deduções', -data.deducoes, previousData ? -previousData.deducoes : undefined)}
            {renderRow('(=) Receita Líquida', data.receitaLiquida, previousData?.receitaLiquida, true, true)}
            {renderRow('(-) Custos dos Produtos/Serviços', -data.custos, previousData ? -previousData.custos : undefined)}
            {renderRow('(=) Lucro Bruto', data.lucroBruto, previousData?.lucroBruto, true, true)}
            {renderRow('(-) Despesas Operacionais', -data.despesasOperacionais, previousData ? -previousData.despesasOperacionais : undefined)}
            {renderRow('(=) EBITDA', data.ebitda, previousData?.ebitda, true, true)}
            {renderRow('(-) Depreciação/Amortização', -data.depreciacaoAmortizacao, previousData ? -previousData.depreciacaoAmortizacao : undefined)}
            {renderRow('(=) EBIT', data.ebit, previousData?.ebit, true, true)}
            {renderRow('(+/-) Resultado Financeiro', data.resultadoFinanceiro, previousData?.resultadoFinanceiro)}
            {renderRow('(=) LAIR', data.lair, previousData?.lair, true, true)}
            {renderRow('(-) IR/CSLL', -data.impostos, previousData ? -previousData.impostos : undefined)}
            {renderRow('(=) LUCRO LÍQUIDO', data.lucroLiquido, previousData?.lucroLiquido, true, true)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
