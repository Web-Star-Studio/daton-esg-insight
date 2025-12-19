import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Users,
  Building2,
  Briefcase,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  parseEmployeeExcel, 
  validateEmployees, 
  importEmployees, 
  downloadEmployeeTemplate,
  type ParsedEmployee,
  type EmployeeValidation,
  type ImportResult,
  type ImportProgress
} from '@/services/employeeImport';
import { formErrorHandler } from '@/utils/formErrorHandler';

export function EmployeeImportSection() {
  const [parsedEmployees, setParsedEmployees] = useState<ParsedEmployee[]>([]);
  const [validations, setValidations] = useState<EmployeeValidation[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [step, setStep] = useState<'upload' | 'validate' | 'result'>('upload');
  
  // Import options
  const [skipExisting, setSkipExisting] = useState(true);
  const [createMissingEntities, setCreateMissingEntities] = useState(true);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setImportResult(null);
    
    try {
      const employees = await parseEmployeeExcel(file);
      setParsedEmployees(employees);
      
      // Get company ID for validation
      const { profile } = await formErrorHandler.checkAuth();
      const validationResults = await validateEmployees(employees, profile.company_id);
      setValidations(validationResults);
      
      setStep('validate');
      
      const validCount = validationResults.filter(v => v.isValid).length;
      const invalidCount = validationResults.filter(v => !v.isValid).length;
      const warningCount = validationResults.filter(v => v.warnings.length > 0).length;
      
      toast.success(`Arquivo processado: ${employees.length} registros`, {
        description: `${validCount} válidos, ${invalidCount} com erros, ${warningCount} com avisos`
      });
      
    } catch (error) {
      toast.error('Erro ao processar arquivo', {
        description: (error as Error).message
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const handleImport = async () => {
    setIsImporting(true);
    setImportProgress({ current: 0, total: parsedEmployees.length, percentage: 0, stage: 'preparing' });
    
    try {
      const result = await importEmployees(parsedEmployees, {
        skipExisting,
        createMissingEntities,
        onProgress: setImportProgress,
      });
      
      setImportResult(result);
      setStep('result');
      
      if (result.success) {
        toast.success(`Importação concluída!`, {
          description: `${result.imported} funcionários importados com sucesso`
        });
      } else {
        toast.warning(`Importação concluída com erros`, {
          description: `${result.imported} importados, ${result.errors} erros`
        });
      }
      
    } catch (error) {
      toast.error('Erro na importação', {
        description: (error as Error).message
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const handleReset = () => {
    setParsedEmployees([]);
    setValidations([]);
    setImportResult(null);
    setStep('upload');
  };

  const validCount = validations.filter(v => v.isValid).length;
  const invalidCount = validations.filter(v => !v.isValid).length;
  const warningCount = validations.filter(v => v.isValid && v.warnings.length > 0).length;

  // Get unique entities that will be created
  const uniqueDepartments = [...new Set(parsedEmployees.map(e => e.extractedDepartment).filter(Boolean))];
  const uniquePositions = [...new Set(parsedEmployees.map(e => e.cargo).filter(Boolean))];
  const uniqueBranches = [...new Set(parsedEmployees.map(e => e.extractedCity).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Importação de Funcionários</h2>
          <p className="text-sm text-muted-foreground">
            Importe funcionários a partir de uma planilha Excel
          </p>
        </div>
        <Button variant="outline" onClick={downloadEmployeeTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Baixar Template
        </Button>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload do Arquivo
            </CardTitle>
            <CardDescription>
              Arraste um arquivo Excel ou clique para selecionar. O arquivo deve conter as colunas: CPF, Nome, Nascimento, E-mail, Lotação, Cargo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                  <p className="text-muted-foreground">Processando arquivo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet className="w-12 h-12 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-primary font-medium">Solte o arquivo aqui...</p>
                  ) : (
                    <>
                      <p className="font-medium">Arraste um arquivo Excel aqui</p>
                      <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Validate */}
      {step === 'validate' && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{parsedEmployees.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Válidos</p>
                    <p className="text-2xl font-bold text-green-600">{validCount}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Com Avisos</p>
                    <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Com Erros</p>
                    <p className="text-2xl font-bold text-destructive">{invalidCount}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Entities to be created */}
          {createMissingEntities && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entidades a serem criadas</CardTitle>
                <CardDescription>
                  As seguintes entidades serão criadas automaticamente durante a importação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Departamentos ({uniqueDepartments.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {uniqueDepartments.slice(0, 5).map(dept => (
                        <Badge key={dept} variant="secondary" className="text-xs">{dept}</Badge>
                      ))}
                      {uniqueDepartments.length > 5 && (
                        <Badge variant="outline" className="text-xs">+{uniqueDepartments.length - 5}</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Cargos ({uniquePositions.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {uniquePositions.slice(0, 5).map(pos => (
                        <Badge key={pos} variant="secondary" className="text-xs">{pos}</Badge>
                      ))}
                      {uniquePositions.length > 5 && (
                        <Badge variant="outline" className="text-xs">+{uniquePositions.length - 5}</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Filiais ({uniqueBranches.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {uniqueBranches.slice(0, 5).map(branch => (
                        <Badge key={branch} variant="secondary" className="text-xs">{branch}</Badge>
                      ))}
                      {uniqueBranches.length > 5 && (
                        <Badge variant="outline" className="text-xs">+{uniqueBranches.length - 5}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validação dos Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left p-2">Linha</th>
                      <th className="text-left p-2">CPF</th>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validations.map((validation, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{validation.rowNumber}</td>
                        <td className="p-2 font-mono text-xs">{validation.cpf}</td>
                        <td className="p-2">{validation.nome}</td>
                        <td className="p-2">
                          {validation.isValid ? (
                            validation.warnings.length > 0 ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Aviso
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Válido
                              </Badge>
                            )
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Erro
                            </Badge>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="text-xs space-y-1">
                            {validation.errors.map((err, i) => (
                              <p key={i} className="text-destructive">{err}</p>
                            ))}
                            {validation.warnings.map((warn, i) => (
                              <p key={i} className="text-yellow-600">{warn}</p>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Import Options & Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="skipExisting" 
                      checked={skipExisting}
                      onCheckedChange={(checked) => setSkipExisting(!!checked)}
                    />
                    <Label htmlFor="skipExisting" className="text-sm">
                      Ignorar CPFs já cadastrados
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="createEntities" 
                      checked={createMissingEntities}
                      onCheckedChange={(checked) => setCreateMissingEntities(!!checked)}
                    />
                    <Label htmlFor="createEntities" className="text-sm">
                      Criar departamentos/cargos/filiais automaticamente
                    </Label>
                  </div>
                </div>
                
                {!isImporting && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleImport} 
                      disabled={validCount === 0}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Importar {validCount} Funcionários
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Progress indicator */}
              {isImporting && importProgress && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Importando funcionários...</span>
                    <span className="text-sm text-muted-foreground">
                      {importProgress.current} de {importProgress.total}
                    </span>
                  </div>
                  <Progress value={importProgress.percentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {importProgress.currentEmployee || 'Preparando...'}
                    </span>
                    <span>{importProgress.percentage}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Step 3: Result */}
      {step === 'result' && importResult && (
        <>
          {/* Result Summary */}
          <Card className={importResult.success ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {importResult.success ? (
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                ) : (
                  <AlertTriangle className="w-12 h-12 text-yellow-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {importResult.success ? 'Importação Concluída!' : 'Importação Concluída com Avisos'}
                  </h3>
                  <p className="text-muted-foreground">
                    {importResult.imported} funcionários importados, {importResult.errors} erros, {importResult.warnings} avisos
                  </p>
                </div>
              </div>
              
              {/* Created entities summary */}
              {(importResult.createdEntities.departments.length > 0 || 
                importResult.createdEntities.positions.length > 0 || 
                importResult.createdEntities.branches.length > 0) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Entidades criadas automaticamente:</p>
                  <div className="flex flex-wrap gap-2">
                    {importResult.createdEntities.departments.length > 0 && (
                      <Badge variant="secondary">
                        <Building2 className="w-3 h-3 mr-1" />
                        {importResult.createdEntities.departments.length} departamentos
                      </Badge>
                    )}
                    {importResult.createdEntities.positions.length > 0 && (
                      <Badge variant="secondary">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {importResult.createdEntities.positions.length} cargos
                      </Badge>
                    )}
                    {importResult.createdEntities.branches.length > 0 && (
                      <Badge variant="secondary">
                        <MapPin className="w-3 h-3 mr-1" />
                        {importResult.createdEntities.branches.length} filiais
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes da Importação</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background border-b">
                    <tr>
                      <th className="text-left p-2">Linha</th>
                      <th className="text-left p-2">CPF</th>
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Mensagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.details.map((detail, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{detail.rowNumber}</td>
                        <td className="p-2 font-mono text-xs">{detail.cpf}</td>
                        <td className="p-2">{detail.nome}</td>
                        <td className="p-2">
                          {detail.status === 'success' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Sucesso
                            </Badge>
                          )}
                          {detail.status === 'warning' && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Aviso
                            </Badge>
                          )}
                          {detail.status === 'error' && (
                            <Badge variant="destructive">
                              Erro
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-xs">{detail.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              Nova Importação
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
