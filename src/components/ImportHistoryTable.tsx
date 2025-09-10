import { DataImportJob } from '@/services/dataCollection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, ChevronDown, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface ImportHistoryTableProps {
  jobs: DataImportJob[];
}

export function ImportHistoryTable({ jobs }: ImportHistoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (jobId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'Processando':
        return <Badge variant="secondary">Processando</Badge>;
      case 'Falhou':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getImportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'activity_data': 'Dados de Atividade',
      'waste_logs': 'Registros de Resíduos',
      'mixed': 'Dados Mistos'
    };
    return types[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Histórico de Importações
        </CardTitle>
        <CardDescription>
          Acompanhe o status de todos os uploads e importações realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma importação realizada
            </h3>
            <p className="text-muted-foreground">
              As importações de arquivos aparecerão aqui após o upload.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <Collapsible key={job.id} asChild>
                    <>
                      <TableRow className="hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRow(job.id)}
                            >
                              {expandedRows.has(job.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">{job.file_name}</TableCell>
                        <TableCell>{getImportTypeLabel(job.import_type)}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={job.progress_percentage} className="w-16 h-2" />
                            <span className="text-sm text-muted-foreground">
                              {job.progress_percentage}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(parseISO(job.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled>
                              <Download className="h-4 w-4" />
                            </Button>
                            {job.status === 'Falhou' && (
                              <Button variant="ghost" size="sm" disabled>
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="px-6 py-4 bg-muted/20 border-t">
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Registros Processados:</span>
                                    <p className="text-muted-foreground">
                                      {job.records_processed} de {job.records_total || 0}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Arquivo:</span>
                                    <p className="text-muted-foreground">{job.file_path}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Última Atualização:</span>
                                    <p className="text-muted-foreground">
                                      {format(parseISO(job.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    </p>
                                  </div>
                                </div>
                                
                                {job.log && (
                                  <div className="mt-4">
                                    <span className="font-medium text-sm">Log de Processamento:</span>
                                    <div className="mt-2 p-3 bg-background rounded-md border">
                                      <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                                        {JSON.stringify(job.log, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}