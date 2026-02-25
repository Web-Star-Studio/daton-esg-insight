import React, { useState, useCallback, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getPositions } from '@/services/organizationalStructure';
import {
  generatePositionTemplate, parsePositionFile, validateParsedPositions, importPositions,
  type ParsedPosition, type ImportResult,
} from '@/services/positionImport';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type Step = 'upload' | 'preview' | 'result';

export function PositionImportModal({ open, onOpenChange, onImportComplete }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedPosition[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setFile(null);
    setParsedRows([]);
    setImportResult(null);
    setLoading(false);
  };

  const handleClose = () => {
    if (importResult && importResult.successCount > 0) onImportComplete();
    reset();
    onOpenChange(false);
  };

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      toast.error('Formato inválido. Use CSV ou XLSX.');
      return;
    }
    setFile(f);
    setLoading(true);
    try {
      const parsed = await parsePositionFile(f);
      if (parsed.length === 0) {
        toast.error('Nenhum dado encontrado no arquivo.');
        setLoading(false);
        return;
      }
      const existingPositions = await getPositions();
      const validated = validateParsedPositions(parsed, existingPositions);
      setParsedRows(validated);
      setStep('preview');
    } catch (err) {
      toast.error('Erro ao processar arquivo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const result = await importPositions(parsedRows);
      setImportResult(result);
      setStep('result');
      if (result.successCount > 0) toast.success(`${result.successCount} cargo(s) importado(s)!`);
    } catch (err) {
      toast.error('Erro durante a importação.');
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Cargos
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Faça upload de um arquivo CSV ou XLSX com os cargos a importar.'}
            {step === 'preview' && 'Revise os dados antes de importar.'}
            {step === 'result' && 'Resultado da importação.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* STEP: Upload */}
          {step === 'upload' && (
            <div className="space-y-4 py-4">
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer',
                  isDragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50',
                  loading && 'pointer-events-none opacity-60'
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {loading ? (
                  <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className={cn('h-10 w-10 mx-auto mb-3', isDragOver ? 'text-primary' : 'text-muted-foreground')} />
                    <p className="font-medium">{isDragOver ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}</p>
                    <p className="text-sm text-muted-foreground mt-1">CSV ou XLSX</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>

              <Button variant="outline" className="w-full" onClick={generatePositionTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Modelo de Importação
              </Button>
            </div>
          )}

          {/* STEP: Preview */}
          {step === 'preview' && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> {validCount} válido(s)
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="gap-1 text-destructive border-destructive/30">
                    <XCircle className="h-3 w-3" /> {invalidCount} com erro(s)
                  </Badge>
                )}
                <span className="text-muted-foreground ml-auto">{file?.name}</span>
              </div>

              <ScrollArea className="h-[400px] border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left w-8">#</th>
                      <th className="p-2 text-left">Título</th>
                      <th className="p-2 text-left">Departamento</th>
                      <th className="p-2 text-left">Nível</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, i) => (
                      <tr key={i} className={cn('border-b', !row.isValid && 'bg-destructive/5')}>
                        <td className="p-2 text-muted-foreground">{row.rowIndex}</td>
                        <td className="p-2 font-medium">{row.title || <span className="text-destructive italic">vazio</span>}</td>
                        <td className="p-2">{row.department || '—'}</td>
                        <td className="p-2">{row.level || '—'}</td>
                        <td className="p-2">
                          {row.isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="flex items-start gap-1">
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                              <span className="text-xs text-destructive">{row.errors.join('; ')}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}

          {/* STEP: Result */}
          {step === 'result' && importResult && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{importResult.successCount}</p>
                  <p className="text-sm text-muted-foreground">Importados com sucesso</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <XCircle className={cn('h-8 w-8 mx-auto mb-2', importResult.errorCount > 0 ? 'text-destructive' : 'text-muted-foreground')} />
                  <p className="text-2xl font-bold">{importResult.errorCount}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </div>

              {importResult.createdDepartments.length > 0 && (
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">Departamentos criados automaticamente:</p>
                  <div className="flex flex-wrap gap-1">
                    {importResult.createdDepartments.map((d, i) => (
                      <Badge key={i} variant="secondary">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <ScrollArea className="h-[150px] border rounded-lg p-3">
                  <p className="text-sm font-medium mb-2 text-destructive">Detalhes dos erros:</p>
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      Linha {e.row}: {e.message}
                    </p>
                  ))}
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0 || loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-1" />}
                Importar {validCount} cargo(s)
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
          {step === 'upload' && !loading && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
