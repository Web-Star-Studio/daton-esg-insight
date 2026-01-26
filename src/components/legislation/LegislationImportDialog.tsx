import React, { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Building2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBranches } from "@/services/branches";
import {
  parseLegislationExcelWithUnits,
  validateLegislations,
  importLegislations,
  downloadLegislationTemplate,
  ParsedLegislation,
  LegislationValidation,
  LegislationImportResult,
  LegislationImportProgress,
  UnitMapping,
} from "@/services/legislationImport";
import { UnitMappingStep, createInitialMappings } from "./UnitMappingStep";

interface LegislationImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

type ImportStage = 'upload' | 'mapping' | 'preview' | 'importing' | 'result';

export function LegislationImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: LegislationImportDialogProps) {
  const { user } = useAuth();
  const { data: branches = [] } = useBranches();
  
  const [stage, setStage] = useState<ImportStage>('upload');
  const [parsedData, setParsedData] = useState<ParsedLegislation[]>([]);
  const [detectedUnitColumns, setDetectedUnitColumns] = useState<string[]>([]);
  const [unitMappings, setUnitMappings] = useState<UnitMapping[]>([]);
  const [validations, setValidations] = useState<LegislationValidation[]>([]);
  const [importResult, setImportResult] = useState<LegislationImportResult | null>(null);
  const [progress, setProgress] = useState<LegislationImportProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Import options
  const [skipExisting, setSkipExisting] = useState(true);
  const [createMissingThemes, setCreateMissingThemes] = useState(true);

  const resetState = () => {
    setStage('upload');
    setParsedData([]);
    setDetectedUnitColumns([]);
    setUnitMappings([]);
    setValidations([]);
    setImportResult(null);
    setProgress(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await parseLegislationExcelWithUnits(file);
      
      if (result.legislations.length === 0) {
        toast.error("Nenhuma legislação encontrada no arquivo");
        setIsProcessing(false);
        return;
      }

      setParsedData(result.legislations);
      setDetectedUnitColumns(result.detectedUnitColumns);

      // If unit columns detected, go to mapping step
      if (result.detectedUnitColumns.length > 0) {
        const initialMappings = createInitialMappings(result.detectedUnitColumns, branches);
        setUnitMappings(initialMappings);
        setStage('mapping');
        toast.success(`${result.legislations.length} legislações encontradas com ${result.detectedUnitColumns.length} colunas de unidades`);
      } else {
        // No unit columns, go directly to preview
        if (user?.company?.id) {
          const validationResults = await validateLegislations(result.legislations, user.company.id);
          setValidations(validationResults);
        }
        setStage('preview');
        toast.success(`${result.legislations.length} legislações encontradas`);
      }
    } catch (error) {
      toast.error(`Erro ao processar arquivo: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [user?.company?.id, branches]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const handleContinueFromMapping = async () => {
    setIsProcessing(true);
    try {
      if (user?.company?.id) {
        const validationResults = await validateLegislations(parsedData, user.company.id);
        setValidations(validationResults);
      }
      setStage('preview');
    } catch (error) {
      toast.error(`Erro ao validar: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!user?.company?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    // Filter only valid legislations
    const validLegislations = parsedData.filter((_, idx) => validations[idx]?.isValid !== false);
    
    if (validLegislations.length === 0) {
      toast.error("Nenhuma legislação válida para importar");
      return;
    }

    setStage('importing');
    setIsProcessing(true);

    try {
      const result = await importLegislations(validLegislations, {
        skipExisting,
        createMissingThemes,
        unitMappings: unitMappings.filter(m => m.branchId), // Only mapped units
        onProgress: setProgress,
      });

      setImportResult(result);
      setStage('result');

      if (result.success) {
        const unitMsg = result.unitCompliancesCreated > 0 
          ? ` e ${result.unitCompliancesCreated} avaliações por unidade`
          : '';
        toast.success(`${result.imported} legislações importadas${unitMsg}!`);
        onImportComplete?.();
      } else {
        toast.warning(`Importação concluída com ${result.errors} erro(s)`);
      }
    } catch (error) {
      toast.error(`Erro na importação: ${(error as Error).message}`);
      setStage('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = validations.filter(v => v.isValid).length;
  const errorCount = validations.filter(v => !v.isValid).length;
  const warningCount = validations.filter(v => v.isValid && v.warnings.length > 0).length;
  const mappedUnitsCount = unitMappings.filter(m => m.branchId).length;

  // Count total unit evaluations in parsed data
  const totalUnitEvaluations = useMemo(() => {
    return parsedData.reduce((sum, leg) => sum + (leg.unitEvaluations?.length || 0), 0);
  }, [parsedData]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Legislações via Excel
          </DialogTitle>
          <DialogDescription>
            {stage === 'upload' && "Faça upload de um arquivo Excel com as legislações a importar"}
            {stage === 'mapping' && "Mapeie as colunas de unidades para as filiais do sistema"}
            {stage === 'preview' && "Revise os dados antes de confirmar a importação"}
            {stage === 'importing' && "Importando legislações..."}
            {stage === 'result' && "Resultado da importação"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Upload Stage */}
          {stage === 'upload' && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input {...getInputProps()} />
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-muted-foreground">Processando arquivo...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="font-medium">
                      {isDragActive ? "Solte o arquivo aqui" : "Arraste um arquivo Excel ou clique para selecionar"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Formatos aceitos: .xlsx, .xls
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Button variant="outline" onClick={downloadLegislationTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Template Excel
                </Button>
              </div>
            </div>
          )}

          {/* Mapping Stage */}
          {stage === 'mapping' && (
            <UnitMappingStep
              detectedUnits={detectedUnitColumns}
              branches={branches}
              mappings={unitMappings}
              onMappingsChange={setUnitMappings}
            />
          )}

          {/* Preview Stage */}
          {stage === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4 flex-wrap">
                <Badge variant="secondary" className="text-sm py-1 px-3">
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  {parsedData.length} registros
                </Badge>
                <Badge variant="default" className="text-sm py-1 px-3 bg-green-600">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {validCount} válidos
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-sm py-1 px-3">
                    <XCircle className="h-4 w-4 mr-1" />
                    {errorCount} com erros
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="secondary" className="text-sm py-1 px-3 bg-yellow-500 text-white">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {warningCount} com avisos
                  </Badge>
                )}
                {mappedUnitsCount > 0 && (
                  <Badge variant="secondary" className="text-sm py-1 px-3 bg-blue-600 text-white">
                    <Building2 className="h-4 w-4 mr-1" />
                    {mappedUnitsCount} unidades mapeadas ({totalUnitEvaluations} avaliações)
                  </Badge>
                )}
              </div>

              {/* Options */}
              <div className="flex gap-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipExisting"
                    checked={skipExisting}
                    onCheckedChange={(checked) => setSkipExisting(checked as boolean)}
                  />
                  <Label htmlFor="skipExisting">Ignorar duplicados existentes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createThemes"
                    checked={createMissingThemes}
                    onCheckedChange={(checked) => setCreateMissingThemes(checked as boolean)}
                  />
                  <Label htmlFor="createThemes">Criar temas/subtemas faltantes</Label>
                </div>
              </div>

              {/* Preview Table */}
              <ScrollArea className="h-[300px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Linha</TableHead>
                      <TableHead className="w-[80px]">Status</TableHead>
                      <TableHead className="w-[100px]">Tipo</TableHead>
                      <TableHead>Título/Ementa</TableHead>
                      <TableHead className="w-[100px]">Jurisdição</TableHead>
                      <TableHead className="w-[80px]">Unidades</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 50).map((leg, idx) => {
                      const validation = validations[idx];
                      const unitCount = leg.unitEvaluations?.length || 0;
                      return (
                        <TableRow key={idx} className={!validation?.isValid ? 'bg-destructive/10' : ''}>
                          <TableCell className="font-mono text-sm">{leg.rowNumber}</TableCell>
                          <TableCell>
                            {validation?.isValid ? (
                              validation.warnings.length > 0 ? (
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{leg.norm_type}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm" title={leg.title}>
                            {leg.title}
                          </TableCell>
                          <TableCell className="text-sm capitalize">{leg.jurisdiction}</TableCell>
                          <TableCell className="text-sm">
                            {unitCount > 0 ? (
                              <Badge variant="outline" className="text-xs">
                                {unitCount}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {validation?.errors?.join('; ') || validation?.warnings?.join('; ')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {parsedData.length > 50 && (
                  <div className="p-2 text-center text-sm text-muted-foreground border-t">
                    ... e mais {parsedData.length - 50} registros
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Importing Stage */}
          {stage === 'importing' && progress && (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                <p className="font-medium">Importando legislações...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {progress.current} de {progress.total}
                </p>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              {progress.currentLegislation && (
                <p className="text-sm text-center text-muted-foreground truncate">
                  {progress.currentLegislation}...
                </p>
              )}
            </div>
          )}

          {/* Result Stage */}
          {stage === 'result' && importResult && (
            <div className="space-y-4">
              <Alert variant={importResult.success ? "default" : "destructive"}>
                <AlertDescription className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span>
                    {importResult.imported} legislações importadas
                    {importResult.unitCompliancesCreated > 0 && `, ${importResult.unitCompliancesCreated} avaliações por unidade`}
                    {importResult.errors > 0 && `, ${importResult.errors} erros`}
                    {importResult.warnings > 0 && `, ${importResult.warnings} avisos`}
                  </span>
                </AlertDescription>
              </Alert>

              {/* Unit compliance by branch */}
              {Object.keys(importResult.unitsByBranch).length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Avaliações importadas por unidade:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(importResult.unitsByBranch).map(([branch, count]) => (
                      <Badge key={branch} variant="secondary">
                        {branch}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Created entities */}
              {(importResult.createdEntities.themes.length > 0 || importResult.createdEntities.subthemes.length > 0) && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-1">Entidades criadas automaticamente:</p>
                  {importResult.createdEntities.themes.length > 0 && (
                    <p>• Temas: {importResult.createdEntities.themes.join(', ')}</p>
                  )}
                  {importResult.createdEntities.subthemes.length > 0 && (
                    <p>• Subtemas: {importResult.createdEntities.subthemes.join(', ')}</p>
                  )}
                </div>
              )}

              {/* Details */}
              <ScrollArea className="h-[250px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Linha</TableHead>
                      <TableHead className="w-[80px]">Status</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.details.map((detail, idx) => (
                      <TableRow
                        key={idx}
                        className={
                          detail.status === 'error'
                            ? 'bg-destructive/10'
                            : detail.status === 'warning'
                            ? 'bg-yellow-500/10'
                            : ''
                        }
                      >
                        <TableCell className="font-mono text-sm">{detail.rowNumber}</TableCell>
                        <TableCell>
                          {detail.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {detail.status === 'updated' && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                          {detail.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                          {detail.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm" title={detail.title}>
                          {detail.title}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{detail.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          {stage === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {stage === 'mapping' && (
            <>
              <Button variant="outline" onClick={resetState}>
                Voltar
              </Button>
              <Button
                onClick={handleContinueFromMapping}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Continuar ({mappedUnitsCount} unidades mapeadas)
              </Button>
            </>
          )}

          {stage === 'preview' && (
            <>
              <Button variant="outline" onClick={() => {
                if (detectedUnitColumns.length > 0) {
                  setStage('mapping');
                } else {
                  resetState();
                }
              }}>
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || isProcessing}
              >
                Importar {validCount} legislações
              </Button>
            </>
          )}

          {stage === 'result' && (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
