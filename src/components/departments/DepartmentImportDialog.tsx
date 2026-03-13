import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  parseDepartmentFile,
  validateRows,
  importDepartments,
  downloadTemplateCSV,
  downloadTemplateXLSX,
  type DepartmentImportRow,
  type DepartmentImportResult,
} from '@/services/departmentImport';
import { getDepartments } from '@/services/organizationalStructure';

interface DepartmentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type Stage = 'upload' | 'preview' | 'result';

export function DepartmentImportDialog({ open, onOpenChange, onImportComplete }: DepartmentImportDialogProps) {
  const [stage, setStage] = useState<Stage>('upload');
  const [rows, setRows] = useState<DepartmentImportRow[]>([]);
  const [result, setResult] = useState<DepartmentImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStage('upload');
    setRows([]);
    setResult(null);
    setImporting(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleFile = async (file: File) => {
    try {
      const parsed = await parseDepartmentFile(file);
      if (parsed.length === 0) {
        toast.error('Arquivo vazio ou sem dados válidos');
        return;
      }
      const existing = await getDepartments();
      const validated = validateRows(parsed, existing);
      setRows(validated);
      setStage('preview');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar arquivo');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r._status === 'valid');
    if (validRows.length === 0) {
      toast.error('Nenhum departamento válido para importar');
      return;
    }
    setImporting(true);
    try {
      const res = await importDepartments(validRows);
      setResult(res);
      setStage('result');
      if (res.created > 0) onImportComplete();
    } catch (err: any) {
      toast.error(err.message || 'Erro na importação');
    } finally {
      setImporting(false);
    }
  };

  const validCount = rows.filter((r) => r._status === 'valid').length;
  const errorCount = rows.filter((r) => r._status === 'error').length;
  const skippedCount = rows.filter((r) => r._status === 'skipped').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {stage === 'upload' && 'Importar Departamentos'}
            {stage === 'preview' && 'Pré-visualização'}
            {stage === 'result' && 'Resultado da Importação'}
          </DialogTitle>
        </DialogHeader>

        {stage === 'upload' && (
          <div className="space-y-6">
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-all',
                isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">Arraste um arquivo CSV ou XLSX aqui</p>
              <p className="text-xs text-muted-foreground mb-3">ou</p>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Selecionar arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Baixar template de exemplo</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadTemplateCSV(); }}>
                  <Download className="w-4 h-4 mr-2" />
                  Template CSV
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadTemplateXLSX(); }}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Template XLSX
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm">Colunas esperadas:</p>
              <p><strong>name</strong> (obrigatório) — Nome do departamento</p>
              <p><strong>description</strong> — Descrição</p>
              <p><strong>parent_department</strong> — Nome do departamento pai</p>
              <p><strong>budget</strong> — Orçamento (número)</p>
              <p><strong>cost_center</strong> — Centro de custo</p>
            </div>
          </div>
        )}

        {stage === 'preview' && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default">{validCount} válidos</Badge>
              {skippedCount > 0 && <Badge variant="secondary">{skippedCount} já existem</Badge>}
              {errorCount > 0 && <Badge variant="destructive">{errorCount} com erro</Badge>}
            </div>

            <div className="rounded-md border max-h-[40vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Dept. Pai</TableHead>
                    <TableHead>Orçamento</TableHead>
                    <TableHead>Centro Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className={row._status === 'error' ? 'bg-destructive/5' : row._status === 'skipped' ? 'bg-muted/40' : ''}>
                      <TableCell>
                        {row._status === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        {row._status === 'error' && (
                          <span className="flex items-center gap-1" title={row._error}>
                            <XCircle className="w-4 h-4 text-destructive" />
                          </span>
                        )}
                        {row._status === 'skipped' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      </TableCell>
                      <TableCell className="font-medium">{row.name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{row.description || '—'}</TableCell>
                      <TableCell>{row.parent_department || '—'}</TableCell>
                      <TableCell>{row.budget ?? '—'}</TableCell>
                      <TableCell>{row.cost_center || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {errorCount > 0 && (
              <div className="text-xs text-destructive space-y-1">
                {rows.filter((r) => r._status === 'error').map((r, i) => (
                  <p key={i}>• <strong>{r.name || '(vazio)'}</strong>: {r._error}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>Voltar</Button>
              <Button onClick={handleImport} disabled={validCount === 0 || importing}>
                {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Importar {validCount} departamento{validCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}

        {stage === 'result' && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4">
                <p className="text-2xl font-bold text-green-600">{result.created}</p>
                <p className="text-xs text-muted-foreground">Criados</p>
              </div>
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 p-4">
                <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Ignorados</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4">
                <p className="text-2xl font-bold text-destructive">{result.errors}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>

            {result.details.length > 0 && (
              <div className="rounded-md border max-h-[30vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.details.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>{d.row}</TableCell>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell>
                          <Badge variant={d.status === 'created' ? 'default' : d.status === 'skipped' ? 'secondary' : 'destructive'}>
                            {d.status === 'created' ? 'Criado' : d.status === 'skipped' ? 'Ignorado' : 'Erro'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => handleClose(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
