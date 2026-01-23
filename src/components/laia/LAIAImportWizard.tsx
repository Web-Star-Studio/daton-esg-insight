import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Building2,
  FileCheck,
  MapPin,
} from 'lucide-react';
import { useLAIAImport } from '@/hooks/useLAIAImport';
import { downloadLAIATemplate } from '@/services/laiaImport';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LAIAImportWizardProps {
  open: boolean;
  onClose: () => void;
  branchId?: string;
}

type Step = 'upload' | 'branch' | 'preview' | 'validate' | 'result';

const STEPS: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'branch', label: 'Filial' },
  { key: 'preview', label: 'Prévia' },
  { key: 'validate', label: 'Validação' },
  { key: 'result', label: 'Resultado' },
];

export function LAIAImportWizard({ open, onClose, branchId }: LAIAImportWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(branchId || null);
  const [skipBranch, setSkipBranch] = useState(!!branchId);
  const { user } = useAuth();
  
  const {
    parsedRows,
    validationResult,
    importResult,
    progress,
    isParsing,
    isValidating,
    isImporting,
    parseFile,
    validate,
    importAssessments,
    reset,
  } = useLAIAImport();

  // Fetch branches for selection
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches', user?.company?.id],
    queryFn: async () => {
      if (!user?.company?.id) return [];
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code, city, state')
        .eq('company_id', user.company.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!user?.company?.id,
  });
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile, {
        onSuccess: () => setStep('branch'),
      });
    }
  }, [parseFile]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleContinueFromBranch = () => {
    setStep('preview');
  };
  
  const handleValidate = () => {
    validate(parsedRows, {
      onSuccess: () => setStep('validate'),
    });
  };
  
  const handleImport = () => {
    const rowsToImport = validationResult?.validRows || parsedRows;
    const branchToUse = skipBranch ? null : selectedBranchId;
    importAssessments(rowsToImport, branchToUse);
    setStep('result');
  };
  
  const handleClose = () => {
    reset();
    setStep('upload');
    setFile(null);
    setSelectedBranchId(null);
    setSkipBranch(false);
    onClose();
  };
  
  const handleBack = () => {
    if (step === 'branch') setStep('upload');
    else if (step === 'preview') setStep('branch');
    else if (step === 'validate') setStep('preview');
  };
  
  const currentStepIndex = STEPS.findIndex(s => s.key === step);

  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Avaliações LAIA
          </DialogTitle>
        </DialogHeader>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg">
          {STEPS.map((s, idx) => (
            <div key={s.key} className="flex items-center">
              <div className={cn(
                "flex items-center gap-2",
                idx <= currentStepIndex ? "text-primary" : "text-muted-foreground"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  idx < currentStepIndex ? "bg-primary text-primary-foreground" :
                  idx === currentStepIndex ? "bg-primary/20 text-primary border-2 border-primary" :
                  "bg-muted text-muted-foreground"
                )}>
                  {idx < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn(
                  "w-12 h-0.5 mx-2",
                  idx < currentStepIndex ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div className="p-6 space-y-6">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Solte o arquivo aqui...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-1">Arraste o arquivo Excel ou clique para selecionar</p>
                    <p className="text-sm text-muted-foreground">Formatos aceitos: .xlsx, .xls (máx. 10MB)</p>
                  </>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={() => downloadLAIATemplate()}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Template
                </Button>
              </div>
              
              {isParsing && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processando arquivo...</span>
                </div>
              )}
            </div>
          )}

          {step === 'branch' && (
            <div className="p-6 space-y-6">
              <div className="text-center mb-6">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold">Selecione a Filial</h3>
                <p className="text-muted-foreground">
                  As {parsedRows.length} avaliações serão vinculadas à filial selecionada
                </p>
              </div>

              {isLoadingBranches ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando filiais...</span>
                </div>
              ) : branches.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">Nenhuma filial cadastrada</p>
                  <p className="text-sm text-muted-foreground">
                    As avaliações serão importadas sem vinculação a uma filial específica.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select 
                    value={selectedBranchId || ''} 
                    onValueChange={(value) => {
                      setSelectedBranchId(value);
                      setSkipBranch(false);
                    }}
                    disabled={skipBranch}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma filial..." />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{branch.name}</span>
                            {branch.city && (
                              <span className="text-muted-foreground">
                                ({branch.city}{branch.state ? `, ${branch.state}` : ''})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/50">
                    <Checkbox 
                      id="skip-branch"
                      checked={skipBranch}
                      onCheckedChange={(checked) => {
                        setSkipBranch(checked === true);
                        if (checked) setSelectedBranchId(null);
                      }}
                    />
                    <label htmlFor="skip-branch" className="text-sm cursor-pointer">
                      Importar sem vincular a uma filial específica
                    </label>
                  </div>

                  {selectedBranch && (
                    <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="font-medium">Filial selecionada: {selectedBranch.name}</span>
                      </div>
                      {selectedBranch.city && (
                        <p className="text-sm text-muted-foreground mt-1 ml-7">
                          {selectedBranch.city}{selectedBranch.state ? `, ${selectedBranch.state}` : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {step === 'preview' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{file?.name}</span>
                  <Badge variant="secondary">{parsedRows.length} registros</Badge>
                </div>
                {selectedBranch && (
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    {selectedBranch.name}
                  </Badge>
                )}
              </div>
              
              <ScrollArea className="h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Aspecto</TableHead>
                      <TableHead>Impacto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Significância</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 50).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.sector_code}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.environmental_aspect}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{row.environmental_impact}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            row.category === 'critico' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            row.category === 'moderado' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          )}>
                            {row.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.significance === 'significativo' ? 'destructive' : 'secondary'}>
                            {row.significance === 'significativo' ? 'Significativo' : 'Não Sig.'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              {parsedRows.length > 50 && (
                <p className="text-sm text-muted-foreground text-center">
                  Mostrando 50 de {parsedRows.length} registros
                </p>
              )}
            </div>
          )}
          
          {step === 'validate' && validationResult && (
            <div className="p-4 space-y-4">
              {/* Branch indicator */}
              {selectedBranch && (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    Importando para a filial: <strong>{selectedBranch.name}</strong>
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-foreground">{validationResult.stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 text-center">
                  <p className="text-2xl font-bold text-green-600">{validationResult.stats.valid}</p>
                  <p className="text-sm text-muted-foreground">Válidos</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 text-center">
                  <p className="text-2xl font-bold text-red-600">{validationResult.stats.invalid}</p>
                  <p className="text-sm text-muted-foreground">Inválidos</p>
                </div>
              </div>
              
              {/* New Sectors */}
              {validationResult.stats.newSectors.length > 0 && (
                <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800 dark:text-amber-200">
                      {validationResult.stats.newSectors.length} setor(es) serão criados:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {validationResult.stats.newSectors.map(s => (
                      <Badge key={s} variant="outline" className="border-amber-400">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="font-medium">Erros ({validationResult.errors.length})</span>
                  </div>
                  <ScrollArea className="h-[150px] border rounded-lg p-2">
                    {validationResult.errors.map((error, idx) => (
                      <div key={idx} className="text-sm py-1 flex items-start gap-2">
                        <Badge variant="destructive" className="shrink-0">Linha {error.row}</Badge>
                        <span>{error.message}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
              
              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Avisos ({validationResult.warnings.length})</span>
                  </div>
                  <ScrollArea className="h-[100px] border rounded-lg p-2">
                    {validationResult.warnings.map((warning, idx) => (
                      <div key={idx} className="text-sm py-1 flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0 border-amber-400">Linha {warning.row}</Badge>
                        <span className="text-muted-foreground">{warning.message}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
              
              {/* Progress */}
              {isImporting && progress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{progress.message}</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <Progress value={(progress.current / progress.total) * 100} />
                </div>
              )}
            </div>
          )}
          
          {step === 'result' && importResult && (
            <div className="p-6 space-y-6">
              <div className="text-center">
                {importResult.success ? (
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                ) : (
                  <AlertTriangle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                )}
                <h3 className="text-xl font-semibold mb-2">
                  {importResult.success ? 'Importação Concluída!' : 'Importação Parcial'}
                </h3>
                <p className="text-muted-foreground">
                  {importResult.imported} avaliações importadas com sucesso
                  {selectedBranch && (
                    <span> para a filial <strong>{selectedBranch.name}</strong></span>
                  )}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 text-center">
                  <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-sm text-muted-foreground">Importados</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 text-center">
                  <p className="text-3xl font-bold text-red-600">{importResult.failed}</p>
                  <p className="text-sm text-muted-foreground">Falhas</p>
                </div>
              </div>
              
              {importResult.sectorsCreated.length > 0 && (
                <div className="p-4 rounded-lg border">
                  <p className="font-medium mb-2">Setores criados:</p>
                  <div className="flex flex-wrap gap-1">
                    {importResult.sectorsCreated.map(s => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {importResult.errors.length > 0 && (
                <ScrollArea className="h-[150px] border rounded-lg p-2">
                  {importResult.errors.map((error, idx) => (
                    <div key={idx} className="text-sm py-1 flex items-start gap-2">
                      <Badge variant="destructive" className="shrink-0">Linha {error.row}</Badge>
                      <span>{error.message}</span>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {(step === 'branch' || step === 'preview' || step === 'validate') && (
              <Button variant="ghost" onClick={handleBack} disabled={isImporting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {step === 'result' ? 'Fechar' : 'Cancelar'}
            </Button>

            {step === 'branch' && (
              <Button 
                onClick={handleContinueFromBranch} 
                disabled={!skipBranch && !selectedBranchId && branches.length > 0}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Continuar
              </Button>
            )}
            
            {step === 'preview' && (
              <Button onClick={handleValidate} disabled={isValidating}>
                {isValidating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Validar
              </Button>
            )}
            
            {step === 'validate' && validationResult && validationResult.validRows.length > 0 && (
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Importar {validationResult.validRows.length} registros
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}