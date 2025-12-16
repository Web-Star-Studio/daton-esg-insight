import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, AlertTriangle, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { 
  SupplierDocumentCompliance, 
  SupplierPerformanceRanking, 
  SupplierParticipation 
} from '@/services/supplierIndicatorsService';

interface DocumentComplianceTableProps {
  data: SupplierDocumentCompliance[];
  isLoading?: boolean;
}

export function DocumentComplianceTable({ data, isLoading }: DocumentComplianceTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] animate-pulse bg-muted rounded" />
      </Card>
    );
  }

  const getStatusIcon = (rate: number) => {
    if (rate >= 100) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (rate >= 80) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conformidade Documental por Fornecedor</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-center">Documentos</TableHead>
              <TableHead className="text-center">Conformes</TableHead>
              <TableHead className="text-center">% Conformidade</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((supplier) => (
              <TableRow key={supplier.supplierId}>
                <TableCell className="font-medium">{supplier.supplierName}</TableCell>
                <TableCell className="text-center">{supplier.totalDocuments}</TableCell>
                <TableCell className="text-center">{supplier.compliantDocuments}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={supplier.complianceRate >= 80 ? 'default' : supplier.complianceRate >= 60 ? 'secondary' : 'destructive'}>
                    {supplier.complianceRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusIcon(supplier.complianceRate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
        )}
      </CardContent>
    </Card>
  );
}

interface PerformanceRankingTableProps {
  topSuppliers: SupplierPerformanceRanking[];
  lowSuppliers: SupplierPerformanceRanking[];
  isLoading?: boolean;
}

export function PerformanceRankingTable({ topSuppliers, lowSuppliers, isLoading }: PerformanceRankingTableProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card className="animate-pulse">
          <CardContent className="h-[250px] bg-muted rounded" />
        </Card>
        <Card className="animate-pulse">
          <CardContent className="h-[250px] bg-muted rounded" />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top 5 Fornecedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topSuppliers.map((supplier, index) => (
              <div key={supplier.supplierId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg w-6">{index + 1}.</span>
                  <span className="truncate max-w-[150px]">{supplier.supplierName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold">{supplier.averageScore.toFixed(1)}</span>
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
            ))}
            {topSuppliers.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Sem dados</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Necessitam Atenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {lowSuppliers.map((supplier, index) => (
              <div key={supplier.supplierId} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg w-6">{index + 1}.</span>
                  <span className="truncate max-w-[150px]">{supplier.supplierName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-red-600">{supplier.averageScore.toFixed(1)}</span>
                  <Star className="h-4 w-4 text-red-500" />
                </div>
              </div>
            ))}
            {lowSuppliers.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Sem dados</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ParticipationTableProps {
  data: SupplierParticipation[];
  isLoading?: boolean;
}

export function ParticipationTable({ data, isLoading }: ParticipationTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Participação por Fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] animate-pulse bg-muted rounded" />
      </Card>
    );
  }

  const getStatusIcon = (completed: number, total: number) => {
    if (total === 0) return <span className="text-muted-foreground">-</span>;
    if (completed === total) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (completed > 0) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Participação no Portal por Fornecedor</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-center">Treinamentos</TableHead>
              <TableHead className="text-center">Leituras</TableHead>
              <TableHead className="text-center">Pesquisas</TableHead>
              <TableHead className="text-center">Taxa Geral</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((supplier) => (
              <TableRow key={supplier.supplierId}>
                <TableCell className="font-medium">{supplier.supplierName}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>{supplier.trainingsCompleted}/{supplier.trainingsTotal}</span>
                    {getStatusIcon(supplier.trainingsCompleted, supplier.trainingsTotal)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>{supplier.readingsConfirmed}/{supplier.readingsTotal}</span>
                    {getStatusIcon(supplier.readingsConfirmed, supplier.readingsTotal)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>{supplier.surveysResponded}/{supplier.surveysTotal}</span>
                    {getStatusIcon(supplier.surveysResponded, supplier.surveysTotal)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={supplier.overallRate >= 80 ? 'default' : supplier.overallRate >= 50 ? 'secondary' : 'destructive'}>
                    {supplier.overallRate.toFixed(1)}%
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
        )}
      </CardContent>
    </Card>
  );
}
